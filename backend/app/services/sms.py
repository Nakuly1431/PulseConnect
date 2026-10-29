import os, json, logging, urllib.request, urllib.parse, base64
from app.core.config import settings

logger = logging.getLogger("pulseconnect.sms")

def send_realtime_sms_otp(phone_number: str, otp: str) -> dict:
    digits = "".join(c for c in phone_number if c.isdigit())
    local_phone = digits[-10:] if len(digits) >= 10 else digits

    # Fast2SMS (India Quick OTP)
    fast2sms_key = (os.getenv("FAST2SMS_API_KEY", "") or getattr(settings, "FAST2SMS_API_KEY", "")).strip()
    if len(fast2sms_key) > 5:
        try:
            params = urllib.parse.urlencode({
                "route": "otp",
                "variables_values": otp,
                "numbers": local_phone
            })
            url = f"https://www.fast2sms.com/dev/bulkV2?{params}"
            req = urllib.request.Request(
                url,
                headers={
                    "authorization": fast2sms_key,
                    "cache-control": "no-cache"
                }
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if data.get("return") is True:
                    logger.info(f"[REAL-TIME SMS] Fast2SMS dispatched to {local_phone}: {data}")
                    return {"success": True, "provider": "Fast2SMS", "response": data}
                else:
                    msg = data.get("message")
                    if isinstance(msg, list):
                        msg = ", ".join(str(m) for m in msg)
                    logger.warning(f"[REAL-TIME SMS REJECTED] Fast2SMS rejected for {local_phone}: {msg} (data: {data})")
                    return {"success": False, "provider": "Fast2SMS", "error": msg or "Fast2SMS rejected request (check balance or account status)"}
        except urllib.error.HTTPError as e:
            err_body = ""
            try:
                err_body = e.read().decode("utf-8")
            except Exception:
                pass
            logger.error(f"[REAL-TIME SMS ERROR] Fast2SMS HTTP {e.code}: {err_body or e.reason}")
            return {"success": False, "provider": "Fast2SMS", "error": f"HTTP {e.code}: {e.reason}"}
        except Exception as e:
            logger.error(f"[REAL-TIME SMS ERROR] Fast2SMS failed: {e}")
            return {"success": False, "provider": "Fast2SMS", "error": str(e)}

    # Twilio (Global Carrier Gateway)
    t_sid = (os.getenv("TWILIO_ACCOUNT_SID", "") or getattr(settings, "TWILIO_ACCOUNT_SID", "")).strip()
    t_tok = (os.getenv("TWILIO_AUTH_TOKEN", "") or getattr(settings, "TWILIO_AUTH_TOKEN", "")).strip()
    t_from = (os.getenv("TWILIO_FROM_PHONE", "") or getattr(settings, "TWILIO_FROM_PHONE", "")).strip()
    if t_sid and t_tok and t_from:
        try:
            target = phone_number if phone_number.startswith("+") else f"+91{local_phone}"
            payload = urllib.parse.urlencode({
                "To": target, "From": t_from,
                "Body": f"PulseConnect: Your emergency blood verification OTP is {otp}. Valid for 10 minutes. Do not share."
            }).encode("utf-8")
            auth = base64.b64encode(f"{t_sid}:{t_tok}".encode("ascii")).decode("ascii")
            req = urllib.request.Request(
                f"https://api.twilio.com/2010-04-01/Accounts/{t_sid}/Messages.json",
                data=payload,
                method="POST",
                headers={"Authorization": f"Basic {auth}"}
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if data.get("error_code"):
                    logger.warning(f"[REAL-TIME SMS REJECTED] Twilio error {data.get('error_code')}: {data.get('error_message')}")
                    return {"success": False, "provider": "Twilio", "error": data.get("error_message")}
                logger.info(f"[REAL-TIME SMS] Twilio dispatched to {target}: {data.get('sid')}")
                return {"success": True, "provider": "Twilio", "sid": data.get("sid")}
        except urllib.error.HTTPError as e:
            err_body = ""
            try:
                err_body = e.read().decode("utf-8")
            except Exception:
                pass
            logger.error(f"[REAL-TIME SMS ERROR] Twilio HTTP {e.code}: {err_body or e.reason}")
            return {"success": False, "provider": "Twilio", "error": f"Twilio HTTP {e.code}: {e.reason}"}
        except Exception as e:
            logger.error(f"[REAL-TIME SMS ERROR] Twilio failed: {e}")
            return {"success": False, "provider": "Twilio", "error": str(e)}

    # Development Simulation
    logger.info(f"[SMS SIMULATOR] To: +91 {local_phone} | Code: {otp}")
    return {"success": True, "provider": "Simulator", "message": "Real-time SMS simulated. To send real SMS, add FAST2SMS_API_KEY to your environment variables."}
