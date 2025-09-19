const mongoose = require("mongoose")
const leaveRequestSchema = new mongoose.Schema({
    leaveType: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    comment: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    role: {
        type: "String",
        required: true
    },
    isApprove: {
        type: Boolean,
        default: false
    },
    isRejected: {
        type: Boolean,
        default: false
    }

}, { timestamps: true })

const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema)
module.exports = { leaveRequestSchema, LeaveRequest }

