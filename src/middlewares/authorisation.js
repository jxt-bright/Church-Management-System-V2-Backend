const ROLE_LEVELS = {
    'churchAdmin': 1,
    'churchPastor': 2,
    'groupAdmin': 3,
    'groupPastor': 4,
    'manager': 5
};

const verifyAccessLevel = (requiredStatus) => {
    return (req, res, next) => {

        try {
            // Check if user is logged in (req.user should exist from verifyJWT)
            if (!req.user || !req.user.status) {
                return res.status(401).json({ message: "Unauthorized: User status missing" });
            }


            const userStatus = req.user.status;

            // Get the numeric values
            const userRank = ROLE_LEVELS[userStatus] || 0; // Default to 0 if invalid role
            const requiredRank = ROLE_LEVELS[requiredStatus];

            // Safety Check: If the route asks for a role that doesn't exist in our list
            if (requiredRank === undefined) {
                return res.status(500).json({
                    success: false,
                    message: "Internal Server Error: Invalid route configuration" });
            }

            // 4. THE COMPARISON
            // If User Rank is equal to or higher than Required Rank -> ALLOW
            if (userRank >= requiredRank) {
                next();
            } else {
                return res.status(403).json({
                    success: false,
                    message: `Forbidden: You need to be at least a ${requiredStatus} to access this Route.`
                });
            }
        } catch (error) {
            return res.status(500).json({ message: "Internal Server Error" });
        }
    };
};

export default verifyAccessLevel;