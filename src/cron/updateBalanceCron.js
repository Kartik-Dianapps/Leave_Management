const cron = require("node-cron");
const Employee = require("../Models/Employee");

function cronJobs() {
    cron.schedule('0 0 1 1 * *', async () => {
        try {
            await Employee.updateMany({ $or: [{ role: "HR" }, { role: "employee" }] }, { $inc: { leaveBalance: 2 } })
            console.log("Cron job is executed...");
        }
        catch (error) {
            console.log(error.message);
        }
    })
}

module.exports = cronJobs