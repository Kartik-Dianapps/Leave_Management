const express = require("express");
const router = express.Router()
const bcrypt = require("bcrypt");
const Employee = require("../Models/Employee.js")
const Holiday = require("../Models/Holiday.js")
const { LeaveRequest } = require("../Models/LeaveRequest.js")
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/auth.js");
const ObjectId = require("mongodb")

router.post("/register", async (req, res) => {

    try {
        const data = req.body;

        if (data.name === null || data.name === undefined || data.name === "" || data.name.trim() === "") {
            res.status(400);
            return res.json({ message: "name field is mandatory..." })
        }

        if (data.email === null || data.email === undefined || data.email === "" || data.email.trim() === "") {
            res.status(400);
            return res.json({ message: "email field is mandatory..." })
        }

        if (data.role === null || data.role === undefined || data.role === "" || data.role.trim() === "") {
            res.status(400);
            return res.json({ message: "role field is mandatory..." })
        }

        if (data.role !== "employee" && data.role !== "HR" && data.role !== "Management") {
            res.status(400);
            return res.json({ message: "Please enter a valid value from employee or HR or Management..." })
        }

        if (data.phone === null || data.phone === undefined || data.phone === "") {
            res.status(400);
            return res.json({ message: "phone field is mandatory..." })
        }

        if (data.password === null || data.password === undefined || data.password.trim() === "") {
            res.status(400);
            return res.json({ message: "password field is mandatory..." })
        }

        // hashing password
        const plainPswd = data.password;
        const hashedPswd = await bcrypt.hash(plainPswd, Number(process.env.SALT_ROUNDS))

        console.log(hashedPswd);
        data.password = hashedPswd;

        const emp = await Employee.create(data);

        if (emp) {
            res.status(201);
            return res.json({ employee: { name: data.name, email: data.email, role: data.role, phone: data.phone }, message: "Employee Created Successfully..." })
        }

    }
    catch (error) {
        console.log(error.message);
        res.status(500);
        return res.json({ message: "Registration Failed..." })
    }
})

router.post("/login", async (req, res) => {

    try {
        const data = req.body;

        if (data.email === null || data.email === undefined || data.email === "" || data.email.trim() === "") {
            res.status(400);
            return res.json({ message: "Please Enter a valid email..." })
        }

        if (data.password === null || data.password === undefined || data.password.trim() === "") {
            res.status(400);
            return res.json({ message: "Please Enter a valid password..." })
        }

        // email check
        const emp = await Employee.findOne({ email: data.email })
        if (!emp) {
            res.status(400);
            return res.json({ message: "Please enter correct email..." })
        }

        // password check 
        const pswdCheck = await bcrypt.compare(data.password, emp.password);
        if (!pswdCheck) {
            res.status(400);
            return res.json({ message: "Please enter correct password..." })
        }

        const token = await jwt.sign({ _id: emp._id, role: emp.role }, process.env.SECRET_KEY, { expiresIn: '1d' });
        res.cookie("Token", token, { httpOnly: true })

        res.status(200);
        return res.json({ message: "Login Successful...", name: emp.name, email: emp.email })

    }
    catch (error) {
        console.log(error.message);
        res.status(500);
        return res.json({ message: "Login Failed..." })
    }
})

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

// to fetch past leave request
router.get("/pastLeave", verifyToken, async (req, res) => {

    try {
        const id = req.userId;
        const emp = await Employee.findById(id).populate('leaveRequest')

        const arr = emp.leaveRequest.filter((doc) => {
            return doc.endDate < new Date()
        })
        res.status(200)
        return res.json({ pastLeaveRequests: arr, message: "Past Leave Requests fetched successfully..." })

    }
    catch (error) {
        console.log(error.message);
        res.status(500);
        return res.json({ message: "Error while fetching all past leave requests..." })
    }
})

// to fetch current leave request
router.get("/currentLeave", verifyToken, async (req, res) => {

    try {
        const id = req.userId;
        const emp = await Employee.findById(id).populate('leaveRequest')

        const arr = emp.leaveRequest.filter((doc) => {
            return doc.startDate >= new Date()
        })
        res.status(200)
        return res.json({ pastLeaveRequests: emp.leaveRequest, message: "Current Leave Requests fetched successfully..." })

    }
    catch (error) {
        console.log(error.message);
        res.status(500);
        return res.json({ message: "Error while fetching all current leave requests..." })
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

router.get("/getAllEmployeesDetails", verifyToken, async (req, res) => {

})

module.exports = router