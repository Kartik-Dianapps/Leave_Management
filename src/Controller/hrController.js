const Employee = require("../Models/Employee.js")
const { Holiday } = require("../Models/Holiday.js")
const { LeaveRequest } = require("../Models/LeaveRequest.js")
const { ObjectId } = require("mongodb")

const getEmployee = async (req, res) => {

    try {
        const id = req.params.id;

        const emp = await Employee.findById(id).populate('leaveRequest')

        if (!emp) {
            res.status(400);
            return res.json({ message: "Employee not found..." })
        }

        res.status(200);
        return res.json({ Employee: { name: emp.name, email: emp.email, role: emp.role, phone: emp.phone, leaveBalance: emp.leaveBalance, leaveRequest: emp.leaveRequest }, message: "Employee Details fetched Successfully..." })
    }
    catch (error) {
        console.log(error.message);
        return res.json({ message: "Error occurred while fetching the details" })
    }
}

const currentLeavesRequests = async (req, res) => {
    try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const employees = await Employee.find({ role: "employee" }).populate('leaveRequest');

        let currentLeaves = [];

        employees.forEach(emp => {
            emp.leaveRequest.forEach(lr => {
                const leaveStart = new Date(lr.startDate);
                const leaveEnd = new Date(lr.endDate);
                leaveStart.setUTCHours(0, 0, 0, 0);
                leaveEnd.setUTCHours(0, 0, 0, 0);

                if (!lr.isApprove && !lr.isRejected && ((leaveStart <= today && leaveEnd >= today) || leaveStart > today)) {
                    currentLeaves.push({
                        employee: {
                            name: emp.name,
                            role: emp.role,
                            leaveBalance: emp.leaveBalance
                        },
                        leave: lr
                    });
                }
            });
        });

        return res.status(200).json({ currentLeaveReq: currentLeaves, message: "Current Employee Leave Requests fetched successfully..." });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: "Error occurred while fetching current employee leave requests..." });
    }
};

const addPublicHoliday = async (req, res) => {
    // I'm able to create holiday for a past leave 
    try {
        let data = req.body;

        let name = data.name;
        let date = data.date;

        if (name === null || name === undefined || name === "" || name.trim() === "") {
            res.status(400);
            return res.json({ message: "Name of Holiday is mandatory..." })
        }

        if (date === null || date === undefined || date === "" || date.trim() === "") {
            res.status(400);
            return res.json({ message: "Date of Holiday is mandatory..." })
        }

        // check for if there is a leave request applied on that holiday
        const leaves = await LeaveRequest.find({ isApprove: true, startDate: { $lte: new Date(date) }, endDate: { $gte: new Date(date) } })

        for (let i = 0; i < leaves.length; i++) {
            let leave = leaves[i];

            await Employee.updateOne({ leaveRequest: leave._id }, { $inc: { leaveBalance: leave.duration } })
            await LeaveRequest.updateOne({ _id: leave._id }, { $set: { isRejected: true, isApprove: false } })
        }

        const check = await Holiday.find({ name: name, date: new Date(date) }).collation({ locale: "en", strength: 1 })

        if (check.length !== 0) {
            res.status(400);
            return res.json({ message: "Cannot add same Holiday again on same date..." })
        }

        // Can apply only after today date but not on today date
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const newDate = new Date(date);

        if (newDate <= today) {
            return res.status(400).json({ message: "Cannot apply holiday on past days and today..." })
        }

        data.createdBy = req.userId;

        const newHoliday = await Holiday.create(data)

        res.status(200);
        return res.json({ newHoliday: newHoliday, message: "Public Holiday is created successfully..." })
    }
    catch (error) {
        console.log(error.message);
        res.status(500);
    }
}

