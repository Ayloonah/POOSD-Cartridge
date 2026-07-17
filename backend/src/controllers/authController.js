const User = require ('../models/users');
const JWT = require('jsonwebtoken');
const crypto = require('crypto');

const { hashPassword } = require('../utils/hash');
const { verifyPassword } = require('../utils/hash');

const { sendVerificationEmail } = require('../utils/email');
const { sendPasswordResetEmail } = require('../utils/email');

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
        const isMatch = await verifyPassword(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Email/Password invalid' });
        }

        if (user.isVerified === false) {
            const newVerificationToken = crypto.randomBytes(20).toString('hex');
            
            user.verificationToken = newVerificationToken;
            try {
                await user.save();

                await sendVerificationEmail(user.email, newVerificationToken);

                return res.status(403).json({
                    success: false,
                    message: 'Your account has not yet been verified. A new verification link has been sent.'
                });
            } catch (emailError) {
                console.error("Non-fatal email resend warning:", emailError.message);

                return res.status(403).json({
                    success: false,
                    message: 'Your account is unverified. We attempted to route a new verfication link, but our mail delivery system is currently down. Please try again shortly.'
                });
            }
        }

        if (!process.env.JWT_SECRET) {
            console.error("FATAL: JWT_SECRET environment variable is missing!");
            return res.status(500).json({ message: 'Internal server configuration error '});
        }

        // Create and sign a JWT
        const payload = { userId: user.id, role: user.role };
        const token = JWT.sign (
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h'} // Token will expire in 1 hour
        );

        // Send back token along with non-sensitive user data
        return res.status(200).json({
            message: 'Login successful.',
            token: token,
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
        console.error(error);
        return res.status(500).json({ message: 'Server Error' });
    }
}

exports.register = async(req, res) => {
    try {
        const { username, password, email } = req.body

        // Validate user inputs
        if (!username || !password || !email) {
            return res.status(400).json ({ message: 'Please fill out all fields' });
        }

        // Check database to ensure user is NOT in database already with the email.
        const user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            return res.status(400).json({ message: 'Account already exists. Please sign in.' });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Calls utility for hashing the password
        const securePassword = await hashPassword(password);
        
        const newUser = await User.create({
            username: username,
            email: email.toLowerCase(),
            passwordHash: securePassword,
            verificationToken: verificationToken,
            isVerified: false
        });
        await sendVerificationEmail(newUser.email, verificationToken);
        res.status(201).json({message: 'Account added to DB.'})

    } catch (err) {
        console.error("CRITICAL EXCEPTION", err);
        res.status(500).json({error: 'Server-side error'});
    }
}

exports.forgotPassword = async(req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Please enter your email address' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        
        // For security purposes, even if the user doesn't exist, send a validation message
        if (!user) {
            return res.status(200).json({ message: 'A reset link has been sent to your email.'})
        }
        
        // Generate secure crypto token and add an expiration time 
        const token = crypto.randomBytes(32).toString('hex');
        const tokenExpiration = Date.now() + 600000; // 10 minutes before token expires

        // Save token value to database user doc
        user.resetPasswordToken = token;
        user.resetPasswordExpires = tokenExpiration;
        await user.save();

        await sendPasswordResetEmail(user.email, token);

        console.log(`👉 http://localhost:5000/api/auth/resetPassword?token=${token}`);

        return res.status(201).json({
            success: true, 
            message: 'Password Reset Email Sent!'
        });
        
    } catch (emailError) {
        console.error("Non-fatal error: Password reset email failed to send.", emailError.message);
        res.status(502).json({
            success: false,
            message: "The server generated the token, but failed to deliver the email notification. Please try again"
        })
    }
}

exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.query;
        const { newPassword } = req.body;
        const { confirmNewPassword } = req.body;

        if (!token || !newPassword || !confirmNewPassword) { 
            return res.status(400).json({ message: 'Missing required reset fields.'})
        }

        if (newPassword !== confirmNewPassword) {
            return res.status({ message: 'Password do NOT match! Please try again.' })
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() } //$gt means greater than current time"
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token.' })
        }

        const securePassword = await hashPassword(newPassword);
        user.passwordHash = securePassword;

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();
        return res.status(200).json({ message: 'Password updated! You may now log into your account.' })
    
    } catch (error) {
        console.error("ERROR RESETTING PASSWORD", error);
        return res.status(500).json({ message: 'Server error during password update.' })
    } 
}

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ message: 'Verfication token is missing.' });
        }

        const user = await User.findOne({ verificationToken: token});

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verfication token' });
        }

        user.isVerified = true;

        user.verificationToken = undefined;

        await user.save();

        return res.status(200).json({ message: 'Email verified! Welcome to CARTRIDGE. You may now sign in!' });
   
    } catch(err) {
        console.error("CRITICAL EXCEPTION", err);
        res.status(500).json({error: 'Server-side error'});
    }
}
