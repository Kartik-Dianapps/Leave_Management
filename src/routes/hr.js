const express = require("express");
const router = express.Router()
const verifyToken = require("../middleware/auth.js");
const { getEmployee, currentLeavesRequests, addPublicHoliday, editPublicHoliday, approveRequest, rejectRequest, publicHolidays, getAllEmployeesDetails } = require("../Controller/hrController.js");

// to get details of a particular employee
router.get("/employee/:id", verifyToken("HR"), getEmployee)

// fetch all leave request--
router.get("/currentLeaveRequests", verifyToken("HR"), currentLeavesRequests)

// to add a public holiday
router.post("/addPublicHoliday", verifyToken("HR"), addPublicHoliday)

// to edit a holiday
router.patch("/editPublicHoliday/:id", verifyToken("HR"), editPublicHoliday)

// to approve a leave request 
router.post("/approveRequest/:id", verifyToken("HR"), approveRequest)

// to reject a leave request 
router.post("/rejectRequest/:id", verifyToken("HR"), rejectRequest)

// to create a leave request 
// router.post("/applyLeave", verifyToken, async (req, res) => {

//     try {
//         const data = req.body;

//         const employee = await Employee.findById(req.userId);

//         if (!(employee.leaveBalance > 0)) {
//             res.status(400)
//             return res.json({ message: "Balance is less than 0..." })
//         }

//         if (data.leaveType === null || data.leaveType === undefined || data.leaveType === "" || data.leaveType.trim() === "") {
//             res.status(400);
//             return res.json({ message: "Leave Type cannot be null or undefined or empty string..." })
//         }

//         if (data.duration === null || data.duration === undefined || data.duration === "") {
//             res.status(400);
//             return res.json({ message: "Duration cannot be null or undefined or empty string..." })
//         }

//         if (data.duration > 2) {
//             res.status(400);
//             return res.json({ message: "Maximum leave you can apply for is 2 days..." })
//         }

//         if (data.comment === null || data.comment === undefined || data.comment === "" || data.leaveType.trim() === "") {
//             res.status(400);
//             return res.json({ message: "Comment cannot be null or undefined or empty string..." })
//         }

//         if (data.startDate === null || data.startDate === undefined || data.startDate === "") {
//             res.status(400);
//             return res.json({ message: "Start date cannot be null or undefined or empty string..." })
//         }

//         if (data.endDate === null || data.endDate === undefined || data.endDate === "") {
//             res.status(400);
//             return res.json({ message: "End Date cannot be null or undefined or empty string..." })
//         }

//         const holidays = await Holiday.find();
//         let arr = [];
//         holidays.forEach((holiday) => {
//             arr.push(holiday.date.toDateString());
//         })

//         // check for an employee apply for leave on public holiday 
//         const start = new Date(data.startDate).toDateString()
//         const end = new Date(data.endDate).toDateString()

//         if (arr.includes(start) || arr.includes(end)) {
//             res.status(400);
//             return res.json({ message: "Cannot apply for leave on public holiday..." })
//         }

//         // check for week days 
//         if ((start.substring(0, 3) === 'Sun' || start.substring(0, 3) === 'Sat') || (end.substring(0, 3) === 'Sun' || end.substring(0, 3) === 'Sat')) {
//             res.status(400);
//             return res.json({ message: "Cannot apply for leave on week days..." })
//         }

//         if (data.role === null || data.role === undefined || data.role === "" || data.role.trim() === "") {
//             res.status(400);
//             return res.json({ message: "End Date cannot be null or undefined or empty string..." })
//         }

//         if (data.role !== "employee" && data.role !== "HR" && data.role !== "Management") {
//             res.status(400);
//             return res.json({ message: "Please enter a valid value from employee or HR or Management..." })
//         }

//         // Step 1 - Create a leave request 
//         const leaveReq = await LeaveRequest.create(data);

//         // Step 2 - Update the employee Leave Request array
//         const emp = await Employee.updateOne(
//             { _id: req.userId },
//             { $push: { leaveRequest: leaveReq._id } }
//         );

//         res.status(200);
//         return res.json({ Leave_request: leaveReq, message: "Leave Request Raised..." })
//     }
//     catch (error) {
//         console.log(error.message);
//         res.status(500)
//         return res.json({ message: "Leave request failed to create..." })
//     }
// })

// to fetch all public holidays
router.get("/publicHolidays", verifyToken("HR"), publicHolidays)

// to fetch data of all employees
router.get("/getAllEmployeesDetails", verifyToken("HR"), getAllEmployeesDetails)

module.exports = router