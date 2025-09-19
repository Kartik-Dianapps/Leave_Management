const Employee = require("../Models/Employee.js")
const { Holiday } = require("../Models/Holiday.js")
const { LeaveRequest } = require("../Models/LeaveRequest.js")
const { ObjectId } = require("mongodb")

const getEmployee = async (req, res) => {

    try {
        const id = req.params.id;

        const emp = await Employee.findById(id)

        if (!emp) {
            res.status(400);
            return res.json({ message: "Employee not found..." })
        }

        res.status(200);
        return res.json({ Employee: emp, message: "Employee Details fetched Successfully..." })
    }
    catch (error) {
        console.log(error.message);
        return res.json({ message: "Error occurred while fetching the details" })
    }
}

const currentLeavesRequests = async (req, res) => {

    try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0)

        const leaveRequests = await LeaveRequest.find({ isApprove: false, isRejected: false, role: "employee", $or: [{ startDate: { $lte: today }, endDate: { $gte: today } }, { startDate: { $gt: today }, endDate: { $gt: today } }] })
        // HR will also get the leave requests of other HRs!
        res.status(200);
        return res.json({ currentLeaveReq: leaveRequests, message: "Current Leave Requests" })

    }
    catch (error) {
        res.status(500);
        return res.json({ message: "Error occurred while fetching current leave Requests..." })
    }
}

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

            let emp = await Employee.findOne({ leaveRequest: leave._id })
            let arr = [];
            emp.leaveRequest.filter((id1) => {
                if (id1.toString() !== leave._id.toString()) {
                    arr.push(id1);
                }
            })
            await Employee.updateOne({ leaveRequest: leave._id }, { $inc: { leaveBalance: leave.duration }, $set: { leaveRequest: arr } })
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
            return res.status(400).json({ message: "Please provide a valid id..." })
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
        const check = await Holiday.find({ _id: { $ne: new ObjectId(id) }, name: (name ? name : holidayById.name), date: (date ? new Date(date) : holidayById.date) }).collation({ locale: "en", strength: 1 })

        if (check.length !== 0) {
            res.status(400);
            return res.json({ message: "Same name Holiday already exists..." })
        }

        const updateCheck = await Holiday.updateOne({ _id: new ObjectId(id) }, { $set: { name: name ? name : holidayById.name, date: date ? date : holidayById.date } })

        if (updateCheck.modifiedCount === 0) {
            return res.status(200).json({ message: "No updates are made..." })
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

        // Role-based validation
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

        // Remove from employee's leaveRequest array
        const updatedArr = employee.leaveRequest.filter(
            (rid) => rid.toString() !== id
        );
        await Employee.updateOne(
            { _id: employee._id },
            { $set: { leaveRequest: updatedArr } }
        );

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

const publicHolidays = async (req, res) => {

    try {
        const holidays = await Holiday.find();
        res.status(200);
        return res.json({ Holidays: holidays, message: "Public Holidays fetched Successfully..." })

    }
    catch (error) {
        console.log(error.message);
        res.status(500);
        return res.json({ message: "Error while fetching all public holidays" })
    }
}

const getAllEmployeesDetails = async (req, res) => {

    try {
        let docs = await Employee.find({ $or: [{ role: "HR" }, { role: "employee" }] }, { name: 1, role: 1, email: 1 }).sort({ role: 1 })

        res.status(200);
        return res.json({ data: docs, message: "All Employees data Fetched successfully..." })
    }
    catch (error) {
        console.log(error.message);
        res.status(500);
        return res.json({ message: "Error occurred while fetching all details of employees..." })
    }
}

module.exports = { getEmployee, currentLeavesRequests, addPublicHoliday, editPublicHoliday, approveRequest, rejectRequest, publicHolidays, getAllEmployeesDetails }