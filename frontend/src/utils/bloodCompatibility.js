export const BLOOD_GROUPS = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const DONOR_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const BLOOD_COMPATIBILITY_MAP = {
  'A+': ['A+', 'A-', 'O+', 'O-'], 'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'], 'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+': ['O+', 'O-'], 'O-': ['O-']
};

export function getCompatibleDonorTypes(recipientGroup) {
  if (!recipientGroup || recipientGroup === 'All') return DONOR_BLOOD_GROUPS;
  const norm = recipientGroup.trim().toUpperCase().replace(/\s+/g, '+');
  return BLOOD_COMPATIBILITY_MAP[norm] || [norm];
}

export function isBloodCompatible(donorGroup, recipientGroup) {
  if (!donorGroup || !recipientGroup || recipientGroup === 'All') return true;
  const normDonor = donorGroup.trim().toUpperCase().replace(/\s+/g, '+');
  return getCompatibleDonorTypes(recipientGroup).includes(normDonor);
}

export function formatDistance(km) {
  if (km == null || isNaN(km)) return 'Nearby';
  const num = Number(km);
  return num < 1 ? `${Math.round(num * 1000)} m away` : `${num.toFixed(1)} km away`;
}

export function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Just now';
  try {
    const past = new Date(typeof timestamp === 'string' ? timestamp.replace(' ', 'T') : timestamp);
    if (isNaN(past.getTime())) return 'Recently';
    const mins = Math.max(1, Math.round((Date.now() - past.getTime()) / 60000));
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return 'Recently';
  }
}

export function maskPhoneNumber(phone) {
  if (!phone) return '+91 ••••• ••••';
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) return '••••';
  const prefix = phone.includes('+91') ? '+91' : digits.slice(0, 2);
  return `${prefix} ••••• ${digits.slice(-4)}`;
}

export function getCooldownInfo(donor) {
  const def = { isInCooldown: false, daysRemaining: 0, cooldownUntil: donor?.cooldown_until || null, lastDonationDate: donor?.last_donation_date || null, progressPercent: 100, totalDonations: donor?.total_donations || 0 };
  if (!donor) return def;

  if (donor.is_in_cooldown !== undefined && donor.cooldown_days_remaining !== undefined) {
    const isCool = Boolean(donor.is_in_cooldown);
    const rem = Math.max(0, Number(donor.cooldown_days_remaining) || 0);
    return { ...def, isInCooldown: isCool, daysRemaining: rem, progressPercent: isCool ? Math.min(100, Math.max(0, Math.round(((90 - rem) / 90) * 100))) : 100 };
  }

  if (!donor.cooldown_until) return def;
  const parts = typeof donor.cooldown_until === 'string' && donor.cooldown_until.includes('-') ? donor.cooldown_until.split('T')[0].split('-').map(Number) : null;
  const target = parts ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(donor.cooldown_until);
  const now = new Date();
  const diffDays = Math.ceil((target.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86400000);
  if (diffDays > 0) {
    return { ...def, isInCooldown: true, daysRemaining: diffDays, progressPercent: Math.min(100, Math.max(0, Math.round(((90 - diffDays) / 90) * 100))) };
  }
  return def;
}
