const dotenv = require("dotenv").config()
const express = require("express");
const app = express();
const connection = require("./src/Connection/conn.js")
const employeeRouter = require("./src/routes/employee.js")
const hrRouter = require("./src/routes/hr.js")
const managementRouter = require("./src/routes/management.js")
const cookieParser = require("cookie-parser")

app.use(express.json())
app.use(cookieParser())

connection().then(() => {
    console.log("Connection Successful...");
}).catch((err) => {
    console.log(err.message);
})

app.use("/employee", employeeRouter);
app.use("/hr", hrRouter);
app.use("/management", managementRouter);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
})