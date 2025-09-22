const mongoose = require("mongoose");
const holidaySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee"
    }
})

const Holiday = mongoose.model("Holiday", holidaySchema)
module.exports = { holidaySchema, Holiday }