import * as authService from '../services/auth.service.js';

// User login endpoint
const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        const result = await authService.authenticateUser(username, password);

        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,              // can't access via JS
            secure: process.env.NODE_ENV === "production",  // only over HTTPS in prod
            sameSite: "Strict",          // or "None" if cross-site
            maxAge: 12 * 60 * 60 * 1000 // 12 hrs
        });

        // Send response with generated tokens
        res.status(200).json({
            success: true,
            message: "User Logged In",
            user: result.user,
            accessToken: result.accessToken,
        });

    } catch (error) {
        if (error.message === "Invalid Credentials") {
            return res.status(400).json({ message: "Invalid Credentials" });
        }
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// Refresh Token endpoint
const refreshToken = async (req, res) => {
    try {
        const cookies = req.cookies;

        // Check for refreshToken
        if (!cookies?.refreshToken) return res.status(401).json({ message: "Unauthorized" });

        const result = await authService.refreshUserToken(cookies.refreshToken);

        // Send new Access Token
        res.status(200).json({
            success: true,
            user: result.user,
            accessToken: result.accessToken,
        });

    } catch (error) {
        if (error.message === "Forbidden") {
            return res.status(403).json("Forbidden");
        }
        res.status(500).json({ message: "Internal server error" });
    }
};



const logoutUser = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (refreshToken) {
            // Remove from Database
            await authService.clearUserToken(refreshToken);
        }

        // Clear the Cookie
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
        });

        return res.status(200).json({ success: true, message: "Logged out" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};


const requestPasswordReset = async (req, res) => {
    try {
        await authService.requestPasswordReset(req.body)

        return res.status(200).json({ success: true, message: "SMS successfully sent" });
        
    } catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ message: error.message || 'Internal server error' });
    }
}


const authenticateCode = async (req, res) => {
    try {
        const result = await authService.authenticateCode(req.body)

        return res.status(200).json({ success: true, ...result });
        
    } catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ message: error.message || 'Internal server error' });
    }
}


const resetPassword = async (req, res) => {
    try {
        const result = await authService.resetPassword(req.body)

        return res.status(200).json(result);
        
    } catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ message: error.message || 'Internal server error' });
    }
}



export {
    loginUser,
    refreshToken,
    logoutUser,
    requestPasswordReset,
    authenticateCode,
    resetPassword
}