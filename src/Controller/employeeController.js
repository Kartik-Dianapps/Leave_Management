const bcrypt = require("bcrypt");
const Employee = require("../Models/Employee.js")
const { Holiday } = require("../Models/Holiday.js")
const { LeaveRequest } = require("../Models/LeaveRequest.js")
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const Session = require("../Models/SessionModel.js");

const register = async (req, res) => {

    try {
        const data = req.body;

        if (data.name === null || data.name === undefined || data.name === "" || data.name.trim() === "") {
            res.status(400);
            return res.json({ message: "name field is mandatory..." })
        }

        data.name = data.name.trim();

        if (data.name.length < 3) {
            res.status(400);
            return res.json({ message: "Please provide name of minimum length 3..." })
        }

        if (data.email === null || data.email === undefined || data.email === "" || data.email.trim() === "") {
            res.status(400);
            return res.json({ message: "email field is mandatory..." })
        }

        data.email = data.email.trim();

        const emailExists = await Employee.find({ email: data.email }).collation({ locale: "en", strength: 1 })
        if (emailExists.length !== 0) {
            res.status(400);
            return res.json({ message: "Employee exists with this email..." })
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]{3,}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        const emailCheck = emailRegex.test(data.email)

        if (!emailCheck) {
            res.status(400);
            return res.json({ message: "Please provide a valid email..." })
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

        const phoneRegex = /^[6-9][0-9]{9}$/
        const validPhone = phoneRegex.test(data.phone)

        if (!validPhone) {
            res.status(400);
            return res.json({ message: "Please Enter valid phone Number..." })
        }

        if (data.password === null || data.password === undefined || data.password === "") {
            res.status(400);
            return res.json({ message: "password field is mandatory..." })
        }

        if (data.password.length < 8) {
            res.status(400);
            return res.json({ message: "Please Provide minimum 8 length password..." })
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
}

const login = async (req, res) => {

    try {
        const data = req.body;

        if (data.email === null || data.email === undefined || data.email === "" || data.email.trim() === "") {
            res.status(400);
            return res.json({ message: "Please Enter a valid email..." })
        }

        if (data.password === null || data.password === undefined || data.password === "") {
            res.status(400);
            return res.json({ message: "Please Enter a valid password..." })
        }

        // email check
        const employee = await Employee.findOne({ email: data.email })
        if (!employee) {
            res.status(400);
            return res.json({ message: "Please enter correct email..." })
        }

        // password check 
        const pswdCheck = await bcrypt.compare(data.password, employee.password);
        if (!pswdCheck) {
            res.status(400);
            return res.json({ message: "Please enter correct password..." })
        }

        const token = jwt.sign({ _id: employee._id, role: employee.role }, process.env.SECRET_KEY, { expiresIn: '1d' });

        const existingSession = await Session.findOne({ userId: employee._id })

        if (existingSession) {
            await Session.deleteOne({ userId: employee._id })
        }

        await Session.create({ userId: employee._id, token: token, tokenExpiry: new Date(Date.now() + (1 * 24 * 60 * 60 * 1000)) })

        res.status(200);
        return res.json({ message: "Login Successful...", name: employee.name, email: employee.email, token: token })

    }
    catch (error) {
        console.log(error.message);
        res.status(500);
        return res.json({ message: "Login Failed..." })
    }
}

const logout = async (req, res) => {
    try {
        await Session.deleteOne({ userId: req.userId })
        res.status(200);
        return res.json({ message: "Logout Successfully..." })
    }
    catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: "Logout Failed..." })
    }
}

