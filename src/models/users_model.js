import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcrypt';

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minLength: 4,
            maxLength: 20,
            index: true
        },

        password: {
            type: String,
            required: true,
        },

        status: {
            type: String,
            required: true,
            enum: ["manager", "groupPastor", "groupAdmin", "churchPastor", "churchAdmin"],
        },

        memberId: {
            type: mongoose.Schema.Types.ObjectId, ref: 'Member',
            required: true,
            unique: true,
        },

        churchId: {
            type: mongoose.Schema.Types.ObjectId, ref: 'Church',
            required: true,
        },

        groupId: {
            type: mongoose.Schema.Types.ObjectId, ref: 'Group',
            required: true,
        },

        refreshToken: {
            type: String,
            default: null,
            select: false
        }
    },

    {
        timestamps: true
    }
);

// Hashing password
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// compare passwords when a user logs in
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password)
}

export const User = mongoose.model("User", userSchema);

