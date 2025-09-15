const jwt = require("jsonwebtoken");
const Employee = require("../Models/Employee");
const Session = require("../Models/SessionModel");

const verifyToken = (role) => {
    return async (req, res, next) => {
        try {
            let token = req.headers.authorization;
            if (!token || !token.startsWith("Bearer ")) {
                res.status(401);
                return res.json({ message: "Please Enter Token or Provided Token is invalid..." })
            }

            token = token.substring(token.indexOf(" ") + 1)
            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            console.log(decoded);
            req.userId = decoded._id;

            // what if user is already logout then
            const emp = await Session.findOne({ userId: req.userId, token: token })
            if (!emp) {
                return res.status(400).json({ message: "User has already logged out with this token..." })
            }

            if (decoded.role !== role) {
                return res.status(403).json({ message: "Does not have access to this resource..." })
            }
            req.role = decoded.role;
            next();
        }
        catch (error) {
            console.log(error.message);
            res.status(400).json({ message: "Invalid Token..." })
        }
    }
}

module.exports = verifyToken