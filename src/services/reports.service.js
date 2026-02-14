import { Attendance } from '../models/attendance_model.js';
import { SpecialService } from '../models/specialService_model.js';
import { getMonthDateRange } from '../utils/date.utils.js';
import mongoose from 'mongoose';

const monthlyReport = async (params) => {
    const { startDate, endDate } = getMonthDateRange(params.month);
    const [year, month] = params.month.split('-').map(Number);

    const filter = { date: { $gte: startDate, $lte: endDate } };
    if (params.churchId) filter.churchId = new mongoose.Types.ObjectId(params.churchId);
    else if (params.groupId) filter.groupId = new mongoose.Types.ObjectId(params.groupId);

    const [dbRecords, specialRecords] = await Promise.all([
        Attendance.find(filter).lean(),
        SpecialService.find(filter).lean()
    ]);

    const getDatesForDay = (dayNum) => {
        let dates = [];
        let d = new Date(year, month - 1, 1);
        while (d.getMonth() === month - 1) {
            if (d.getDay() === dayNum) dates.push(new Date(d));
            d.setDate(d.getDate() + 1);
        }
        return dates;
    };

    const serviceConfig = [
        { key: 'sunday', dayNum: 0 },
        { key: 'monday', dayNum: 1 },
        { key: 'thursday', dayNum: 4 }
    ];

    const finalReport = {
        monday: [], thursday: [], sunday: [],
        gck: [], homeCaringFellowship: [], seminar: []
    };

    // --- Process Regular Services ---
    serviceConfig.forEach(({ key, dayNum }) => {
        const expectedDates = getDatesForDay(dayNum);
        finalReport[key] = expectedDates.map(expectedDate => {
            const matches = dbRecords.filter(r => 
                new Date(r.date).toDateString() === expectedDate.toDateString()
            );

            if (matches.length > 0) {
                const aggregated = matches.reduce((acc, curr) => ({
                    adultmale: acc.adultmale + (curr.adultmale || 0),
                    adultfemale: acc.adultfemale + (curr.adultfemale || 0),
                    youthmale: acc.youthmale + (curr.youthmale || 0),
                    youthfemale: acc.youthfemale + (curr.youthfemale || 0),
                    childrenmale: acc.childrenmale + (curr.childrenmale || 0),
                    childrenfemale: acc.childrenfemale + (curr.childrenfemale || 0),
                    newcomersmales: acc.newcomersmales + (curr.newcomersmales || 0),
                    newcomersfemales: acc.newcomersfemales + (curr.newcomersfemales || 0),
                    firstoffering: acc.firstoffering + (curr.firstoffering || 0),
                    secondoffering: acc.secondoffering + (curr.secondoffering || 0),
                    reasons: curr.reason ? [...acc.reasons, curr.reason] : acc.reasons
                }), { adultmale: 0, adultfemale: 0, youthmale: 0, youthfemale: 0, childrenmale: 0, childrenfemale: 0, newcomersmales: 0, newcomersfemales: 0, firstoffering: 0, secondoffering: 0, reasons: [] });

                const totalAtt = aggregated.adultmale + aggregated.adultfemale + aggregated.youthmale + aggregated.youthfemale + aggregated.childrenmale + aggregated.childrenfemale;

                return {
                    date: expectedDate,
                    reason: (totalAtt === 0 && aggregated.reasons.length > 0) ? aggregated.reasons.join(", ") : null,
                    adults: { m: aggregated.adultmale, f: aggregated.adultfemale, t: aggregated.adultmale + aggregated.adultfemale },
                    youth: { m: aggregated.youthmale, f: aggregated.youthfemale, t: aggregated.youthmale + aggregated.youthfemale },
                    children: { m: aggregated.childrenmale, f: aggregated.childrenfemale, t: aggregated.childrenmale + aggregated.childrenfemale },
                    newcomers: { m: aggregated.newcomersmales, f: aggregated.newcomersfemales, t: aggregated.newcomersmales + aggregated.newcomersfemales },
                    offering: { first: aggregated.firstoffering, second: aggregated.secondoffering, total: aggregated.firstoffering + aggregated.secondoffering },
                    totalAttendance: totalAtt
                };
            }
            return { date: expectedDate, isMissing: true };
        });
    });

    // --- Process Special Services ---
    const specialCats = [
        { cat: 'GCK', key: 'gck', aggregate: true },
        { cat: 'Home Caring Fellowship', key: 'homeCaringFellowship', aggregate: true },
        { cat: 'Seminar', key: 'seminar', aggregate: false } // Set aggregate to false
    ];

    specialCats.forEach(({ cat, key, aggregate }) => {
        const catMatches = specialRecords.filter(r => r.category === cat);

        if (aggregate) {
            // Grouping logic for GCK and Fellowship
            const grouped = catMatches.reduce((acc, curr) => {
                const dStr = new Date(curr.date).toDateString();
                if (!acc[dStr]) acc[dStr] = { date: curr.date, adults: 0, youths: 0, children: 0 };
                acc[dStr].adults += curr.adults || 0;
                acc[dStr].youths += curr.youths || 0;
                acc[dStr].children += curr.children || 0;
                return acc;
            }, {});
            finalReport[key] = Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
        } else {
            // Direct mapping for Seminars (List all records individually)
            finalReport[key] = catMatches
                .map(curr => ({
                    date: curr.date,
                    adults: curr.adults || 0,
                    youths: curr.youths || 0,
                    children: curr.children || 0,
                    churchName: curr.churchName // Useful since you're listing them individually
                }))
                .sort((a, b) => new Date(a.date) - new Date(b.date));
        }
    });

    return finalReport;
};

export { monthlyReport };