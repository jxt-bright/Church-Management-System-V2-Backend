import { describe, it, expect } from 'vitest';
import { getMonthDateRange } from '../../utils/date.utils.js';

describe('Date Utilities', () => {
    describe('getMonthDateRange', () => {
        
        it('should return correct range for a 31-day month (October 2023)', () => {
            const { startDate, endDate } = getMonthDateRange('2023', '10');

            // Start Oct 1, 2023, 00:00:00.000
            expect(startDate.getFullYear()).toBe(2023);
            expect(startDate.getMonth()).toBe(9); // JS months are 0-indexed
            expect(startDate.getDate()).toBe(1);
            expect(startDate.getHours()).toBe(0);

            // End Oct 31, 2023, 23:59:59.999
            expect(endDate.getFullYear()).toBe(2023);
            expect(endDate.getMonth()).toBe(9);
            expect(endDate.getDate()).toBe(31);
            expect(endDate.getHours()).toBe(23);
            expect(endDate.getMilliseconds()).toBe(999);
        });

        it('should handle February in a non-leap year (2023)', () => {
            const { endDate } = getMonthDateRange('2023', '2');
            expect(endDate.getDate()).toBe(28);
        });

        it('should handle February in a leap year (2024)', () => {
            const { endDate } = getMonthDateRange('2024', '2');
            expect(endDate.getDate()).toBe(29);
        });

        it('should handle December correctly', () => {
            const { startDate, endDate } = getMonthDateRange('2023', '12');
            expect(startDate.getMonth()).toBe(11); 
            expect(endDate.getMonth()).toBe(11);
            expect(endDate.getDate()).toBe(31);
        });

        it('should correctly parse string inputs into integers', () => {
            const { startDate } = getMonthDateRange('2025', '05');
            expect(startDate.getFullYear()).toBe(2025);
            expect(startDate.getMonth()).toBe(4); // May
        });
    });
});