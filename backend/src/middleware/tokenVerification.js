const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {

    if (!process.env.JWT_SECRET) {
        console.error("CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing!");
        return res.status(500).json({ message: 'Internal server configuration error' });
    }
    
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
        return res.status(401).json({ message: 'Access Denied: Header must follow standard Bearer schema' });
    }

    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token missing' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            const isExpired = err.name === 'TokenExpiredError';
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = decoded;
        next();
    });
}
module.exports = { authenticateToken };