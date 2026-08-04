const US_E164_PATTERN = /^\+1[2-9]\d{2}[2-9]\d{6}$/;

export function normalizeUsMobileNumber(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return { error: 'Enter a mobile number.' };
  }

  const normalized = value.normalize('NFKC').trim();
  if (!/^[+\d().\-\s]+$/.test(normalized)) {
    return { error: 'Enter a valid US mobile number.' };
  }

  let digits = normalized.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  const e164 = `+1${digits}`;
  if (digits.length !== 10 || !US_E164_PATTERN.test(e164)) {
    return { error: 'Enter a valid 10-digit US mobile number.' };
  }

  return { value: e164 };
}

export function maskUsMobileNumber(value) {
  const match = typeof value === 'string' ? value.match(/^\+1(\d{3})(\d{3})(\d{4})$/) : null;
  return match ? `(***) ***-${match[3]}` : 'Not provided';
}
