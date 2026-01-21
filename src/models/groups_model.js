import mongoose, { Schema } from "mongoose";

const GroupSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    location: {
        type: String,
        required: true,
        trim: true,
    },
    pastor: {
        type: String,
        required: true,
        trim: true,
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
    }
});


export const Group = mongoose.model('Group', GroupSchema);

