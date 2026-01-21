import mongoose, { Schema } from "mongoose";


const MemberSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true,
    },
    houseAddress: {
        type: String,
        trim: true,
        default: null,
    },
    gpsAddress: {
        type: String,
        trim: true,
        default: null,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female'],
        required: true,
        trim: true,
    },
    relationshipStatus: {
        type: String,
        enum: ['Single', 'Married', 'Widowed', 'Separated'],
        required: true,
        trim: true,
    },
    category: {
        type: String,
        enum: ['Adult', 'Youth', 'Children'],
        required: true,
        trim: true,
    },
    workOrSchool: {
        type: String,
        trim: true,
        default: null,
    },
    levelOrPosition: {
        type: String,
        trim: true,
        default: null,
    },
    programOrDepartment: {
        type: String,
        trim: true,
        default: null,
    },
    emergencyContact: {
        type: String,
        required: true,
        trim: true,
    },
    emergencyName: {
        type: String,
        required: true,
        trim: true,
    },
    emergencyRelation: {
        type: String,
        required: true,
        trim: true,
    },
    emergencyAddress: {
        type: String,
        trim: true,
        default: null,
    },
    memberStatus: {
        type: String,
        enum: ['Worker', 'Non-worker'],
        required: true,
        trim: true,
    },
    profileImage: {
        url: {
            type: String,
            default: null
        },
        public_id: {
            type: String,
            default: null
        }
    },
    churchId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Church',
        required: true,
        index: true
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Group',
        required: true,
        index: true
    }
},
    { timestamps: true }
);

MemberSchema.index({ lastName: 1, firstName: 1 });
MemberSchema.index({ memberStatus: 1 });
MemberSchema.index({ memberCategory: 1 });


export const Member = mongoose.model('Member', MemberSchema);
