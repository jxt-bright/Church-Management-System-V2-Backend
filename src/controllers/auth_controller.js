import jwt from 'jsonwebtoken';
import { User } from "../models/users_model.js";

// User login endpoint
const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        // check if the user exists
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({
                message: "Invalid Credentials"
            })
        };

        // compare passwords
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        const payload = { id: user._id, churchId: user.churchId, groupId: user.groupId, status: user.status }

        // Generate a JWT Access Token
        const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10m' });

        // Generate a JWT Refresh Token
        const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '12h' });

        // Store Refresh Token in database
        user.refreshToken = refreshToken;
        await user.save();

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,              // can't access via JS
            secure: process.env.NODE_ENV === "production",  // only over HTTPS in prod
            sameSite: "Strict",          // or "None" if cross-site
            maxAge: 12 * 60 * 60 * 1000 // 12 hrs
        });

        // Send response with generated tokens
        res.status(200).json({
            success: true,
            message: "User Logged In",
            user: payload,
            accessToken: accessToken,
        })

    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
}



// User logout endpoint
// const logoutUser = async (req, res) => {
//     try {
//         // Delete Refresh Token of user
//         if (req.user) {
//             await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
//         }

//         res.clearCookie("refreshToken", {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === "production",
//             sameSite: "Strict",
//         });

//         // Send response
//         res.status(200).json({
//             success: true,
//             message: "Logged out successfully"
//         });
//     } catch (error) {
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// }



// Refresh Token endpoint
const refreshToken = async (req, res) => {
    try {
        const cookies = req.cookies;

        // Check for refreshToken
        if (!cookies?.refreshToken) return res.status(401).json({ message: "Unauthorized" });

        // Verify if the refresh token is valid
        jwt.verify(cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
            if (err) return res.status(403).json("Forbidden");

            // Find user by the ID inside the token
            const user = await User.findById(decoded.id).select("+refreshToken");
            if (!user) return res.status(403).json("Forbidden");

            // Ensure the provided token matches the stored one
            if (user.refreshToken !== cookies.refreshToken) {
                return res.status(403).json("Forbidden");
            }

            // Generate NEW Access Token
            const payload = { id: user._id, churchId: user.churchId, groupId: user.groupId, status: user.status }
            const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "10m" });

            // Send new Access Token
            res.status(200).json({
                success: true,
                user: payload,
                accessToken: accessToken,
            });
        });

    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
};

export {
    loginUser,
    // logoutUser,
    refreshToken,
}