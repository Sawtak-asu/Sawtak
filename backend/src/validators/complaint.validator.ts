export const VALID_CATEGORIES = ["corruption", "misconduct", "harassment", "discrimination", "other"] as const;
export type ComplaintCategory = typeof VALID_CATEGORIES[number];

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate anonymous complaint payload
 */
export function validateAnonymousComplaint(data: any): ValidationResult {
  const required = ["userId", "anonymousIdentifier", "title", "text", "category"];

  for (const field of required) {
    if (!data[field]) {
      return {
        isValid: false,
        error: `Missing required field: ${field}`
      };
    }
  }

  if (!VALID_CATEGORIES.includes(data.category)) {
    return {
      isValid: false,
      error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`
    };
  }

  // Validate title length
  if (data.title.length < 5 || data.title.length > 200) {
    return {
      isValid: false,
      error: "Title must be between 5 and 200 characters"
    };
  }

  // Validate text length
  if (data.text.length < 10 || data.text.length > 5000) {
    return {
      isValid: false,
      error: "Description must be between 10 and 5000 characters"
    };
  }

  return { isValid: true };
}

/**
 * Validate identified complaint payload
 */
export function validateIdentifiedComplaint(data: any): ValidationResult {
  const required = ["userId", "title", "text", "category"];

  for (const field of required) {
    if (!data[field]) {
      return {
        isValid: false,
        error: `Missing required field: ${field}`
      };
    }
  }

  if (!VALID_CATEGORIES.includes(data.category)) {
    return {
      isValid: false,
      error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`
    };
  }

  // Validate title length
  if (data.title.length < 5 || data.title.length > 200) {
    return {
      isValid: false,
      error: "Title must be between 5 and 200 characters"
    };
  }

  // Validate text length
  if (data.text.length < 10 || data.text.length > 5000) {
    return {
      isValid: false,
      error: "Description must be between 10 and 5000 characters"
    };
  }

  return { isValid: true };
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}