const applyLeave = async (req, res) => {

    try {
        const data = req.body;

        const employee = await Employee.findById(req.userId).populate('leaveRequest');

        if (employee.leaveBalance === 0) {
            res.status(400)
            return res.json({ message: "Cannot apply for leave as balance is 0..." })
        }

        if (data.leaveType === null || data.leaveType === undefined || data.leaveType === "" || data.leaveType.trim() === "") {
            res.status(400);
            return res.json({ message: "Leave Type cannot be null or undefined or empty string..." })
        }
        data.leaveType = data.leaveType.trim();

        if (data.duration === null || data.duration === undefined || data.duration === "") {
            res.status(400);
            return res.json({ message: "Duration cannot be null or undefined or empty string..." })
        }

        if (data.duration <= 0) {
            return res.status(400).json({ message: "Cannot enter duration 0 or less than 0" })
        }

        if (data.duration > employee.leaveBalance) {
            res.status(400);
            return res.json({ message: `Maximum leave you can apply for is ${employee.leaveBalance} days...` })
        }

        if (data.comment === null || data.comment === undefined || data.comment === "" || data.comment.trim() === "") {
            res.status(400);
            return res.json({ message: "Comment cannot be null or undefined or empty string..." })
        }

        data.comment = data.comment.trim();

        if (data.startDate === null || data.startDate === undefined || data.startDate === "") {
            res.status(400);
            return res.json({ message: "Start date cannot be null or undefined or empty string..." })
        }

        if (data.endDate === null || data.endDate === undefined || data.endDate === "") {
            res.status(400);
            return res.json({ message: "End Date cannot be null or undefined or empty string..." })
        }

        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        startDate.setUTCHours(0, 0, 0, 0);
        endDate.setUTCHours(0, 0, 0, 0);

        if (startDate < today || endDate < today) {
            return res.status(400).json({ message: "Cannot apply leave for past days..." });
        }

        if (startDate > endDate) {
            return res.status(400).json({ message: "Start date cannot be greater than end Date..." });
        }

        const holidays = await Holiday.find();
        const holidayDates = new Set(holidays.map(h => new Date(h.date).toDateString()));

        // Check full range for weekends and holidays
        let current = new Date(startDate);
        let dayCount = 0;
        while (current <= endDate) {
            const dayStr = current.toDateString();
            const dayOfWeek = current.getDay(); // 0=Sun, 6=Sat

            if (holidayDates.has(dayStr)) {
                return res.status(400).json({ message: "Cannot apply leave on public holiday..." });
            }

            if (dayOfWeek === 0 || dayOfWeek === 6) {
                return res.status(400).json({ message: "Cannot apply leave on weekends..." });
            }

            dayCount++;
            current.setDate(current.getDate() + 1);
        }

        if (dayCount !== data.duration) {
            return res.status(400).json({ message: "Date range is not valid according to duration..." });
        }

        // Overlap check with existing leaves
        const leaves = employee.leaveRequest;
        for (let i = 0; i < leaves.length; i++) {
            const leave = leaves[i];
            const lStart = new Date(leave.startDate);
            const lEnd = new Date(leave.endDate);
            lStart.setUTCHours(0, 0, 0, 0);
            lEnd.setUTCHours(0, 0, 0, 0);

            const overlaps = startDate <= lEnd && endDate >= lStart && (leave.isApprove === true || (leave.isRejected === false && leave.isApprove === false));

            if (overlaps) {
                return res.status(400).json({ message: "Leave applied for this date or range of dates..." });
            }
        }

        data.role = req.role;

        // Step 1 - Create leave request
        const leaveReq = await LeaveRequest.create(data);

        // Step 2 - Update employee leaveRequest array
        await Employee.updateOne(
            { _id: req.userId },
            { $push: { leaveRequest: leaveReq._id } }
        );

        return res.status(200).json({ Leave_request: leaveReq, message: "Leave Request Raised..." });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: "Leave request failed to create..." });
    }
}

const pastLeave = async (req, res) => {

    try {
        const id = req.userId;
        const employee = await Employee.findById(id).populate('leaveRequest')
        console.log(employee);

        let today = new Date();
        today.setUTCHours(0, 0, 0, 0)

        let arr = [];

        arr = employee.leaveRequest.filter(doc => doc.endDate < today);

        console.log(arr);

        res.status(200)
        return res.json({ pastLeaveRequests: arr, message: "Past Leave Requests fetched successfully..." })

    }
    catch (error) {
        console.log(error.message);
        res.status(500);
        return res.json({ message: "Error while fetching all past leave requests..." })
    }
}

const currentLeave = async (req, res) => {

    try {
        const id = req.userId;
        const employee = await Employee.findById(id).populate('leaveRequest')

        let today = new Date();
        today.setUTCHours(0, 0, 0, 0)

        let arr = [];

        arr = employee.leaveRequest.filter(
            doc => (doc.startDate <= today && doc.endDate >= today) || (doc.startDate > today)
        );

        console.log(arr);

        res.status(200)
        return res.json({ currentLeaveRequests: arr, message: "Current Leave Requests fetched successfully..." })

    }
    catch (error) {
        console.log(error.message);
        res.status(500);
        return res.json({ message: "Error while fetching all current leave requests..." })
    }
}

const publicHolidays = async (req, res) => {

    try {
        const holidays = await Holiday.find({}, { _id: 0 });
        res.status(200);
        return res.json({ Holidays: holidays, message: "Public Holidays fetched Successfully..." })

    }
    catch (error) {
        console.log(error.message);
        res.status(500);
        return res.json({ message: "Error while fetching all public holidays" })
    }
}

const getAllEmployeesDetails = async (req, res) => {

    try {
        let docs = await Employee.find({ $or: [{ role: "HR" }, { role: "employee" }] }, { name: 1, role: 1, email: 1 }).sort({ role: 1 })

        res.status(200);
        return res.json({ data: docs, message: "All Employees data Fetched successfully..." })
    }
    catch (error) {
        console.log(error.message);
        res.status(500);
        return res.json({ message: "Error occurred while fetching all details of employees..." })
    }
}

module.exports = {
    register,
    login,
    logout,
    applyLeave,
    pastLeave,
    currentLeave,
    publicHolidays,
    getAllEmployeesDetails
}