import logging
from typing import List, Optional
import os

logger = logging.getLogger(__name__)

class Mailer:
    """
    Utility for sending branded HTML emails.
    Includes a beautiful mockup-ready template for the Skylytics Command Center.
    """
    
    @staticmethod
    def _get_html_template(title: str, body: str, callsign: Optional[str] = None, risk: Optional[float] = None):
        risk_color = "#DFFF00" if (risk or 0) < 0.7 else "#FF3B30"
        risk_text = f"{int((risk or 0) * 100)}%" if risk else "N/A"
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ background-color: #050505; color: #ffffff; font-family: 'Inter', -apple-system, sans-serif; margin: 0; padding: 40px; }}
                .container {{ max-width: 600px; margin: 0 auto; border: 1px solid #1a1a1a; padding: 30px; background-color: #0a0a0a; }}
                .header {{ border-bottom: 2px solid #DFFF00; padding-bottom: 20px; margin-bottom: 30px; }}
                .logo {{ font-weight: 900; font-size: 24px; text-transform: uppercase; letter-spacing: -2px; }}
                .logo span {{ color: #DFFF00; }}
                .title {{ font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #DFFF00; text-transform: uppercase; }}
                .body {{ font-size: 14px; line-height: 1.6; color: #a1a1a1; margin-bottom: 30px; }}
                .stats-box {{ display: flex; gap: 20px; background: #000; padding: 20px; border: 1px solid #1a1a1a; margin-bottom: 30px; }}
                .stat {{ flex: 1; }}
                .stat-label {{ font-size: 9px; text-transform: uppercase; color: #555; letter-spacing: 1px; }}
                .stat-value {{ font-size: 18px; font-weight: bold; color: {risk_color}; }}
                .footer {{ font-size: 10px; color: #333; text-transform: uppercase; letter-spacing: 1px; margin-top: 40px; border-top: 1px solid #1a1a1a; padding-top: 20px; }}
                .action-btn {{ display: inline-block; padding: 12px 24px; background-color: #DFFF00; color: #000; text-decoration: none; font-weight: 800; font-size: 12px; text-transform: uppercase; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">SKYLYTICS<span>.</span></div>
                </div>
                <div class="title">{title}</div>
                <div class="body">
                    {body}
                </div>
                
                <div class="stats-box">
                    <div class="stat">
                        <div class="stat-label">Flight</div>
                        <div class="stat-value" style="color: #fff;">{callsign or "SYSTEM"}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">AI Risk Level</div>
                        <div class="stat-value">{risk_text}</div>
                    </div>
                </div>
                
                <a href="http://localhost:3000/manager" class="action-btn">Open Command Center</a>
                
                <div class="footer">
                    SKYLYTICS PULSE v4.0 — AUTOMATED AI SURVEILLANCE ACTIVE
                </div>
            </div>
        </body>
        </html>
        """

    @classmethod
    async def send_alert(cls, email: str, title: str, body: str, callsign: Optional[str] = None, risk: Optional[float] = None):
        html_content = cls._get_html_template(title, body, callsign, risk)
        
        # LOGGING MOCK: We output the formatted HTML for demo purposes
        print(f"\n[SKYLYTICS MAILER] >>> OUTGOING EMAIL TO: {email}")
        print(f"[SKYLYTICS MAILER] >>> SUBJECT: {title}")
        print("-" * 30)
        # We only log a preview of the body to keep the logs clean, but save the full HTML to a temporary 'outbox' for the user to see
        print(f"Content: {body}")
        print("-" * 30)
        
        # Save to virtual outbox for user inspection
        outbox_dir = "/tmp/skylytics_outbox"
        os.makedirs(outbox_dir, exist_ok=True)
        filename = f"{outbox_dir}/email_{callsign or 'alert'}.html"
        with open(filename, "w") as f:
            f.write(html_content)
        
        logger.info(f"Email alert recorded in {filename} for user {email}")
        print(f"[SKYLYTICS MAILER] >>> BRANDED HTML RENDERED AT: {filename}\n")
        return True
