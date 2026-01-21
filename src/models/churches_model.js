import mongoose, { Schema } from "mongoose";

const ChurchSchema = new Schema({
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
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Group',
        required: true,
        index: true
    }
});


export const Church = mongoose.model('Church', ChurchSchema);

