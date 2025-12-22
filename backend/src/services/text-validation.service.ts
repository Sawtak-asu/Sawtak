import { Filter } from 'bad-words';

export interface AnalysisResult {
    valid: boolean;
    reason?: string;
}

const REPETITION_REGEX = /(.)\1{4,}/;

export class TextValidationService {
    /**
     * Validate English text to ensure that it has a meaningful content 
     */
    validateEnglish(text: string): AnalysisResult {
        if (!text || text.length < 10) {
            return { valid: false, reason: 'Text is too short (min 10 chars)' };
        }

        if (REPETITION_REGEX.test(text)) {
            return { valid: false, reason: 'Excessive character repetition detected' };
        }

        const filter = new Filter();
        if (filter.isProfane(text)) {
            return { valid: false, reason: 'Profanity detected' };
        }

        const vowels = text.match(/[aeiou]/gi);
        const vowelCount = vowels ? vowels.length : 0;
        const ratio = vowelCount / text.length;

        if (ratio < 0.15) {
            return { valid: false, reason: 'Gibberish detected (low vowel ratio)' };
        }

        return { valid: true };
    }
}
