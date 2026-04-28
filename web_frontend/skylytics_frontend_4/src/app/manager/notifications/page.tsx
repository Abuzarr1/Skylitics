"use client";
import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Trash2, AlertTriangle, CloudRain, Info, Plane } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
} from "@/lib/api";

const TYPE_CONFIG: Record<string, { icon: any; color: string; border: string }> = {
    DELAY_ALERT:    { icon: AlertTriangle, color: "text-accent-alert",  border: "border-l-accent-alert" },
    AT_RISK:        { icon: Plane,         color: "text-yellow-400",    border: "border-l-yellow-400"   },
    WEATHER_IMPACT: { icon: CloudRain,     color: "text-accent-ice",    border: "border-l-accent-ice"   },
    GATE_CHANGE:    { icon: Info,          color: "text-accent-neon",   border: "border-l-accent-neon"  },
    SYSTEM:         { icon: Bell,          color: "text-brand-400",     border: "border-l-brand-600"    },
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        const data = await getNotifications();
        setNotifications(data);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleRead = async (id: string) => {
        await markNotificationRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    const handleDelete = async (id: string) => {
        await deleteNotification(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleReadAll = async () => {
        await markAllNotificationsRead();
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    const unread = notifications.filter(n => !n.is_read).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <span className="font-mono text-xs uppercase tracking-widest text-brand-500 animate-pulse">Loading alerts...</span>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto px-4 md:px-12 py-10">
            <div className="max-w-3xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-heading font-black uppercase tracking-tight text-white">Alert Feed</h1>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-brand-500 mt-1">
                        {unread > 0 ? `${unread} unread alert${unread > 1 ? "s" : ""}` : "All caught up"}
                    </p>
                </div>
                {unread > 0 && (
                    <button
                        onClick={handleReadAll}
                        className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest border border-[var(--border-ui)] text-brand-300 px-4 py-2 hover:bg-white hover:text-black transition-colors"
                    >
                        <CheckCheck className="w-3 h-3" />
                        Mark All Read
                    </button>
                )}
            </div>

            {/* List */}
            {notifications.length === 0 ? (
                <div className="border border-white/5 bg-[var(--bg-card)] p-12 text-center">
                    <Bell className="w-8 h-8 text-brand-600 mx-auto mb-3" />
                    <p className="font-mono text-xs uppercase tracking-widest text-brand-500">No notifications</p>
                </div>
            ) : (
                <div className="space-y-2">
                    <AnimatePresence>
                        {notifications.map((n) => {
                            const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.SYSTEM;
                            const Icon = cfg.icon;
                            return (
                                <motion.div
                                    key={n.id}
                                    layout
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className={`flex items-start gap-4 bg-[var(--bg-card)] border border-white/5 border-l-2 ${cfg.border} px-5 py-4 ${n.is_read ? "opacity-50" : ""}`}
                                >
                                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`font-mono text-[9px] uppercase tracking-widest ${cfg.color}`}>{n.type.replace("_", " ")}</span>
                                            {n.callsign && (
                                                <span className="font-mono text-[9px] uppercase tracking-widest text-brand-500 border border-[var(--border-ui)] px-1.5 py-0.5">{n.callsign}</span>
                                            )}
                                            {!n.is_read && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-accent-alert ml-auto shrink-0" />
                                            )}
                                        </div>
                                        <p className="font-mono text-xs text-white font-semibold mb-1">{n.title}</p>
                                        <p className="font-mono text-[11px] text-brand-400 leading-relaxed">{n.body}</p>
                                        <p className="font-mono text-[9px] text-brand-600 mt-2 uppercase tracking-widest">
                                            {new Date(n.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {!n.is_read && (
                                            <button onClick={() => handleRead(n.id)} className="p-1.5 text-brand-500 hover:text-accent-neon transition-colors" title="Mark read">
                                                <Check className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <button onClick={() => handleDelete(n.id)} className="p-1.5 text-brand-500 hover:text-accent-alert transition-colors" title="Delete">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
            </div>
        </div>
    );
}
