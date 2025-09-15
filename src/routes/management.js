const express = require("express");
const router = express.Router()
const Employee = require("../Models/Employee.js")
const Holiday = require("../Models/Holiday.js")
const { LeaveRequest } = require("../Models/LeaveRequest.js")
const verifyToken = require("../middleware/auth.js");
const { ObjectId } = require("mongodb");
const { pastLeave, currentLeaveRequests, approveRequest, rejectRequest, getAllEmployeesDetails } = require("../Controller/managementController.js");

// to get all past leaves 
router.get("/pastLeave", verifyToken("Management"), pastLeave)

// to get all current leave requests
router.get("/currentLeaveRequests", verifyToken("Management"), currentLeaveRequests)

// to approve a leave request 
router.post("/approveRequest/:id", verifyToken("Management"), approveRequest)

// to reject a leave request 
router.post("/rejectRequest/:id", verifyToken("Management"), rejectRequest)

// to fetch data of all employees
router.get("/getAllEmployeesDetails", verifyToken("Management"), getAllEmployeesDetails)

module.exports = router