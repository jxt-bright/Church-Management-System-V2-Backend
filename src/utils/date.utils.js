const getMonthDateRange = (year, month) => {
    const yearInt = parseInt(year);
    const monthInt = parseInt(month);

    // Start Date: 1st day of the month at 00:00:00
    const startDate = new Date(yearInt, monthInt - 1, 1);
    startDate.setHours(0, 0, 0, 0);

    // End Date: Last day of the month at 23:59:59
    const endDate = new Date(yearInt, monthInt, 0);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
};

export { getMonthDateRange };