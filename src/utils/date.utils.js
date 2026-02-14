

const getMonthDateRange = (yearOrString, month) => {
    let yearInt, monthInt;

    // Check if the first argument is a string like '2026-02'
    if (typeof yearOrString === 'string' && yearOrString.includes('-')) {
        const [y, m] = yearOrString.split('-');
        yearInt = parseInt(y);
        monthInt = parseInt(m);
    } else {
        yearInt = parseInt(yearOrString);
        monthInt = parseInt(month);
    }

    // Start Date: 1st day of the month at 00:00:00
    const startDate = new Date(yearInt, monthInt - 1, 1);
    startDate.setHours(0, 0, 0, 0);

    // End Date: Last day of the month at 23:59:59
    // Setting day to 0 of next month gives the last day of the current month
    const endDate = new Date(yearInt, monthInt, 0);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
};



export {
    getMonthDateRange,
};