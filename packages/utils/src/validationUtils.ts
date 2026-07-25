export function validateEmailPartial(val: string): {
  valid: boolean;
  isComplete: boolean;
  error?: string;
} {
  const EMAIL_PARTIAL_REGEX = /^[a-zA-Z0-9._%+-]*@?[a-zA-Z0-9.-]*\.?[a-zA-Z]*$/;
  const EMAIL_FULL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!EMAIL_PARTIAL_REGEX.test(val)) {
    return { valid: false, isComplete: false, error: 'Invalid character in email' };
  }
  if (!EMAIL_FULL_REGEX.test(val)) {
    return { valid: true, isComplete: false, error: 'Incomplete email format' };
  }
  return { valid: true, isComplete: true };
}

export function validatePhonePartial(val: string): {
  valid: boolean;
  isComplete: boolean;
  error?: string;
} {
  const PHONE_PARTIAL_REGEX = /^\+?[0-9\s\-()]*$/;

  if (!PHONE_PARTIAL_REGEX.test(val)) {
    return { valid: false, isComplete: false, error: 'Invalid character in phone number' };
  }

  const digitCount = val.replace(/\D/g, '').length;
  if (digitCount > 0 && digitCount < 10) {
    return { valid: true, isComplete: false, error: 'Phone number must have at least 10 digits' };
  }
  if (digitCount > 15) {
    return { valid: false, isComplete: false, error: 'Phone number cannot exceed 15 digits' };
  }
  return { valid: true, isComplete: true };
}
