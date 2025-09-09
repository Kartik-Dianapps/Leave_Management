const express = require("express");
const router = express.Router()
const bcrypt = require("bcrypt");
const Employee = require("../Models/Employee.js")
const Holiday = require("../Models/Holiday.js")
const { LeaveRequest } = require("../Models/LeaveRequest.js")
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/auth.js");
const ObjectId = require("mongodb")

// Management logout
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

// to get all past leaves 
router.get("/pastLeave", verifyToken, async (req, res) => {

    try {

        // Step 1 - Fetch all leave request of HR using LeaveRequest
        const emp = await LeaveRequest.find({ role: "HR", endDate: { $lt: new Date() } });

        res.status(200)
        return res.json({ pastLeaveRequests: emp, message: "Past Leave Requests fetched successfully..." })

    }
    catch (error) {
        console.log(error.message);
        res.status(500);
        return res.json({ message: "Error while fetching all past leave requests..." })
    }
})

// to get all current leave requests
router.get("/currentLeaveRequests", verifyToken, async (req, res) => {

    try {

        const currentLeaves = await LeaveRequest.find({ role: "HR", startDate: { $gte: new Date() } });
        res.status(200);
        return res.json({ currentLeaveReq: currentLeaves, message: "Current Leave Requests" })

    }
    catch (error) {
        console.log(error.message);
        res.status(500);
        return res.json({ message: "Error Occurred while fetching the current leaves..." })
    }
})

// to approve a leave request 
router.post("/approveRequest/:id", verifyToken, async (req, res) => {

    try {

        const id = req.params.id;
        // Case 1 - Management wants to approve a leave request

        // Step 1 - get an unapproved request
        const leaveReq = await LeaveRequest.findById(id);

        // Step 2 - approve it by marking it to true
        await LeaveRequest.updateOne({ _id: new ObjectId(id) }, { $set: { isApprove: true } })

        // Step 3 - update balance
        const doc = Employee.find({ leaveRequest: new ObjectId(id) })

        doc.leaveBalance -= doc.duration;

        await doc.save();

        res.status(200)
        return res.json({ message: "Leave Request approved successfully..." })
    }
    catch (error) {
        console.log(error.message);
        res.status(500);
        return res.json({ message: "Error occurred while approving a leave request..." })
    }
})

// to reject a leave request 
router.post("/rejectRequest/:id", verifyToken, async (req, res) => {

    try {

        const id = req.params.id;
        // Case 2 - Management wants to reject a leave request

        // Step 1 - get an unapproved request
        const leaveReq = await LeaveRequest.findById(id);

        // Step 2 - remove it from db
        await LeaveRequest.deleteOne({ _id: new ObjectId(id) })

        // Update leaveRequest array of HR
        const doc = Employee.find({ leaveRequest: new ObjectId(id) })

        const arr = doc.leaveRequest.filter((id) => { return id !== new ObjectId(id) })

        doc.leaveRequest = arr;

        await doc.save();

        res.status(200)
        return res.json({ message: "Leave Request Rejected successfully..." })
    }
    catch (error) {
        console.log(error.message);
        res.status(500);
        return res.json({ message: "Error occurred while approving a leave request..." })
    }
})

// to fetch data of all employees
router.get("/getAllEmployeesDetails", verifyToken, async (req, res) => {

    try {
        let docs = await Employee.find({ $or: [{ role: "HR" }, { role: "employee" }] }, { $project: { name: 1, role: 1 } }).sort({ role: 1 })

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