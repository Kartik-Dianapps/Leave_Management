const express = require("express");
const router = express.Router()
const verifyToken = require("../middleware/auth.js");
const { getEmployee, currentLeavesRequests, addPublicHoliday, editPublicHoliday, approveRequest, rejectRequest, publicHolidays, getAllEmployeesDetails } = require("../Controller/hrController.js");

// to get details of a particular employee
router.get("/employee/:id", verifyToken("HR"), getEmployee)

// fetch all leave request
router.get("/currentLeaveRequests", verifyToken("HR"), currentLeavesRequests)

// to add a public holiday
router.post("/addPublicHoliday", verifyToken("HR"), addPublicHoliday)

// to edit a holiday
router.patch("/editPublicHoliday/:id", verifyToken("HR"), editPublicHoliday)

// to approve a leave request 
router.post("/approveRequest/:id", verifyToken(["HR", "Management"]), approveRequest)

// to reject a leave request 
router.post("/rejectRequest/:id", verifyToken(["HR", "Management"]), rejectRequest)

module.exports = router