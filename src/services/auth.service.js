import jwt from 'jsonwebtoken';
import { User } from "../models/users_model.js";

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



export {
    authenticateUser,
    refreshUserToken,
    clearUserToken
};