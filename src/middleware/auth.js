const jwt = require("jsonwebtoken");
const Employee = require("../Models/Employee");

const verifyToken = (role) => {
    return (req, res, next) => {
        try {
            let token = req.cookies.Token;
            if (!token) {
                res.status(401);
                return res.json({ message: "Please Enter Token..." })
            }

            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            console.log(decoded);
            req.userId = decoded._id;

            if (decoded.role !== role) {
                return res.status(403).json({ message: "Does not have access to this resource..." })
            }
            req.role = decoded.role;
            next();
        }
        catch (error) {
            console.log(error.message);
            res.status(500).json({ message: "Invalid Token..." })
        }
    }
}

module.exports = verifyToken