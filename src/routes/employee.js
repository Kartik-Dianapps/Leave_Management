const express = require("express");
const router = express.Router()
const verifyToken = require("../middleware/auth.js");
const { register, login, logout, applyLeave, getAllEmployeesDetails, publicHolidays, currentLeave, pastLeave } = require("../Controller/employeeController.js");

// to register an employee 
router.post("/register", register)

// employee login
router.post("/login", login)

// employee logout
router.post("/logout", verifyToken(), logout)

// to create a leave request 
router.post("/applyLeave", verifyToken(["employee", "HR"]), applyLeave)

// to fetch past leave request
router.get("/pastLeave", verifyToken(["employee", "HR"]), pastLeave)

// to fetch current leave request
router.get("/currentLeave", verifyToken(["employee", "HR"]), currentLeave)

// to fetch all public holidays
router.get("/publicHolidays", verifyToken(), publicHolidays)

// to fetch data of all employees
router.get("/getAllEmployeesDetails", verifyToken(), getAllEmployeesDetails)

module.exports = router