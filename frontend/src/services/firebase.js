import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { validateIndianPhone } from '../utils/phoneValidation';

// Firebase configuration from Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

/**
 * Checks whether Firebase credentials have been configured in .env.
 */
export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey.trim().length > 5 &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId.trim().length > 2
  );
}

let firebaseApp = null;
let firebaseAuth = null;

export function getFirebaseInstance() {
  if (!isFirebaseConfigured()) return null;
  if (!firebaseApp) {
    firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
  }
  return { app: firebaseApp, auth: firebaseAuth };
}

/**
 * Prepares the Google reCAPTCHA verifier required by Firebase Phone Auth.
 * Uses 'invisible' mode for zero friction to legitimate users.
 */
export function initRecaptchaVerifier(containerId = 'recaptcha-container') {
  const instance = getFirebaseInstance();
  if (!instance) return null;

  try {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (err) {
        console.warn('Notice clearing recaptchaVerifier:', err);
      }
      window.recaptchaVerifier = null;
    }

    // Cleanly replace the container DOM element so grecaptcha treats it as completely fresh
    let container = document.getElementById(containerId);
    if (container && container.parentNode) {
      const freshContainer = document.createElement('div');
      freshContainer.id = containerId;
      container.parentNode.replaceChild(freshContainer, container);
      container = freshContainer;
    } else if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      document.body.appendChild(container);
    }

    const verifier = new RecaptchaVerifier(instance.auth, container, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved - will allow signInWithPhoneNumber
      },
      'expired-callback': () => {
        console.warn('[Firebase Auth] reCAPTCHA expired. Resetting...');
      }
    });

    window.recaptchaVerifier = verifier;
    return verifier;
  } catch (err) {
    console.error('[Firebase Auth] Failed to initialize reCAPTCHA:', err);
    throw err;
  }
}

/**
 * Sends a real-time SMS OTP via Google Firebase (10,000 free SMS / month).
 * 
 * @param {string} phoneNumber - Indian mobile number (e.g. 9876543210 or +91 98765 43210)
 * @param {string} containerId - DOM ID of the recaptcha container
 * @returns {Promise<{ confirmationResult: any, formattedPhone: string }>}
 */
export async function sendFirebasePhoneOtp(phoneNumber, containerId = 'recaptcha-container') {
  const check = validateIndianPhone(phoneNumber);
  if (!check.isValid) {
    throw new Error(check.message);
  }

  const instance = getFirebaseInstance();
  if (!instance) {
    throw new Error('Firebase credentials not configured. Please add VITE_FIREBASE_API_KEY in .env');
  }

  const verifier = initRecaptchaVerifier(containerId);

  try {
    const confirmationResult = await signInWithPhoneNumber(instance.auth, check.e164, verifier);
    return {
      confirmationResult,
      formattedPhone: check.formatted,
      e164Phone: check.e164
    };
  } catch (err) {
    // Reset verifier on error so subsequent clicks don't hit stale state
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {}
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

/**
 * Confirms the 6-digit verification code with Google Firebase.
 * 
 * @param {any} confirmationResult - The result returned from sendFirebasePhoneOtp
 * @param {string} code - The 6-digit OTP code entered by the user
 * @returns {Promise<any>} - Firebase user credential
 */
export async function confirmFirebasePhoneOtp(confirmationResult, code) {
  if (!confirmationResult || !confirmationResult.confirm) {
    throw new Error('Verification session expired or invalid. Please resend the code.');
  }
  const cleanCode = (code || '').toString().trim();
  if (cleanCode.length !== 6) {
    throw new Error('Please enter the full 6-digit verification code.');
  }

  const result = await confirmationResult.confirm(cleanCode);
  return result.user;
}
