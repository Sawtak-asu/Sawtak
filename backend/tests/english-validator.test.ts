import { describe, expect, it } from 'bun:test';
import { TextValidationService } from '../src/services/text-validation.service';

describe('Text Validation Service', () => {
    const service = new TextValidationService();

    it('should accept valid text', () => {
        const result = service.validateEnglish('This is a valid complaint about the service.');
        expect(result.valid).toBe(true);
    });

    it('should reject short text', () => {
        const result = service.validateEnglish('Too short');
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('too short');
    });

    it('should reject repetition', () => {
        const result = service.validateEnglish('This is baaaaaaad');
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('repetition');
    });

    it('should reject profanity', () => {
        const result = service.validateEnglish('This is shit service');
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('Profanity');
    });

    it('should reject gibberish (low vowels)', () => {
        const result = service.validateEnglish('Ths s vry bd srvc wth n vwls');
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('Gibberish');
    });

    it('should accept text with enough vowels', () => {
        const result = service.validateEnglish('The quick brown fox jumps over the lazy dog');
        expect(result.valid).toBe(true);
    });
});
