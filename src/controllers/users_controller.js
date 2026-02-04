import * as userService from '../services/users.service.js';

// Register user endpoint
const registerUser = async (req, res) => {
    try {
        // Passing req.user (which seems to be the role string based on your original logic)
        await userService.createUser(req.body, req.user);

        // Send back response
        res.status(201).json({
            success: true,
            message: "User successfully registered"
        });
    } catch (error) {
        if (error.message === "Cannot Register a user with status of Manager.") {
            return res.status(400).json({ message: error.message });
        }
        if (error.message === "User already exists") {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};


const getUsers = async (req, res) => {
    try {
        const result = await userService.fetchUsers(req.query, req.user);

        res.status(200).json(result);

    } catch (err) {
        res.status(500).json({ message: 'Error fetching users', error: err.message });
    }
};


const getUserById = async (req, res) => {
    try {
        const user = await userService.fetchUserById(req.params.id);

        res.status(200).json(user);
    } catch (error) {
        if (error.message === "User not found") {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(500).json({ message: 'Error fetching user details' });
    }
};


const updateUser = async (req, res) => {
    try {
        const updatedUser = await userService.modifyUser(req.params.id, req.body);

        res.status(200).json({ message: 'User updated successfully', user: updatedUser });

    } catch (error) {
        if (error.message === "Username is already taken") {
            return res.status(400).json({ message: 'Username is already taken' });
        }
        if (error.message === "User not found") {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(500).json({ message: 'Server Error updating user' });
    }
};


const deleteUser = async (req, res) => {
    try {
        const id = await userService.removeUser(req.params.id, req.user._id);

        res.status(200).json({ id, message: 'User deleted successfully' });
    } catch (error) {
        if (error.message === "User not found") {
            return res.status(404).json({ message: 'User not found' });
        }
        if (error.message === "You cannot delete your own account") {
            return res.status(400).json({ message: 'You cannot delete your own account' });
        }
        res.status(500).json({ message: 'Server error while deleting user' });
    }
};


export {
    registerUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser
}