import mongoose, { Schema } from "mongoose";

const SpecialServiceSchema = new Schema({
    date: {
        type: Date,
        required: true,
    },
    adults: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    youths: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    children: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    category: {
        type: String,
        required: true,
        enum: ["Home Caring Fellowship", "GCK", "Seminar"],
        min: 0,
        default: 0
    },
    churchId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Church',
        required: true,
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Group',
        required: true
    }
});

SpecialServiceSchema.index({churchId: 1, date: -1, category: 1}, {unique: true});

// For Total Attendance
SpecialServiceSchema.virtual('total').get(function() {
    return (this.adults || 0) + (this.youths || 0) + (this.children || 0);
});

export const SpecialService = mongoose.model('SpecialService', SpecialServiceSchema);