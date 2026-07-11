const User = require ('.../models/users');
const bcrypt = require('bycrypt');
const JWT = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body

        // Validate user input
        if (!email || !password) {
            return res.status(400).json({ message: 'Please enter your email and password.' });
        }

        // Check for user in database
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ message: 'Email/Password incorrect' });
        }
        
        // Check user submitted password to hash password
        const isMatch = await bycrpt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Password invalid' });
        }

        // Create and sign a JWT
        const payload = { userId: user.id, role: user.role };
        const token = JWT.sign (
            payload,
            process.env.JWT_SECRET || 'your_fallback_secret',
            { expiresIn: '1h'} // Token will expire in 1 hour
        );

        // Send back token along with non-sensitive user data
        return res.status(200).json({
            message: 'Login successful.',
            token: `Bearer ${token}`, // NOTE: Back ticks not single quote
            user: { id: user.id, email: user.email }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server Error' });
    }
}

exports.logout = async(req, res) => {
    try {
        return res.status(200).json({
            message: 'Logout Successful'
        });
    } catch (error) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error' });
    }
}
