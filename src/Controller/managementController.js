const Employee = require("../Models/Employee.js")
const { LeaveRequest } = require("../Models/LeaveRequest.js")
const { ObjectId } = require("mongodb")

const pastLeave = async (req, res) => {
    try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const employees = await Employee.find({ role: "HR" }).populate('leaveRequest');

        let pastLeaves = [];

        employees.forEach(emp => {
            emp.leaveRequest.forEach(lr => {
                const leaveEnd = new Date(lr.endDate);
                leaveEnd.setUTCHours(0, 0, 0, 0);

                if (leaveEnd < today) {
                    pastLeaves.push({
                        employee: { name: emp.name, role: emp.role, leaveBalance: emp.leaveBalance },
                        leave: lr
                    });
                }
            });
        });

        return res.status(200).json({ pastLeaveRequests: pastLeaves, message: "Past HR Leave Requests fetched successfully..." });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: "Error while fetching past HR leave requests..." });
    }
};

const currentLeaveRequests = async (req, res) => {
    try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const employees = await Employee.find({ role: "HR" }).populate('leaveRequest');

        let currentLeaves = [];

        employees.forEach(emp => {
            emp.leaveRequest.forEach(lr => {
                const leaveStart = new Date(lr.startDate);
                const leaveEnd = new Date(lr.endDate);
                leaveStart.setUTCHours(0, 0, 0, 0);
                leaveEnd.setUTCHours(0, 0, 0, 0);

                if (!lr.isApprove && !lr.isRejected && ((leaveStart <= today && leaveEnd >= today) || leaveStart > today)) {
                    currentLeaves.push({
                        employee: { name: emp.name, role: emp.role, leaveBalance: emp.leaveBalance },
                        leave: lr
                    });
                }
            });
        });

        return res.status(200).json({ currentLeaveReq: currentLeaves, message: "Current HR Leave Requests fetched successfully..." });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: "Error while fetching current HR leave requests..." });
    }
};

module.exports = { pastLeave, currentLeaveRequests }