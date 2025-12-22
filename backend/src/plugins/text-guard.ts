import { Elysia } from 'elysia';
import { TextValidationService } from '../services/text-validation.service';

export class TextValidationError extends Error {
    constructor(public message: string) {
        super(message);
    }
}

const validationService = new TextValidationService();

export const textGuardPlugin = (app: Elysia) => app
    .error({
        TEXT_VALIDATION_ERROR: TextValidationError
    })
    .onError(({ code, error, set }) => {
        if (code === 'TEXT_VALIDATION_ERROR') {
            set.status = 400;
            return { success: false, error: error.message };
        }
    })
    .derive(() => {
        return {
            guardEnglish: (text: string) => {
                const result = validationService.validateEnglish(text);
                if (!result.valid) {
                    throw new TextValidationError(result.reason || 'Invalid text');
                }
                return text;
            }
        };
    });
