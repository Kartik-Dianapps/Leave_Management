const jwt = require("jsonwebtoken")

const verifyToken = (req, res, next) => {
    try {
        let token = req.cookies.Token;
        if (!token) {
            res.status(401);
            return res.json({ message: "Please Enter Token..." })
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        console.log(decoded);
        req.userId = decoded._id;
        req.role = decoded.role;
        next();
    }
    catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Invalid Token..." })
    }
}

module.exports = verifyToken