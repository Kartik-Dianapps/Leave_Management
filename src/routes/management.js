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

module.exports = router