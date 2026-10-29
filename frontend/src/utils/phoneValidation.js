export const INDIAN_MOBILE_REGEX = /^(?:\+91|91|0)?([6-9]\d{9})$/;

export function validateIndianPhone(phone) {
  const err = (error, message, standard10Digit = '', formatted = '') => ({
    isValid: false, error, message, standard10Digit, e164: '', formatted
  });

  if (!phone?.toString().trim()) return err('empty', 'Emergency phone number is required.');
  const raw = phone.toString().trim();
  const cleaned = raw.replace(/[\s().-]/g, '');
  const numPart = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
  if (!/^\d+$/.test(numPart)) return err('non_digits', 'Phone number must contain digits only.', '', raw);

  const allDigits = cleaned.replace(/\D/g, '');
  let local10 = cleaned.startsWith('+91') ? cleaned.slice(3) : (
    cleaned.startsWith('91') && cleaned.length === 12 ? cleaned.slice(2) : (
      cleaned.startsWith('0') && cleaned.length === 11 ? cleaned.slice(1) : (
        cleaned.length === 10 ? cleaned : allDigits.slice(-10)
      )
    )
  );

  if (allDigits.length < 10) return err('too_short', `Incomplete: ${allDigits.length}/10 digits entered.`, local10, raw);
  if (local10.length === 10 && !/^[6-9]/.test(local10)) {
    return err('invalid_start', `Invalid prefix: Indian mobile numbers must begin with 6, 7, 8, or 9 (starts with '${local10[0]}').`, local10, raw);
  }

  const match = cleaned.match(INDIAN_MOBILE_REGEX);
  if (!match) {
    if (allDigits.length > 10 && !cleaned.startsWith('+91') && !cleaned.startsWith('0') && !cleaned.startsWith('91')) {
      return err('too_long', `Too many digits (${allDigits.length} digits). Standard Indian mobile numbers are 10 digits.`, '', raw);
    }
    return err('invalid_format', 'Invalid Indian mobile format. Expected 10 digits starting with 6, 7, 8, or 9.', '', raw);
  }

  const valid10 = match[1];
  return {
    isValid: true, error: null, message: 'Valid Indian mobile number',
    standard10Digit: valid10, e164: `+91${valid10}`, formatted: `+91 ${valid10.slice(0, 5)} ${valid10.slice(5)}`
  };
}

export function formatIndianPhone(phone) {
  const res = validateIndianPhone(phone);
  return res.isValid ? res.formatted : phone;
}
