const bcrypt = require('bcrypt');

const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

const verifyPassword = async (password, hashPassword) => {
    // Check user submitted password to hash password
    return await bcrypt.compare(password, hashPassword);
};

module.exports = { hashPassword, verifyPassword };
