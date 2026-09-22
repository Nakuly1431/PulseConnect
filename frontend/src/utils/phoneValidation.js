/**
 * Indian Mobile Number Validation & Formatting Utilities
 * Adheres strictly to Telecom Regulatory Authority of India (TRAI) and
 * Department of Telecommunications (DoT) National Numbering Plan.
 * 
 * Rules:
 * 1. Exactly 10 digits (excluding country code +91 or trunk 0 prefix).
 * 2. Mobile allocation starts exclusively with 6, 7, 8, or 9.
 */

// Matches optional +91, 91, or 0 prefix followed by 10 digits starting with 6-9
export const INDIAN_MOBILE_REGEX = /^(?:\+91|91|0)?([6-9]\d{9})$/;

/**
 * Validates any phone string against Indian mobile standards.
 * 
 * @param {string} phone
 * @returns {{
 *   isValid: boolean,
 *   error: string | null,
 *   message: string,
 *   standard10Digit: string,
 *   e164: string,
 *   formatted: string
 * }}
 */
export function validateIndianPhone(phone) {
  if (!phone || !phone.toString().trim()) {
    return {
      isValid: false,
      error: 'empty',
      message: 'Emergency phone number is required.',
      standard10Digit: '',
      e164: '',
      formatted: ''
    };
  }

  const raw = phone.toString().trim();
  // Strip spaces, dashes, brackets, dots
  const cleaned = raw.replace(/[\s\-\(\)\.]/g, '');

  // Check for invalid non-digits (allow leading +)
  const numericPart = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
  if (!/^\d+$/.test(numericPart)) {
    return {
      isValid: false,
      error: 'non_digits',
      message: 'Phone number must contain digits only.',
      standard10Digit: '',
      e164: '',
      formatted: raw
    };
  }

  // Extract digits only
  const allDigits = cleaned.replace(/\D/g, '');

  // Determine local 10 digits
  let local10 = '';
  if (cleaned.startsWith('+91')) {
    local10 = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    local10 = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    local10 = cleaned.slice(1);
  } else if (cleaned.length === 10) {
    local10 = cleaned;
  } else {
    local10 = allDigits.slice(-10);
  }

  // Check length
  if (allDigits.length < 10) {
    return {
      isValid: false,
      error: 'too_short',
      message: `Incomplete: ${allDigits.length}/10 digits entered.`,
      standard10Digit: local10,
      e164: '',
      formatted: raw
    };
  }

  // Check starting digit of local 10 digits
  if (local10.length === 10 && !/^[6-9]/.test(local10)) {
    return {
      isValid: false,
      error: 'invalid_start',
      message: `Invalid prefix: Indian mobile numbers must begin with 6, 7, 8, or 9 (starts with '${local10[0]}').`,
      standard10Digit: local10,
      e164: '',
      formatted: raw
    };
  }

  const match = cleaned.match(INDIAN_MOBILE_REGEX);
  if (!match) {
    if (allDigits.length > 10 && !cleaned.startsWith('+91') && !cleaned.startsWith('0') && !cleaned.startsWith('91')) {
      return {
        isValid: false,
        error: 'too_long',
        message: `Too many digits (${allDigits.length} digits). Standard Indian mobile numbers are 10 digits.`,
        standard10Digit: '',
        e164: '',
        formatted: raw
      };
    }
    return {
      isValid: false,
      error: 'invalid_format',
      message: 'Invalid Indian mobile format. Expected 10 digits starting with 6, 7, 8, or 9.',
      standard10Digit: '',
      e164: '',
      formatted: raw
    };
  }

  const valid10 = match[1];
  const e164 = `+91${valid10}`;
  const formatted = `+91 ${valid10.slice(0, 5)} ${valid10.slice(5)}`;

  return {
    isValid: true,
    error: null,
    message: 'Valid Indian mobile number',
    standard10Digit: valid10,
    e164,
    formatted
  };
}

/**
 * Standardizes any valid phone string into +91 XXXXX XXXXX format.
 */
export function formatIndianPhone(phone) {
  const res = validateIndianPhone(phone);
  return res.isValid ? res.formatted : phone;
}
