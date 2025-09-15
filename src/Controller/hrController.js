const Employee = require("../Models/Employee.js")
const { Holiday } = require("../Models/Holiday.js")
const { LeaveRequest } = require("../Models/LeaveRequest.js")
const { ObjectId } = require("mongodb")
const Session = require("../Models/SessionModel.js")

const logout = async (req, res) => {
    try {
        await Session.deleteOne({ userId: req.userId })
        res.status(200);
        return res.json({ message: "Logout Successfully..." })
    }
    catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: "Logout Failed..." })
    }
}

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
        const leaveRequests = await LeaveRequest.find({ isApprove: false })

        res.status(200);
        return res.json({ currentLeaveReq: leaveRequests, message: "Current Leave Requests" })

    }
    catch (error) {
        res.status(500);
        return res.json({ message: "Error occurred while fetching current leave Requests..." })
    }
}

const addPublicHoliday = async (req, res) => {

    try {
        let data = req.body;

        let name = data.name.trim();
        let date = data.date.trim();

        const check = await Holiday.find({ name: name, date: new Date(date) }).collation({ locale: "en", strength: 1 })

        if (check.length !== 0) {
            res.status(400);
            return res.json({ message: "Cannot add same name Holiday..." })
        }

        if (name === null || name === undefined || name === "" || name.trim() === "") {
            res.status(400);
            return res.json({ message: "Name of Holiday is mandatory..." })
        }

        if (date === null || date === undefined || name === "" || name.trim() === "") {
            res.status(400);
            return res.json({ message: "Date of Holiday is mandatory..." })
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

        const check = await Holiday.find({ name: name, date: new Date(date) }).collation({ locale: "en", strength: 1 })

        if (check.length !== 0) {
            res.status(200);
            return res.json({ message: "No new updates are made..." })
        }

        const holiday = await Holiday.findById(id);
        if (!holiday) {
            res.status(400);
            return res.json({ message: "Please provide a valid Holiday id..." })
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
                return res.json({ message: "If you want to update name Please don't provide empty string...S" })
            }
        }

        if (date !== undefined) {
            if (date === null) {
                res.status(400);
                return res.json({ message: "If you want to update name Please don't provide null..." })
            }
            else if (name === "") {
                res.status(400);
                return res.json({ message: "If you want to update name Please don't provide empty string..." })
            }
            else if (name.trim() === "") {
                res.status(400);
                return res.json({ message: "If you want to update name Please don't provide empty string...S" })
            }
        }

        await Holiday.updateOne({ _id: new ObjectId(id) }, { $set: { name: name, date: date } })

        const updatedHoliday = await Holiday.findById(id);

        res.status(200);
        return res.json({ updatedHoliday: updatedHoliday, message: "Public Holiday is created successfully..." })
    }
    catch (error) {
        console.log(error.message);
        res.status(500);
        return res.json({ message: "Error Occurred while updating the document..." })
    }
}

const approveRequest = async (req, res) => {

    try {

        const id = req.params.id;
        // Case 1 - HR wants to approve a leave request

        // Step 1 - get an unapproved request
        const leaveReq = await LeaveRequest.findById(id);

        // Step 2 - approve it by marking it to true
        await LeaveRequest.updateOne({ _id: new ObjectId(id) }, { $set: { isApprove: true } })

        // Step 3 - update balance
        const document = await Employee.findOne({ leaveRequest: new ObjectId(id) });
        console.log(document);

        const sub = document.leaveBalance - leaveReq.duration;

        console.log(sub);

        await Employee.updateOne({ leaveRequest: new ObjectId(id) }, { $set: { leaveBalance: sub } })

        res.status(200)
        return res.json({ message: "Leave Request approved successfully..." })
    }
    catch (error) {
        console.log(error);
        res.status(500);
        return res.json({ message: "Error occurred while approving a leave request..." })
    }
}

const rejectRequest = async (req, res) => {

    try {

        const id = req.params.id;
        // Case 2 - HR wants to disapprove a leave request

        // Step 1 - get an unapproved request
        const leaveReq = await LeaveRequest.findById(id);

        // Step 2 - remove it from db
        await LeaveRequest.deleteOne({ _id: new ObjectId(id) })

        // Update leaveRequest array of Employee
        const doc = await Employee.findOne({ leaveRequest: new ObjectId(id) })

        let arr = [];
        doc.leaveRequest.forEach((id1) => {
            if (id1.toString() !== id) {
                arr.push(id1)
            }
        })

        await Employee.updateOne({ leaveRequest: new ObjectId(id) }, { $set: { leaveRequest: arr } })

        res.status(200)
        return res.json({ message: "Leave Request Rejected successfully..." })
    }
    catch (error) {
        console.log(error.message);
        res.status(500);
        return res.json({ message: "Error occurred while approving a leave request..." })
    }
}

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
        let docs = await Employee.find({ $or: [{ role: "HR" }, { role: "employee" }] }, { name: 1, role: 1 }).sort({ role: 1 })

        res.status(200);
        return res.json({ data: docs, message: "All Employees data Fetched successfully..." })
    }
    catch (error) {
        console.log(error.message);
        res.status(500);
        return res.json({ message: "Error occurred while fetching all details of employees..." })
    }
}

module.exports = { getEmployee, currentLeavesRequests, addPublicHoliday, editPublicHoliday, approveRequest, rejectRequest, publicHolidays, getAllEmployeesDetails, logout }