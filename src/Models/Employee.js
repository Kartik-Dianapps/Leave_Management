const mongoose = require("mongoose")
const leaveRequestSchema = require("./LeaveRequest.js")

const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true
    },
    role: {
        type: String,
        enum: ["employee", "HR", "Management"],
        required: true
    },
    phone: {
        type: Number,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    leaveBalance: {
        type: Number,
        default: 2
    },
    leaveRequest: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "LeaveRequest"
    }]

}, { timestamps: true })

const Employee = mongoose.model("Employee", employeeSchema);
module.exports = Employee