const editPublicHoliday = async (req, res) => {

    try {

        let id = req.params.id;
        let data = req.body;

        let name = data.name;
        let date = data.date;

        const holidayById = await Holiday.findById(id);

        if (!holidayById) {
            return res.status(404).json({ message: "Please provide a valid id..." })
        }

        if (name !== undefined) {
            if (name === null) {
                res.status(400);
                return res.json({ message: "If you want to update name Please don't provide null..." })
            }
            else if (name === "") {
                res.status(400);
                return res.json({ message: "If you want to update name Please don't provide empty string..." })
            }
            else if (name.trim() === "") {
                res.status(400);
                return res.json({ message: "If you want to update name Please don't provide empty string..." })
            }
        }

        if (date !== undefined) {
            if (date === null) {
                res.status(400);
                return res.json({ message: "If you want to update date Please don't provide null..." })
            }
            else {
                const today = new Date();
                today.setUTCHours(0, 0, 0, 0);

                const newDate = new Date(date);

                if (newDate <= today) {
                    return res.status(400).json({ message: "Cannot apply holiday on past days and today..." })
                }
            }
        }
        const check = await Holiday.findOne({ _id: { $ne: new ObjectId(id) }, name: (name ? name : holidayById.name), date: (date ? new Date(date) : holidayById.date) }).collation({ locale: "en", strength: 1 })

        if (check) {
            res.status(400);
            return res.json({ message: "Holiday with the same name already exists on this date..." })
        }

        const updateCheck = await Holiday.updateOne({ _id: new ObjectId(id) }, { $set: { name: name ? name : holidayById.name, date: date ? date : holidayById.date } })

        if (updateCheck.modifiedCount === 0) {
            return res.status(200).json({ message: "No updates are made..." })
        }
        if (date) {
            // check if an employee already placed a leave on updated date then
            const leaves = await LeaveRequest.find({ isApprove: true, startDate: { $lte: new Date(date) }, endDate: { $gte: new Date(date) } })

            for (let i = 0; i < leaves.length; i++) {
                let leave = leaves[i];

                await Employee.updateOne({ leaveRequest: leave._id }, { $inc: { leaveBalance: leave.duration } })
                await LeaveRequest.updateOne({ _id: leave._id }, { $set: { isRejected: true, isApprove: false } })
            }
        }
        const updatedHoliday = await Holiday.findById(id);

        res.status(200);
        return res.json({ updatedHoliday: updatedHoliday, message: "Public Holiday is updated successfully..." })
    }
    catch (error) {
        console.log(error);
        res.status(500);
        return res.json({ message: "Error Occurred while updating the document..." })
    }
}

const approveRequest = async (req, res) => {
    try {
        const id = req.params.id;
        const leaveReq = await LeaveRequest.findById(id);

        if (!leaveReq) {
            return res.status(404).json({ message: "Leave request not found" });
        }

        // Role-check
        if (req.role === "HR" && leaveReq.role !== "employee") {
            return res.status(400).json({ message: "Cannot approve leave request of other than employees..." });
        }
        if (req.role === "Management" && leaveReq.role !== "HR") {
            return res.status(400).json({ message: "Cannot approve leave request of other than HRs..." });
        }

        if (leaveReq.isApprove === true) {
            return res.status(400).json({ message: "Leave Request already approved..." });
        }

        const employee = await Employee.findOne({ leaveRequest: new ObjectId(id) });
        if (!employee) {
            return res.status(404).json({ message: "Employee not found for this leave request" });
        }

        // Step 1 - Approve leave request
        await LeaveRequest.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    isApprove: true,
                }
            }
        );

        // Step 2 - Deduct leave balance
        await Employee.updateOne(
            { _id: employee._id },
            { $inc: { leaveBalance: -leaveReq.duration } }
        );

        return res.status(200).json({ message: "Leave Request approved successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error occurred while approving a leave request..." });
    }
};

const rejectRequest = async (req, res) => {
    try {
        const id = req.params.id;
        const leaveReq = await LeaveRequest.findById(id);

        if (!leaveReq) {
            return res.status(404).json({ message: "Leave request not found" });
        }

        // Role checks
        if (req.role === "HR" && leaveReq.role !== "employee") {
            return res.status(400).json({ message: "Cannot reject leave request of other than employees..." });
        }
        if (req.role === "Management" && leaveReq.role !== "HR") {
            return res.status(400).json({ message: "Cannot reject leave request of other than HRs..." });
        }

        if (leaveReq.isRejected === true) {
            return res.status(400).json({ message: "Leave request already rejected" })
        }

        const employee = await Employee.findOne({ leaveRequest: new ObjectId(id) });
        if (!employee) {
            return res.status(404).json({ message: "Employee not found for this leave request" });
        }

        // Refund balance if already approved
        if (leaveReq.isApprove === true) {
            await Employee.updateOne(
                { _id: employee._id },
                { $inc: { leaveBalance: leaveReq.duration } }
            );
        }

        await LeaveRequest.updateOne(
            { _id: new ObjectId(id) },
            { $set: { isApprove: false, isRejected: true } }
        );

        return res.status(200).json({ message: "Leave Request rejected successfully" });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: "Error occurred while rejecting a leave request" });
    }
};

module.exports = { getEmployee, currentLeavesRequests, addPublicHoliday, editPublicHoliday, approveRequest, rejectRequest }