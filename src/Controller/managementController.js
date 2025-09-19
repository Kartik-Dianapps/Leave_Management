const Employee = require("../Models/Employee.js")
const { LeaveRequest } = require("../Models/LeaveRequest.js")
const { ObjectId } = require("mongodb")

const pastLeave = async (req, res) => {

    try {
        let today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        // Step 1 - Fetch all leave request of HR using LeaveRequest
        const emp = await LeaveRequest.find({ role: "HR", endDate: { $lt: today } });

        res.status(200)
        return res.json({ pastLeaveRequests: emp, message: "Past Leave Requests fetched successfully..." })

    }
    catch (error) {
        console.log(error.message);
        res.status(500);
        return res.json({ message: "Error while fetching all past leave requests..." })
    }
}

const currentLeaveRequests = async (req, res) => {

    try {
        let today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const currentLeaves = await LeaveRequest.find({ role: "HR", isApprove: false, $or: [{ startDate: { $lte: today }, endDate: { $gte: today } }, { startDate: { $gt: today }, endDate: { $gt: today } }] });
        res.status(200);
        return res.json({ currentLeaveReq: currentLeaves, message: "Current Leave Requests" })

    }
    catch (error) {
        console.log(error.message);
        res.status(500);
        return res.json({ message: "Error Occurred while fetching the current leaves..." })
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

module.exports = { pastLeave, currentLeaveRequests, getAllEmployeesDetails }