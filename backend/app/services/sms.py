import os
import json
import logging
import urllib.request
import urllib.parse
from app.core.config import settings

logger = logging.getLogger("pulseconnect.sms")

def send_realtime_sms_otp(phone_number: str, otp: str) -> dict:
    """
    Dispatches a real-time 6-digit SMS OTP to the blood needer's mobile phone.
    
    Supports:
    1. Fast2SMS (Recommended for India - Quick OTP Route, no DLT registration needed for dev)
    2. Twilio (Global SMS Carrier Gateway)
    3. Development Simulator (Console log when no API key configured)
    """
    clean_phone = "".join(c for c in phone_number if c.isdigit())
    # Strip leading 91 or 0 for 10-digit Indian numbers if needed
    local_phone = clean_phone[-10:] if len(clean_phone) >= 10 else clean_phone

    # --- PROVIDER 1: Fast2SMS (India Quick OTP) ---
    fast2sms_key = getattr(settings, "FAST2SMS_API_KEY", None) or os.getenv("FAST2SMS_API_KEY")
    if fast2sms_key and len(fast2sms_key.strip()) > 5:
        try:
            url = "https://www.fast2sms.com/dev/bulkV2"
            params = {
                "authorization": fast2sms_key.strip(),
                "route": "otp",
                "variables_values": otp,
                "numbers": local_phone
            }
            query_string = urllib.parse.urlencode(params)
            req = urllib.request.Request(f"{url}?{query_string}", method="GET")
            req.add_header("cache-control", "no-cache")

            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                logger.info(f"[REAL-TIME SMS] Fast2SMS dispatched to {local_phone}: {data}")
                return {"success": True, "provider": "Fast2SMS", "response": data}
        except Exception as e:
            logger.error(f"[REAL-TIME SMS ERROR] Fast2SMS failed: {e}")
            return {"success": False, "provider": "Fast2SMS", "error": str(e)}

    # --- PROVIDER 2: Twilio (Global Carrier Gateway) ---
    twilio_sid = getattr(settings, "TWILIO_ACCOUNT_SID", None) or os.getenv("TWILIO_ACCOUNT_SID")
    twilio_token = getattr(settings, "TWILIO_AUTH_TOKEN", None) or os.getenv("TWILIO_AUTH_TOKEN")
    twilio_from = getattr(settings, "TWILIO_FROM_PHONE", None) or os.getenv("TWILIO_FROM_PHONE")

    if twilio_sid and twilio_token and twilio_from:
        try:
            import base64
            target_phone = f"+91{local_phone}" if not phone_number.startswith("+") else phone_number
            url = f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json"
            
            payload = urllib.parse.urlencode({
                "To": target_phone,
                "From": twilio_from,
                "Body": f"PulseConnect: Your emergency blood verification OTP is {otp}. Valid for 10 minutes. Do not share."
            }).encode("utf-8")

            req = urllib.request.Request(url, data=payload, method="POST")
            auth_str = f"{twilio_sid}:{twilio_token}"
            b64_auth = base64.b64encode(auth_str.encode("ascii")).decode("ascii")
            req.add_header("Authorization", f"Basic {b64_auth}")

            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                logger.info(f"[REAL-TIME SMS] Twilio dispatched to {target_phone}: {data.get('sid')}")
                return {"success": True, "provider": "Twilio", "sid": data.get("sid")}
        except Exception as e:
            logger.error(f"[REAL-TIME SMS ERROR] Twilio failed: {e}")
            return {"success": False, "provider": "Twilio", "error": str(e)}

    # --- PROVIDER 3: Development & Local Simulation ---
    logger.info(
        f"\n{'='*55}\n"
        f" [DEVELOPMENT SMS GATEWAY SIMULATOR]\n"
        f" To: +91 {local_phone}\n"
        f" Message: PulseConnect Emergency Verification Code is: {otp}\n"
        f" (To send real SMS to phones, set FAST2SMS_API_KEY in .env)\n"
        f"{'='*55}"
    )
    return {
        "success": True,
        "provider": "Simulator",
        "message": f"Real-time SMS simulated. To send real SMS, add FAST2SMS_API_KEY to your .env file."
    }
