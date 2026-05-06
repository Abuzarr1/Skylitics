"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Bot, 
    Terminal, 
    Send, 
    Sparkles, 
    Zap, 
    Activity, 
    Shield, 
    Cpu,
    ArrowRight,
} from "lucide-react";
import { queryAssistant } from "@/lib/api";
import { getAirportStats, getFeedItems } from "@/lib/csvUtils";
import { useData } from "@/lib/useData";

interface Message {
    role: 'user' | 'assistant' | 'sys';
    content: string;
    timestamp: string;
}

export default function AssistantPage() {
    const { rows } = useData();
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "> [SYSTEM_BOOT]: SkyAI Copilot Node 01 Online.\n> Neural network synchronization complete.\n> Ready for operational queries. Try: 'ATL weather' or 'Show network status'.",
            timestamp: ""
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Set initial timestamp after mount to avoid hydration mismatch
    useEffect(() => {
        setMessages(prev => prev.map((m, i) => i === 0 && !m.timestamp ? { ...m, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) } : m));
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e?: React.FormEvent, overrideMsg?: string) => {
        e?.preventDefault();
        const userMsg = (overrideMsg ?? input).trim();
        if (!userMsg || isLoading) return;
        if (!overrideMsg) setInput("");
        
        const newMessages: Message[] = [
            ...messages,
            { 
                role: 'user', 
                content: userMsg, 
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) 
            }
        ];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            const data = await queryAssistant(userMsg);
            let response = data?.response || "> [SYSTEM_ERROR]: Unrecognizable telemetry received from Neural Core. Diagnostics initiated.";
            
            // Local Fallback Logic: If backend says "Sensor sync required", provide immersive mock response
            if (response.includes("Sensor sync required") || response.includes("telemetry unavailable") || response.includes("SYSTEM_ERROR")) {
                const upperMsg = userMsg.toUpperCase();
                
                if (upperMsg.includes("STATUS") || upperMsg.includes("SUMMARY") || upperMsg.includes("NETWORK")) {
                    const stats = getAirportStats('ATL', rows);
                    response = `> [SKYAI_ARCHIVE_VECTOR]: Real-time network telemetry unavailable. Loading intelligence baseline for hub ATL...\n` +
                               `> ▸ Status: ${stats.riskLevel.toUpperCase()}\n` +
                               `> ▸ Total Flights: ${stats.totalFlights}\n` +
                               `> ▸ Delayed: ${stats.delayed}\n` +
                               `> ▸ Reliability: ${(stats.onTime / stats.totalFlights * 100).toFixed(1)}%\n` +
                               `> ▸ System baseline sync: 100% (Local Intelligence Node)`;
                } else if (upperMsg.includes("FEED") || upperMsg.includes("FLIGHTS") || upperMsg.includes("RISK")) {
                    const items = getFeedItems(rows).slice(0, 3);
                    response = `> [SKYAI_ARCHIVE_VECTOR]: Operational flight sequence recovered from node buffer:\n` +
                               items.map(i => `> ▸ ${i.flightNumber} | ${i.origin}→${i.destination} | ${i.status.toUpperCase()}`).join('\n') +
                               `\n> Analysis: Intelligence suggests nominal flow with minor latency.`;
                } else {
                    const airport = ['ATL', 'JFK', 'ORD', 'LAX', 'MIA', 'DFW', 'SFO', 'DEN', 'SEA'].find(code => upperMsg.includes(code)) || 'ATL';
                    const stats = getAirportStats(airport, rows);
                    response = `> [SKYAI_ARCHIVE_VECTOR]: Operational intelligence for ${airport} node:\n` +
                               `> ▸ Current Risk: ${stats.riskLevel.toUpperCase()}\n` +
                               `> ▸ Delayed Flights: ${stats.delayed}\n` +
                               `> ▸ Avg Latency: ${stats.avgDelayMinutes} min\n` +
                               `> Source: Local Intelligence Binary.`;
                }
            }

            setMessages(prev => [
                ...prev,
                { 
                    role: 'assistant', 
                    content: response, 
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) 
                }
            ]);
        } catch (err: any) {
            setMessages(prev => [
                ...prev,
                { 
                    role: 'sys', 
                    content: `> [ERROR]: Critical failure. Path: /api/v1/assistant/query. Detail: ${err.message}`, 
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) 
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const quickQueries = [
        "What is the status of ATL?",
        "Show network summary",
        "Any at-risk flights?",
        "Weather for JFK"
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] bg-[var(--ch-brand-900)] overflow-hidden relative">
            {/* Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.1),rgba(0,255,0,0.05),rgba(0,0,255,0.1))] bg-[length:100%_4px,3px_100%]" />

            {/* Header */}
            <div className="border-b border-white/5 bg-[var(--bg-card)]/50 backdrop-blur-md px-10 py-6 flex justify-between items-center z-40">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 border border-accent-neon/30 bg-accent-neon/10 flex items-center justify-center text-accent-neon">
                        <Bot className="w-5 h-5 hover:scale-110 transition-transform" />
                    </div>
                    <div>
                        <h1 className="text-xl font-heading font-black text-white uppercase tracking-tight">SkyAI Copilot</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-neon animate-pulse" />
                            <span className="text-[9px] font-mono text-brand-500 uppercase tracking-widest leading-none">Neural Core v1.4.2 Connected</span>
                        </div>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-6">
                    <div className="font-mono text-[10px] text-brand-400 uppercase tracking-widest border-l border-[var(--border-ui)] pl-6">
                        <span className="block text-white mb-0.5">XGBoost Optimized</span>
                    </div>
                </div>
            </div>

            {/* Chat Body */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-6 md:px-20 py-10 space-y-8 scrollbar-hide flex flex-col"
            >
                <div className="max-w-4xl mx-auto w-full flex flex-col gap-8">
                    <AnimatePresence>
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10, x: msg.role === 'user' ? 20 : -20 }}
                                animate={{ opacity: 1, y: 0, x: 0 }}
                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div className={`max-w-[85%] md:max-w-[75%] p-5 rounded-sm border ${
                                    msg.role === 'user' 
                                        ? 'bg-[var(--bg-card)] border-[var(--border-ui)] text-white' 
                                        : msg.role === 'sys'
                                            ? 'bg-accent-alert/5 border-accent-alert/20 text-accent-alert'
                                            : 'bg-brand-800/40 border-white/5 text-brand-200'
                                }`}>
                                    <div className="flex items-center gap-2 mb-3">
                                        {msg.role === 'assistant' ? (
                                            <Sparkles className="w-3 h-3 text-accent-neon" />
                                        ) : msg.role === 'user' ? (
                                            <Activity className="w-3 h-3 text-brand-500" />
                                        ) : (
                                            <Shield className="w-3 h-3 text-accent-alert" />
                                        )}
                                        <span className="text-[9px] font-mono uppercase tracking-[0.3em] opacity-50">
                                            {msg.role === 'assistant' ? 'SKYAI_NODE' : msg.role === 'user' ? 'USER_COM' : 'SYS_LOG'}
                                        </span>
                                        <span className="text-[9px] font-mono ml-auto opacity-30 tracking-tight">{msg.timestamp}</span>
                                    </div>
                                    <p className="font-mono text-sm leading-relaxed whitespace-pre-wrap selection:bg-accent-neon selection:text-black">
                                        {msg.content}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-4 text-accent-neon font-mono text-[10px] uppercase tracking-[0.3em]"
                        >
                            <Terminal className="w-4 h-4 animate-pulse" />
                            <span className="animate-pulse">Neural Decryption in Progress...</span>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="p-10 bg-[var(--ch-brand-900)]/50 backdrop-blur-xl border-t border-white/5 relative z-40">
                <div className="max-w-4xl mx-auto">
                    {/* Quick Query Box */}
                    <div className="flex flex-wrap gap-3 mb-6">
                        {quickQueries.map((q) => (
                            <button
                                key={q}
                                onClick={() => handleSend(undefined, q)}
                                className="px-3 py-1.5 bg-[var(--bg-surface)] border border-white/5 hover:border-accent-neon/30 hover:bg-white/10 text-[10px] font-mono uppercase tracking-widest text-brand-400 hover:text-white transition-all rounded-sm flex items-center gap-2"
                            >
                                <Zap className="w-3 h-3 text-accent-neon opacity-50" />
                                {q}
                            </button>
                        ))}
                    </div>

                    <form 
                        onSubmit={handleSend}
                        className="flex gap-4 p-1 bg-[var(--bg-card)] border border-[var(--border-ui)] group focus-within:border-accent-neon/50 transition-colors shadow-2xl"
                    >
                        <div className="flex items-center px-4 text-brand-600">
                            <Terminal className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="QUERY SYSTEM OR STATUS VECTOR..."
                            maxLength={2000}
                            className="flex-1 bg-transparent py-4 text-sm font-mono text-white focus:outline-none placeholder:text-brand-700 uppercase tracking-wider"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="bg-foreground hover:bg-accent-neon text-brand-900 px-8 flex items-center gap-2 font-heading font-black uppercase text-xs tracking-tighter disabled:opacity-50 transition-colors group"
                        >
                            <Send className="w-3 h-3 group-hover:rotate-45 transition-transform" />
                            Execute
                        </button>
                    </form>
                    <div className="mt-4 flex justify-between items-center text-[8px] font-mono text-brand-600 uppercase tracking-widest">
                        <span>Encrypted Session / TLS 1.3</span>
                        <span>Multi-Modal Interface / Skylytics v4.0</span>
                    </div>
                </div>
            </div>

            {/* Side Background Accents */}
            <div className="absolute top-1/2 -left-10 w-40 h-80 bg-accent-neon/5 blur-[120px] rounded-full z-0 pointer-events-none" />
            <div className="absolute top-1/2 -right-10 w-40 h-80 bg-blue-500/5 blur-[120px] rounded-full z-0 pointer-events-none" />
        </div>
    );
}
