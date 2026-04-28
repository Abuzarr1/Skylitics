import asyncio
import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy import text, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.modules.notifications.models import Notification, NotificationPreference, NotificationType
from app.ml.inference.predictor import run_inference
from app.core.mail import Mailer

logger = logging.getLogger(__name__)

async def run_watcher_cycle():
    """
    The heart of the Skylytics Pulse.
    Checks upcoming flights against user preferences and triggers AI alerts.
    """
    logger.info("[Watcher] Starting automated AI pulse check...")
    
    async with AsyncSessionLocal() as db:
        try:
            # 1. Find upcoming flights in the next 4 hours
            now = datetime.now(timezone.utc)
            horizon = now + timedelta(hours=4)
            
            result = await db.execute(text("""
                SELECT 
                    f.id, f.flight_number, al.iata as airline, 
                    orig.iata as origin, dest.iata as destination,
                    f.scheduled_dep, f.scheduled_arr, a.registration as tail_number,
                    r.distance_km as distance
                FROM flights f
                JOIN airlines al ON al.id = f.airline_id
                JOIN airports orig ON orig.id = f.origin_id
                JOIN airports dest ON dest.id = f.dest_id
                JOIN aircraft a   ON a.id = f.aircraft_id
                LEFT JOIN routes r ON (r.origin_id = f.origin_id AND r.dest_id = f.dest_id)
                WHERE f.scheduled_dep BETWEEN :now AND :horizon
                  AND f.status = 'SCHEDULED'
            """), {"now": now, "horizon": horizon})
            
            flights = result.mappings().all()
            if not flights:
                logger.info("[Watcher] No active upcoming flights to monitor.")
                return

            # 2. Get all users with notifications enabled
            pref_result = await db.execute(text("""
                SELECT np.*, u.email, u.id as user_uuid
                FROM notification_preferences np
                JOIN users u ON u.id = np.user_id
                WHERE np.push_enabled = true OR np.email_enabled = true
            """))
            user_prefs = pref_result.mappings().all()

            for f in flights:
                # 3. Perform AI Inference for this flight pulse
                # Note: run_inference is synchronous and CPU-heavy. 
                # We offload it to a thread to avoid blocking the event loop.
                prediction = await asyncio.to_thread(
                    run_inference,
                    f["airline"],
                    f["origin"],
                    f["destination"],
                    f["scheduled_dep"].strftime("%Y-%m-%d"),
                    f["scheduled_dep"].strftime("%H:%M"),
                    f["distance"] or 500,
                    {},  # overrides
                    f["tail_number"]
                )
                
                risk_score = prediction["data"]["hybrid_probability"]
                
                # 4. Check against user thresholds
                for pref in user_prefs:
                    threshold = float(pref["delay_threshold_pct"]) / 100.0
                    
                    if risk_score >= threshold:
                        # Check if we already sent a notification for this flight to this user recently
                        dup_check = await db.execute(select(Notification).where(
                            Notification.user_id == pref["user_uuid"],
                            Notification.callsign == f["flight_number"]
                        ))
                        if dup_check.scalars().first():
                            continue # Skip if already notified

                        # 5. Create In-App Notification
                        new_notif = Notification(
                            user_id=pref["user_uuid"],
                            type=NotificationType.AT_RISK,
                            title=f"AI Alert: {f['flight_number']} Risk Critical",
                            body=f"Automated AI pulse detected a {int(risk_score*100)}% delay risk for your upcoming flight {f['flight_number']}. Operation advisory recommended.",
                            callsign=f["flight_number"]
                        )
                        db.add(new_notif)
                        
                        # 6. Trigger Email if enabled
                        if pref["email_enabled"]:
                            await Mailer.send_alert(
                                email=pref["email"],
                                title=f"Skylytics Delay Advisory: {f['flight_number']}",
                                body=f"The Skylytics Dual-Stage Stacking Ensemble has flagged flight {f['flight_number']} as a high-risk operational node. Sequential Bi-LSTM analysis suggests a cascading delay probability of {int(risk_score*100)}%.",
                                callsign=f["flight_number"],
                                risk=risk_score
                            )
            
            await db.commit()
            logger.info("[Watcher] Automated pulse cycle completed successfully.")
            
        except Exception as e:
            logger.error(f"[Watcher] ERROR during pulse cycle: {e}")
            await db.rollback()

async def start_watcher_loop(interval_minutes: int = 5):
    """Infinite loop for the background worker."""
    # Give the server a moment to start handling requests before first pulse
    await asyncio.sleep(30) 
    while True:
        await run_watcher_cycle()
        await asyncio.sleep(interval_minutes * 60)
