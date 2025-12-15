import { validateDirectedTo, DirectedTo } from "../data/egypt-locations";

export const VALID_CATEGORIES = [
  "general",
  "corruption",
  "misconduct",
  "harassment",
  "discrimination",
  "fraud",
  "safety",
  "environment",
  "infrastructure",
  "healthcare",
  "education",
  "public_services",
  "other"
] as const;
export type ComplaintCategory = typeof VALID_CATEGORIES[number];

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate the directedTo field if provided
 */
function validateDirectedToField(data: any): ValidationResult {
  // directedTo is optional, if not provided, skip validation
  if (!data.directedTo) {
    return { isValid: true };
  }

  const directedTo = data.directedTo as DirectedTo;
  
  if (!directedTo.type) {
    return {
      isValid: false,
      error: "directedTo.type is required (ministry, governorate, or center)"
    };
  }

  if (!["ministry", "governorate", "center"].includes(directedTo.type)) {
    return {
      isValid: false,
      error: "directedTo.type must be one of: ministry, governorate, center"
    };
  }

  if (!validateDirectedTo(directedTo)) {
    return {
      isValid: false,
      error: "Invalid directedTo value. Please check the ministry, governorate, or center ID."
    };
  }

  return { isValid: true };
}

/**
 * Validate anonymous complaint payload
**/
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

  // Validate directedTo if provided
  const directedToValidation = validateDirectedToField(data);
  if (!directedToValidation.isValid) {
    return directedToValidation;
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

  // Validate directedTo if provided
  const directedToValidation = validateDirectedToField(data);
  if (!directedToValidation.isValid) {
    return directedToValidation;
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
