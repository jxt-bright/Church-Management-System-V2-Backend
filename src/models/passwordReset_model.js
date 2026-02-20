import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcrypt';

const passwordResetSchema = new Schema({
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    code: { 
        type: String, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now, 
        expires: 600 // Deletes after 10 minutes
    } 
});

// Auto-hash the 6-digit code before saving
passwordResetSchema.pre("save", async function (next) {
    if (!this.isModified("code")) return next();
    try {
        this.code = await bcrypt.hash(this.code, 10);
        next();
    } catch (err) {
        next(err);
    }
});

// Helper to compare the user's input with the hashed DB version
passwordResetSchema.methods.compareCode = async function (candidateCode) {
    return await bcrypt.compare(candidateCode, this.code);
};

export const PasswordReset = mongoose.model("PasswordReset", passwordResetSchema);