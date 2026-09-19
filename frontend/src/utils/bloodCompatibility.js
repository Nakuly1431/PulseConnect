export const BLOOD_GROUPS = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const DONOR_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const BLOOD_COMPATIBILITY_MAP = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal Recipient
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'], // Universal Donor can only receive O-
};

export function getCompatibleDonorTypes(recipientGroup) {
  if (!recipientGroup || recipientGroup === 'All') return DONOR_BLOOD_GROUPS;
  return BLOOD_COMPATIBILITY_MAP[recipientGroup] || [recipientGroup];
}

export function formatDistance(km) {
  if (km === null || km === undefined || isNaN(km)) return 'Nearby';
  const num = Number(km);
  if (num < 1) return `${Math.round(num * 1000)} m away`;
  return `${num.toFixed(1)} km away`;
}

export function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Just now';
  try {
    const cleanTs = typeof timestamp === 'string' ? timestamp.replace(' ', 'T') : timestamp;
    const past = new Date(cleanTs);
    if (isNaN(past.getTime())) return 'Recently';
    const now = new Date();
    const diffMinutes = Math.max(1, Math.round((now.getTime() - past.getTime()) / (1000 * 60)));

    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }


}


export function maskPhoneNumber(phone) {
  if (!phone) return '+91 ••••• ••••';
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) return '••••';
  const prefix = phone.includes('+91') ? '+91' : digits.slice(0, 2);
  const suffix = digits.slice(-4);
  return `${prefix} ••••• ${suffix}`;
}

export function getCooldownInfo(donor) {
  if (!donor) {
    return {
      isInCooldown: false,
      daysRemaining: 0,
      cooldownUntil: null,
      lastDonationDate: null,
      progressPercent: 100,
      totalDonations: 0
    };
  }

  const cooldownDateStr = donor.cooldown_until;
  const lastDonationDate = donor.last_donation_date || null;
  const totalDonations = donor.total_donations || 0;

  if (!cooldownDateStr) {
    return {
      isInCooldown: false,
      daysRemaining: 0,
      cooldownUntil: null,
      lastDonationDate,
      progressPercent: 100,
      totalDonations
    };
  }

  const cooldownDate = new Date(cooldownDateStr);
  const now = new Date();
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(cooldownDate.getFullYear(), cooldownDate.getMonth(), cooldownDate.getDate());
  const diffTime = targetDay.getTime() - nowDay.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    const elapsedDays = Math.max(0, 90 - diffDays);
    const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedDays / 90) * 100)));
    return {
      isInCooldown: true,
      daysRemaining: diffDays,
      cooldownUntil: cooldownDateStr,
      lastDonationDate,
      progressPercent,
      totalDonations
    };
  }

  return {
    isInCooldown: false,
    daysRemaining: 0,
    cooldownUntil: cooldownDateStr,
    lastDonationDate,
    progressPercent: 100,
    totalDonations
  };
}
