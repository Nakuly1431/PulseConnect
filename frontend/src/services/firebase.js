import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { validateIndianPhone } from '../utils/phoneValidation';

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

export const isFirebaseConfigured = () => Boolean(cfg.apiKey?.trim().length > 5 && cfg.projectId?.trim().length > 2);

let firebaseApp = null, firebaseAuth = null;
export function getFirebaseInstance() {
  if (!isFirebaseConfigured()) return null;
  if (!firebaseApp) {
    firebaseApp = getApps().length ? getApp() : initializeApp(cfg);
    firebaseAuth = getAuth(firebaseApp);
  }
  return { app: firebaseApp, auth: firebaseAuth };
}

export function initRecaptchaVerifier(containerId = 'recaptcha-container') {
  const inst = getFirebaseInstance();
  if (!inst) return null;
  try {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.debug('Recaptcha clear error', e);
      }
      window.recaptchaVerifier = null;
    }
    let el = document.getElementById(containerId);
    if (el?.parentNode) {
      const fresh = document.createElement('div');
      fresh.id = containerId;
      el.parentNode.replaceChild(fresh, el);
      el = fresh;
    } else if (!el) {
      el = document.createElement('div');
      el.id = containerId;
      document.body.appendChild(el);
    }
    return (window.recaptchaVerifier = new RecaptchaVerifier(inst.auth, el, {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => console.warn('[Firebase Auth] reCAPTCHA expired.')
    }));
  } catch (err) {
    console.error('[Firebase Auth] reCAPTCHA init failed:', err);
    throw err;
  }
}

export async function sendFirebasePhoneOtp(phoneNumber, containerId = 'recaptcha-container') {
  const check = validateIndianPhone(phoneNumber);
  if (!check.isValid) throw new Error(check.message);
  const inst = getFirebaseInstance();
  if (!inst) throw new Error('Firebase credentials not configured. Please add VITE_FIREBASE_API_KEY in .env');

  const verifier = initRecaptchaVerifier(containerId);
  try {
    const confirmationResult = await signInWithPhoneNumber(inst.auth, check.e164, verifier);
    return { confirmationResult, formattedPhone: check.formatted, e164Phone: check.e164 };
  } catch (err) {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.debug('Recaptcha clear error', e);
      }
      window.recaptchaVerifier = null;
    }
    let msg = err.message || 'Failed to dispatch verification code. Please retry.';
    if (err.code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed') || msg.includes('region enabled')) {
      msg = 'Firebase SMS requires India (+91) to be enabled. In Firebase Console -> Authentication -> Settings -> SMS region policy, enable India (+91).';
    } else if (err.code === 'auth/too-many-requests') {
      msg = 'Too many attempts sent to this device. Please wait a few minutes before retrying.';
    } else if (err.code === 'auth/invalid-phone-number') {
      msg = 'Invalid phone number format for SMS dispatch.';
    }
    throw new Error(msg);
  }
}

export async function confirmFirebasePhoneOtp(confirmationResult, code) {
  if (!confirmationResult?.confirm) throw new Error('Verification session expired or invalid. Please resend the code.');
  const clean = (code || '').toString().trim();
  if (clean.length !== 6) throw new Error('Please enter the full 6-digit verification code.');
  return (await confirmationResult.confirm(clean)).user;
}
