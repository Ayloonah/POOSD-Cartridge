
const bcrypt = require('bcrypt'); // Import the bcrypt library for password hashing

const hashPassword = async (next) => {
    // "this" refers to the user document being saved
    if (!this.isModified('password')) {
        return next();
    }
    // async bycrypt steps wrapped in try/catch block to handle errors
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next(); // To proceed to the next middleware or save operation
    } catch (error) {
        next(error); // Pass the error to the next middleware for handling
    }
};

module.exports = hashPassword;