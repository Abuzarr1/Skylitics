"use client";
import React, { useState, useEffect, useRef } from "react";
import { Search, History, Sparkles, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Suggestion {
    id: string;
    label: string;
    category: "Recent" | "Flight" | "Vector" | "Route";
    meta?: string;
}

interface PredictiveSearchProps {
    placeholder?: string;
    onSearch: (value: string) => void;
    suggestions: Suggestion[];
    className?: string;
    required?: boolean;
    pattern?: string;
}

export function PredictiveSearch({ 
    placeholder = "Filter Ledger...", 
    onSearch, 
    suggestions, 
    className,
    required,
    pattern
}: PredictiveSearchProps) {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [filteredNodes, setFilteredNodes] = useState<Suggestion[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (query.length > 0) {
            const filtered = suggestions.filter(s => 
                s.label.toLowerCase().includes(query.toLowerCase()) || 
                s.category.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 8);
            setFilteredNodes(filtered);
            setIsOpen(true);
            setSelectedIndex(-1);
        } else {
            setFilteredNodes([]);
            setIsOpen(false);
        }
    }, [query, suggestions]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) return;

        if (e.key === "ArrowDown") {
            setSelectedIndex(prev => Math.min(prev + 1, filteredNodes.length - 1));
        } else if (e.key === "ArrowUp") {
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === "Enter" && selectedIndex >= 0) {
            handleSelect(filteredNodes[selectedIndex]);
        } else if (e.key === "Escape") {
            setIsOpen(false);
        }
    };

    const handleSelect = (item: Suggestion) => {
        setQuery(item.label);
        onSearch(item.label);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className={`relative w-full max-w-lg ${className}`}>
            <div className="group relative flex items-center bg-brand-950/40 backdrop-blur-xl border border-white/5 focus-within:border-accent-neon/50 transition-all">
                <Search className="w-4 h-4 ml-4 text-brand-600 group-focus-within:text-accent-neon transition-colors" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setQuery(val);
                        onSearch(val);
                    }}
                    onFocus={() => query.length > 0 && setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    required={required}
                    pattern={pattern}
                    title="Valid flight designator required (e.g. DL192, BA405)"
                    aria-label={placeholder}
                    className="w-full bg-transparent px-4 py-3 font-mono text-[11px] uppercase tracking-widest text-white outline-none placeholder:text-brand-700"
                />
                {query && (
                    <button onClick={() => setQuery("")} className="mr-4 text-brand-700 hover:text-white transition-colors">
                        <X className="w-3 h-3" />
                    </button>
                ) }
                
                {/* Visual Accent Glow */}
                <div className="absolute inset-x-0 bottom-0 h-[1px] bg-accent-neon scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500 origin-left" />
            </div>

            <AnimatePresence>
                {isOpen && filteredNodes.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        className="absolute top-full left-0 right-0 mt-2 z-[100] bg-brand-950 border border-white/10 shadow-2xl overflow-hidden"
                    >
                        <div className="p-2 border-b border-white/5 bg-brand-900/50 flex items-center justify-between">
                            <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-brand-600 flex items-center gap-2">
                                <Sparkles className="w-2.5 h-2.5 text-accent-neon" /> Intelligent Predictions
                            </span>
                            <span className="font-mono text-[8px] text-brand-700">ESC to close</span>
                        </div>
                        
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {filteredNodes.map((item, idx) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleSelect(item)}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors relative group/item
                                        ${idx === selectedIndex ? "bg-accent-neon/10" : "hover:bg-white/5"}
                                    `}
                                >
                                    <div className="flex items-center gap-4">
                                        {item.category === "Recent" ? <History className="w-3 h-3 text-brand-600" /> : <div className="w-1 h-1 rounded-full bg-accent-neon/40" />}
                                        <div>
                                            <div className="text-[11px] font-mono text-white group-hover/item:text-accent-neon transition-colors uppercase tracking-widest">{item.label}</div>
                                            {item.meta && <div className="text-[9px] font-mono text-brand-600 uppercase tracking-tighter mt-0.5">{item.meta}</div>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[8px] font-mono text-brand-700 uppercase tracking-widest px-1.5 py-0.5 border border-white/5 bg-brand-900">
                                            {item.category}
                                        </span>
                                        <ChevronRight className={`w-3 h-3 text-accent-neon transition-transform ${idx === selectedIndex ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"}`} />
                                    </div>
                                    
                                    {/* Active selection indicator */}
                                    {idx === selectedIndex && (
                                        <div className="absolute inset-y-0 left-0 w-0.5 bg-accent-neon" />
                                    )}
                                </button>
                            ))}
                        </div>
                        
                        <div className="p-3 bg-brand-900/50 border-t border-white/5">
                            <div className="flex items-center justify-between">
                                <div className="font-mono text-[8px] text-brand-600 uppercase tracking-widest">SkyCore Search Engine v4.0</div>
                                <div className="flex gap-1">
                                    <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-brand-400">↵</kbd>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
