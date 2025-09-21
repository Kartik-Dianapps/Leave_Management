const jwt = require("jsonwebtoken");
const Employee = require("../Models/Employee");
const Session = require("../Models/SessionModel");

const verifyToken = (role = ["employee", "HR", "Management"]) => {
    return async (req, res, next) => {
        try {

            let token = req.headers.authorization;
            if (!token || !token.startsWith("Bearer ")) {
                res.status(401);
                return res.json({ message: "Please Provide Token or Provided Token is invalid..." })
            }

            token = token.substring(token.indexOf(" ") + 1)
            const decoded = jwt.verify(token, process.env.SECRET_KEY);

            console.log(decoded);

            // check for when employee is already logged out
            const emp = await Session.findOne({ userId: decoded._id, token: token })
            if (!emp) {
                return res.status(401).json({ message: "Employee has already logged out with this token..." })
            }

            if (Array.isArray(role) && !role.includes(decoded.role)) {
                return res.status(403).json({ message: "Does not have access to this resource..." })
            }
            else {
                if (!Array.isArray(role) && decoded.role !== role) {
                    return res.status(403).json({ message: "Does not have access to this resource..." })
                }
            }

            req.userId = decoded._id;
            req.role = decoded.role;
            next();
        }
        catch (error) {
            console.log(error.message);
            if (error.name === "TokenExpiredError") {
                return res.status(400).json({ message: "Provided Token has Expired..." })
            }
            res.status(401).json({ message: "Invalid Token..." })
        }
    }
}

module.exports = verifyToken