import { expect, it, describe } from 'vitest'

import { formatMessage } from '../../utils/messageFormatter.utils.js'


describe('formatMessage utility', () => {
    const message = 'we are having a meeting tomorrow.';

    describe('Basic Formatting', () => {
        it('should capitalize the main message', () => {
            const result = formatMessage({ message });
            expect(result).toBe('We are having a meeting tomorrow.');
        });

        it('should return empty string if no message is provided', () => {
            const result = formatMessage({ message: null });
            expect(result).toBe("");
        });
    });

    describe('Greeting Logic', () => {
        it('should include only salutation when addNames is false', () => {
            const result = formatMessage({
                message,
                salutation: 'dear brethren',
                firstName: 'John',
                addNames: false
            });
            expect(result).toBe('Dear brethren,\nWe are having a meeting tomorrow.');
        });

        it('should include only firstName when no salutation is provided but addNames is true', () => {
            const result = formatMessage({
                message,
                salutation: '',
                firstName: 'john',
                addNames: true
            });
            expect(result).toBe('John,\nWe are having a meeting tomorrow.');
        });

        it('should combine salutation and firstName when both are valid and addNames is true', () => {
            const result = formatMessage({
                message,
                salutation: 'hello',
                firstName: 'sarah',
                addNames: true
            });
            expect(result).toBe('Hello Sarah,\nWe are having a meeting tomorrow.');
        });

        it('should handle missing firstName gracefully even if addNames is true', () => {
            const result = formatMessage({
                message,
                salutation: 'hello',
                firstName: null,
                addNames: true
            });
            expect(result).toBe('Hello,\nWe are having a meeting tomorrow.');
        });
    });

    describe('Edge Cases & Sanitization', () => {
        it('should trim whitespace from salutation and names', () => {
            const result = formatMessage({
                message: 'test',
                salutation: '  hi  ',
                firstName: '  kofi  ',
                addNames: true
            });
            expect(result).toBe('Hi Kofi,\nTest');
        });

        it('should handle message being undefined or null without crashing', () => {
            // Testing the capitalize check within formatMessage
            expect(formatMessage({ message: undefined })).toBe("");
            expect(formatMessage({ message: 123 })).toBe(""); // Invalid type check
        });

        it('should not add a newline if there is no greeting part', () => {
            const result = formatMessage({ message: 'plain message' });
            expect(result).not.toContain('\n');
            expect(result).toBe('Plain message');
        });
    });
});