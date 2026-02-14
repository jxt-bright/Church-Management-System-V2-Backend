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



const generalReport = async (params) => {
    const start = new Date(`${params.startMonth}-01T00:00:00.000Z`);
    const end = new Date(`${params.endMonth}-01T23:59:59.999Z`);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0); 

    const filter = { date: { $gte: start, $lte: end } };

    if (params.churchId) {
        filter.churchId = new mongoose.Types.ObjectId(params.churchId);
    } else if (params.groupId) {
        filter.groupId = new mongoose.Types.ObjectId(params.groupId);
    }

    const [dbRecords, specialRecords] = await Promise.all([
        Attendance.find(filter).lean(),
        SpecialService.find(filter).lean()
    ]);

    const finalReport = {
        sunday: {}, monday: {}, thursday: {},
        gck: {}, homeCaringFellowship: {}, seminar: []
    };

    // --- Process Regular Services (Calculate Averages) ---
    const serviceMap = [
        { key: 'sunday', dayNum: 0 },
        { key: 'monday', dayNum: 1 },
        { key: 'thursday', dayNum: 4 }
    ];

    serviceMap.forEach(({ key, dayNum }) => {
        const matches = dbRecords.filter(r => new Date(r.date).getDay() === dayNum && !r.reason);
        const count = matches.length || 1;

        const totals = matches.reduce((acc, curr) => ({
            am: acc.am + (curr.adultmale || 0), af: acc.af + (curr.adultfemale || 0),
            ym: acc.ym + (curr.youthmale || 0), yf: acc.yf + (curr.youthfemale || 0),
            cm: acc.cm + (curr.childrenmale || 0), cf: acc.cf + (curr.childrenfemale || 0),
            nm: acc.nm + (curr.newcomersmales || 0), nf: acc.nf + (curr.newcomersfemales || 0),
            o1: acc.o1 + (curr.firstoffering || 0), o2: acc.o2 + (curr.secondoffering || 0),
        }), { am: 0, af: 0, ym: 0, yf: 0, cm: 0, cf: 0, nm: 0, nf: 0, o1: 0, o2: 0 });

        finalReport[key] = {
            am: Math.ceil(totals.am / count), af: Math.ceil(totals.af / count), at: Math.ceil((totals.am + totals.af) / count),
            ym: Math.ceil(totals.ym / count), yf: Math.ceil(totals.yf / count), yt: Math.ceil((totals.ym + totals.yf) / count),
            cm: Math.ceil(totals.cm / count), cf: Math.ceil(totals.cf / count), ct: Math.ceil((totals.cm + totals.cf) / count),
            nm: Math.ceil(totals.nm / count), nf: Math.ceil(totals.nf / count), nt: Math.ceil((totals.nm + totals.nf) / count),
            o1: (totals.o1 / count).toFixed(2), o2: (totals.o2 / count).toFixed(2), ot: ((totals.o1 + totals.o2) / count).toFixed(2)
        };
    });

    // --- Process Special Services ---
    const specialCats = [
        { cat: 'GCK', key: 'gck', shouldAvg: true },
        { cat: 'Home Caring Fellowship', key: 'homeCaringFellowship', shouldAvg: true },
        { cat: 'Seminar', key: 'seminar', shouldAvg: false }
    ];

    specialCats.forEach(({ cat, key, shouldAvg }) => {
        const catMatches = specialRecords.filter(r => r.category === cat);
        
        if (shouldAvg) {
            const count = catMatches.length || 1;
            const totals = catMatches.reduce((acc, curr) => ({
                a: acc.a + (curr.adults || 0), y: acc.y + (curr.youths || 0), c: acc.c + (curr.children || 0)
            }), { a: 0, y: 0, c: 0 });

            finalReport[key] = {
                a: Math.ceil(totals.a / count),
                y: Math.ceil(totals.y / count),
                c: Math.ceil(totals.c / count),
                t: Math.ceil((totals.a + totals.y + totals.c) / count)
            };
        } else {
            // Seminars remain as a listing
            finalReport[key] = catMatches.map(r => ({
                date: r.date, adults: r.adults, youths: r.youths, children: r.children, total: r.adults + r.youths + r.children
            })).sort((a, b) => new Date(a.date) - new Date(b.date));
        }
    });

    return finalReport;
};




export { monthlyReport, generalReport };