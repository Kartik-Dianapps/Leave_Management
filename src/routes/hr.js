const express = require("express");
const router = express.Router()
const bcrypt = require("bcrypt");
const Employee = require("../Models/Employee.js")
const { Holiday } = require("../Models/Holiday.js")
const { LeaveRequest } = require("../Models/LeaveRequest.js")
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/auth.js");
const { ObjectId } = require("mongodb")

// HR logout
router.post("/logout", verifyToken, async (req, res) => {
    try {
        res.clearCookie("Token");
        res.status(200);
        return res.json({ message: "Logout Successfully..." })
    }
    catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: "Logout Failed..." })
    }
})

// to get details of a particular employee
router.get("/employee/:id", verifyToken, async (req, res) => {

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
})

// fetch all leave request
router.get("/currentLeaveRequests", verifyToken, async (req, res) => {

    try {
        const leaveRequests = await LeaveRequest.find({ startDate: { $gte: new Date() }, isApprove: false })

        res.status(200);
        return res.json({ currentLeaveReq: leaveRequests, message: "Current Leave Requests" })

    }
    catch (error) {
        res.status(500);
        return res.json({ message: "Error occurred while fetching current leave Requests..." })
    }
})

// to add a public holiday
router.post("/addPublicHoliday", verifyToken, async (req, res) => {

    try {
        let data = req.body;

        let name = data.name;
        let date = data.date;

        const check = await Holiday.find({ name: name }).collation({ locale: "en", strength: 1 })

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
})

// to edit a holiday
router.patch("/editPublicHoliday/:id", verifyToken, async (req, res) => {

    try {

        let id = req.params.id;
        let data = req.body;

        let name = data.name;
        let date = data.date;

        const check = await Holiday.find({ name: name }).collation({ locale: "en", strength: 1 })

        if (check.length !== 0) {
            res.status(400);
            return res.json({ message: "This Holiday name is already exists give other name..." })
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
})

// to approve a leave request 
router.post("/approveRequest/:id", verifyToken, async (req, res) => {

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
})

// to reject a leave request 
router.post("/rejectRequest/:id", verifyToken, async (req, res) => {

    try {

        const id = req.params.id;
        // Case 2 - HR wants to disapprove a leave request

        // Step 1 - get an unapproved request
        const leaveReq = await LeaveRequest.findById(id);

        // Step 2 - remove it from db
        await LeaveRequest.deleteOne({ _id: new ObjectId(id) })

        // Update leaveRequest array of Employee
        const doc = await Employee.findOne({ leaveRequest: new ObjectId(id) })

        const arr = doc.leaveRequest.filter((id) => { return id !== new ObjectId(id) })

        await Employee.updateOne({ leaveRequest: new ObjectId(id) }, { $set: { leaveRequest: arr } })

        res.status(200)
        return res.json({ message: "Leave Request Rejected successfully..." })
    }
    catch (error) {
        console.log(error.message);
        res.status(500);
        return res.json({ message: "Error occurred while approving a leave request..." })
    }
})

// to create a leave request 
router.post("/applyLeave", verifyToken, async (req, res) => {

    try {
        const data = req.body;

        const employee = await Employee.findById(req.userId);

        if (!(employee.leaveBalance > 0)) {
            res.status(400)
            return res.json({ message: "Balance is less than 0..." })
        }

        if (data.leaveType === null || data.leaveType === undefined || data.leaveType === "" || data.leaveType.trim() === "") {
            res.status(400);
            return res.json({ message: "Leave Type cannot be null or undefined or empty string..." })
        }

        if (data.duration === null || data.duration === undefined || data.duration === "") {
            res.status(400);
            return res.json({ message: "Duration cannot be null or undefined or empty string..." })
        }

        if (data.duration > 2) {
            res.status(400);
            return res.json({ message: "Maximum leave you can apply for is 2 days..." })
        }

        if (data.comment === null || data.comment === undefined || data.comment === "" || data.leaveType.trim() === "") {
            res.status(400);
            return res.json({ message: "Comment cannot be null or undefined or empty string..." })
        }

        if (data.startDate === null || data.startDate === undefined || data.startDate === "") {
            res.status(400);
            return res.json({ message: "Start date cannot be null or undefined or empty string..." })
        }

        if (data.endDate === null || data.endDate === undefined || data.endDate === "") {
            res.status(400);
            return res.json({ message: "End Date cannot be null or undefined or empty string..." })
        }

        const holidays = await Holiday.find();
        let arr = [];
        holidays.forEach((holiday) => {
            arr.push(holiday.date.toDateString());
        })

        // check for an employee apply for leave on public holiday 
        const start = new Date(data.startDate).toDateString()
        const end = new Date(data.endDate).toDateString()

        if (arr.includes(start) || arr.includes(end)) {
            res.status(400);
            return res.json({ message: "Cannot apply for leave on public holiday..." })
        }

        // check for week days 
        if ((start.substring(0, 3) === 'Sun' || start.substring(0, 3) === 'Sat') || (end.substring(0, 3) === 'Sun' || end.substring(0, 3) === 'Sat')) {
            res.status(400);
            return res.json({ message: "Cannot apply for leave on week days..." })
        }

        if (data.role === null || data.role === undefined || data.role === "" || data.role.trim() === "") {
            res.status(400);
            return res.json({ message: "End Date cannot be null or undefined or empty string..." })
        }

        if (data.role !== "employee" && data.role !== "HR" && data.role !== "Management") {
            res.status(400);
            return res.json({ message: "Please enter a valid value from employee or HR or Management..." })
        }

        // Step 1 - Create a leave request 
        const leaveReq = await LeaveRequest.create(data);

        // Step 2 - Update the employee Leave Request array
        const emp = await Employee.updateOne(
            { _id: req.userId },
            { $push: { leaveRequest: leaveReq._id } }
        );

        res.status(200);
        return res.json({ Leave_request: leaveReq, message: "Leave Request Raised..." })
    }
    catch (error) {
        console.log(error.message);
        res.status(500)
        return res.json({ message: "Leave request failed to create..." })
    }
})

// to fetch all public holidays
router.get("/publicHolidays", verifyToken, async (req, res) => {

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
})

// to fetch data of all employees
router.get("/getAllEmployeesDetails", verifyToken, async (req, res) => {

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
})

module.exports = router