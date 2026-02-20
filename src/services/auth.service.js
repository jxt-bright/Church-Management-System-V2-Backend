import jwt from 'jsonwebtoken';
import { User } from "../models/users_model.js";
import smsProvider from '../utils/smsProvider.utils.js';
import { PasswordReset } from '../models/passwordReset_model.js'


const authenticateUser = async (username, password) => {
    // Trim the username
    const cleanUsername = username ? username.trim() : "";

    // check if the user exists using username
    const user = await User.findOne({ username: cleanUsername });
    if (!user) {
        throw new Error("Invalid Credentials");
    };

    // compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new Error("Invalid Credentials");
    }

    const payload = {
        id: user._id,
        churchId: user.churchId,
        groupId: user.groupId,
        status: user.status
    };

    // Generate a JWT Access Token
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10m' });

    // Generate a JWT Refresh Token
    const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '12h' });

    // Store Refresh Token in database
    user.refreshToken = refreshToken;
    await user.save();

    return {
        user: payload,
        accessToken,
        refreshToken
    };
};

const refreshUserToken = (incomingRefreshToken) => {
    return new Promise((resolve, reject) => {
        // Verify if the refresh token is valid
        jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
            if (err) return reject(new Error("Forbidden"));

            // Find user by the ID inside the token
            const user = await User.findById(decoded.id).select("+refreshToken");
            if (!user) return reject(new Error("Forbidden"));

            // Ensure the provided token matches the stored one
            if (user.refreshToken !== incomingRefreshToken) {
                return reject(new Error("Forbidden"));
            }

            // Generate NEW Access Token
            const payload = { id: user._id, churchId: user.churchId, groupId: user.groupId, status: user.status }
            const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "10m" });

            resolve({
                user: payload,
                accessToken
            });
        });
    });
};


// Logout
const clearUserToken = async (refreshToken) => {
    // Find the user with this token and unset it
    const user = await User.findOne({ refreshToken });
    if (!user) return;

    user.refreshToken = "";
    await user.save();
};



const requestPasswordReset = async (credentials) => {
    const { username, phoneNumber } = credentials;
    const user = await User.findOne({ username: username })
        .populate({
            path: 'memberId',
            select: 'phoneNumber'
        });

    // Check if user exists and has an associated member with the same phone number
    if (!user) {
        const error = new Error("Invalid credentials");
        error.statusCode = 404;
        throw error;
    }

    if (!user.memberId || user.memberId.phoneNumber !== phoneNumber) {
        const error = new Error("Invalid credentials");
        error.statusCode = 400;
        throw error;
    }

    // Generate 4-digit code and send SMS
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await smsProvider.send(phoneNumber, `Hello, ${username}\nYour Password reset code is: ${code}.\nThis code is only valid for 10 minutes.`);

    // Save hashed code to DB with expiry
    await PasswordReset.deleteOne({ userId: user._id });
    const resetEntry = new PasswordReset({
        userId: user._id,
        code
    });
    await resetEntry.save();
}



const authenticateCode = async (credentials) => {
    const { username, code } = credentials
    // Find the user
    const user = await User.findOne({ username });
    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }

    //  Find the reset record for this user
    const resetRecord = await PasswordReset.findOne({ userId: user._id });

    if (!resetRecord) {
        const error = new Error("Invalid verification Code");
        error.statusCode = 400;
        throw error;
    }

    const isMatch = await resetRecord.compareCode(code);

    if (!isMatch) {
        const error = new Error("Invalid verification code");
        error.statusCode = 400;
        throw error;
    }

    return { valid: true };
};


const resetPassword = async (credentials) => {
    const { username, password } = credentials
    // Find the user
    const user = await User.findOne({ username });

    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }

    // Update the password field
    user.password = password;

    // Save the user
    await user.save();

    return { success: true, message: "Password updated successfully" };

};

export {
    authenticateUser,
    refreshUserToken,
    clearUserToken,
    requestPasswordReset,
    authenticateCode,
    resetPassword
};