
import { Member } from '../models/members_model.js';
import { Church } from '../models/churches_model.js';
import { Group } from '../models/groups_model.js';
import { User } from '../models/users_model.js';
import { Attendance } from '../models/attendance_model.js'
import mongoose from 'mongoose';


const getDashboardStats = async (query) => {
    const { status, target, id } = query;

    // Dynamic filter based on user role
    const filter = {};
    if (status !== 'manager') {
        if (target === 'group') {
            filter.groupId = id;
        } else if (target === 'church') {
            filter.churchId = id;
        }
    }
    if (filter.churchId) filter.churchId = new mongoose.Types.ObjectId(filter.churchId);
    if (filter.groupId) filter.groupId = new mongoose.Types.ObjectId(filter.groupId);

    // Fetch KPI Stats
    const stats = {};
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    if (status === 'manager') {
        stats.totalGroups = await Group.countDocuments();
        stats.totalChurches = await Church.countDocuments();
        stats.totalUsers = await User.countDocuments();
    }

    if (['groupAdmin', 'groupPastor', 'manager'].includes(status)) {
        stats.totalChurches = await Church.countDocuments(filter);
        stats.totalUsers = await User.countDocuments(filter);
    }

    stats.totalMembers = await Member.countDocuments(filter);

    if (['groupPastor', 'groupAdmin', 'churchAdmin', 'churchPastor'].includes(status)) {
        stats.totalWorkers = await Member.countDocuments({ ...filter, memberStatus: 'Worker' });
    }


    if (['churchAdmin', 'churchPastor'].includes(status)) {

        const monthlyAttendance = await Attendance.aggregate([
            {
                $match: {
                    ...filter,
                    date: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    totalNewcomers: {
                        $sum: {
                            $add: [
                                { $ifNull: ["$newcomersmales", 0] },
                                { $ifNull: ["$newcomersfemales", 0] }
                            ]
                        }
                    },
                    totalOffering: {
                        $sum: {
                            $add: [
                                { $ifNull: ["$firstoffering", 0] },
                                { $ifNull: ["$secondoffering", 0] }
                            ]
                        }
                    }
                }
            }
        ]);

        stats.newComers = monthlyAttendance.length > 0 ? monthlyAttendance[0].totalNewcomers : 0;
        stats.monthlyOffering = monthlyAttendance.length > 0 ? monthlyAttendance[0].totalOffering : 0;
    }

    // Fetch Chart Data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const attendance = await Attendance.aggregate([
        { $match: { ...filter, date: { $gte: sixMonthsAgo, $lte: now } } },
        {
            $group: {
                _id: { month: { $month: "$date" }, year: { $year: "$date" } },
                Adults: { $sum: { $add: ["$adultmale", "$adultfemale"] } },
                Youths: { $sum: { $add: ["$youthmale", "$youthfemale"] } },
                Children: { $sum: { $add: ["$childrenmale", "$childrenfemale"] } },
                date: { $first: "$date" }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        {
            $project: {
                _id: 0,
                month: { $dateToString: { format: "%b", date: "$date" } },
                Adults: 1, Youths: 1, Children: 1
            }
        }
    ]);

    const offerings = await Attendance.aggregate([
        { $match: { ...filter, date: { $gte: sixMonthsAgo, $lte: now } } },
        {
            $group: {
                _id: { month: { $month: "$date" }, year: { $year: "$date" } },
                First: { $sum: "$firstoffering" },
                Second: { $sum: "$secondoffering" },
                date: { $first: "$date" }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        {
            $project: {
                _id: 0,
                month: { $dateToString: { format: "%b", date: "$date" } },
                First: 1, Second: 1
            }
        }
    ]);


    const demographics = [
        { name: "Adult Males", value: await Member.countDocuments({ ...filter, category: 'Adult', gender: 'Male' }), color: "#2e6da4" },
        { name: "Adult Females", value: await Member.countDocuments({ ...filter, category: 'Adult', gender: 'Female' }), color: "#4a7c59" },
        { name: "Youth Males", value: await Member.countDocuments({ ...filter, category: 'Youth', gender: 'Male' }), color: "#c47c2b" },
        { name: "Youth Females", value: await Member.countDocuments({ ...filter, category: 'Youth', gender: 'Female' }), color: "#b24b5a" },
        { name: "Children Males", value: await Member.countDocuments({ ...filter, category: 'Children', gender: 'Male' }), color: "#6b4fa0" },
        { name: "Children Females", value: await Member.countDocuments({ ...filter, category: 'Children', gender: 'Female' }), color: "#2e8b80" }
    ];

// Mock pledgeData
    const pledgeData = [
        { month: "Sep", pledged: 12000, fulfilled: 9800 },
        { month: "Oct", pledged: 15000, fulfilled: 13200 },
        { month: "Nov", pledged: 11000, fulfilled: 10100 },
        { month: "Dec", pledged: 18000, fulfilled: 16500 },
        { month: "Jan", pledged: 14000, fulfilled: 11200 },
        { month: "Feb", pledged: 16000, fulfilled: 8400 },
    ];


    return {
        stats,
        attendance,
        demographics,
        offerings,
        pledgeData
    };
};

export {
    getDashboardStats
};