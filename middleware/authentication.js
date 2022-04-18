const jwt = require("jsonwebtoken");
require('dotenv').config()


exports.isAuth = async (req, res, next) => {
    const accessToken = req.headers["authorization"];
    if (!accessToken) {
        return res.status(200).json({
            status: "Error",
            code: "NOT_FOUND",
            message: "Cannot found access token",
            data: null,
        });
    }
    try {
        let verified = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        req.id = verified.payload.idUser;
        req.email = verified.payload.email;
        next();
    } catch (error) {
        console.log(error);
        return res.status(200).json({
            status: "Error",
            code: "UNAUTHORIZED",
            message: "You must login to continue",
            data: null,
        });
    }
};
