const dotenv = require("dotenv").config()
const mongoose = require("mongoose");

async function connection() {
    try {
        await mongoose.connect(process.env.CONNECTION_STRING);
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = connection