const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.token;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SEC, (err, user) => {
            if (err) return res.status(403).json({ message: 'Invalid token' });
            req.user = user;
            next();
        });
    } else {
        return res.status(401).json("Unauthorized!");
    }
}

const verifyTokenAndAuthorize = (req, res, next) => {
    verifyToken(req, res, () => {
        console.log(req.params.uid)
        if (req.user.id === req.params.uid || req.user.isAdmin) {
            next();
        } else {
            return res.status(403).json("You are not allowed to do that!");
        }
    });
}

const verifyTokenAndAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.isAdmin) {
            next();
        } else {
            return res.status(403).json("You are not allowed to do that!");
        }
    });
}

module.exports = { verifyToken, verifyTokenAndAuthorize, verifyTokenAndAdmin };