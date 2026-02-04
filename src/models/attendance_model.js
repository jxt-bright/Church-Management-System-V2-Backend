import mongoose, { Schema } from "mongoose";

const AttendanceSchema = new Schema({
    reason: {
        type: String,
        trim: true,
        default: null
    },
    date: {
        type: Date,
        required: true,
    },
    adultmale: {
        type: Number,
        min: 0,
    },
    adultfemale: {
        type: Number,
        min: 0,
    },
    youthmale: {
        type: Number,
        min: 0,
    },
    youthfemale: {
        type: Number,
        min: 0,
    },
    childrenmale: {
        type: Number,
        min: 0,
    },
    childrenfemale: {
        type: Number,
        min: 0,
    },
    newcomersmales: {
        type: Number,
        min: 0,
    },
    newcomersfemales: {
        type: Number,
        min: 0,
    },
    firstoffering: {
        type: Number,
        min: 0,
    },
    secondoffering: {
        type: Number,
        min: 0,
    },
    // dayName: {
    //     type: String,
    //     trim: true,
    //     required: true,
    // },
    churchId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Church',
        required: true,
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Group',
        required: true,
    }
})

AttendanceSchema.index({ churchId: 1, date: -1 }, { unique: true });

export const Attendance = mongoose.model('Attendance', AttendanceSchema);