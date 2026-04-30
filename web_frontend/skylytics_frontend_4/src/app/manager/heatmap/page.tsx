"use client";
import React, { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Html, Float } from "@react-three/drei";
import { Activity, Zap, Shield, Globe as GlobeIcon, AlertCircle, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { getHeatmapData, getLiveFlights } from "@/lib/api";

// --- Helpers ---
function latLongToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));
    return new THREE.Vector3(x, y, z);
}

// --- Components ---

function NetworkArc({ start, end, color, delay }: { start: THREE.Vector3, end: THREE.Vector3, color: string, delay: boolean }) {
    const curve = useMemo(() => {
        const mid = start.clone().lerp(end, 0.5).normalize().multiplyScalar(start.length() * 1.4);
        return new THREE.QuadraticBezierCurve3(start, mid, end);
    }, [start, end]);

    const lineRef = useRef<THREE.LineLoop>(null!);
    
    useFrame((state) => {
        if (lineRef.current) {
            // Subtle pulse or flow simulation
            const s = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
            lineRef.current.scale.set(s, s, s);
        }
    });

    return (
        <group>
            {/* Base Path */}
            <line>
                <bufferGeometry attach="geometry" {...new THREE.BufferGeometry().setFromPoints(curve.getPoints(50))} />
                <lineBasicMaterial attach="material" color={color} opacity={0.3} transparent linewidth={1} />
            </line>
            
            {/* Glowing Tracer (Animated Data Flow) */}
            <mesh>
                <tubeGeometry args={[curve, 50, 0.005, 8, false]} />
                <meshBasicMaterial color={color} opacity={0.8} transparent />
            </mesh>
            
            {delay && (
                <pointLight position={curve.getPoint(0.5)} color="#FF3B30" intensity={0.5} distance={1} />
            )}
        </group>
    );
}

function Hub({ node }: { node: any }) {
    const pos = useMemo(() => latLongToVector3(node.lat, node.lon, 2), [node.lat, node.lon]);
    const [hovered, setHover] = useState(false);
    const meshRef = useRef<THREE.Mesh>(null!);

    useFrame((state) => {
        if (meshRef.current) {
            const pulse = 1 + Math.sin(state.clock.elapsedTime * (node.risk > 0.5 ? 8 : 2)) * 0.1;
            meshRef.current.scale.set(pulse, pulse, pulse);
        }
    });

    return (
        <group position={pos}>
            <mesh 
                ref={meshRef} 
                onPointerOver={() => setHover(true)} 
                onPointerOut={() => setHover(false)}
            >
                <sphereGeometry args={[node.risk > 0.6 ? 0.06 : 0.03, 16, 16]} />
                <meshBasicMaterial color={node.color} />
            </mesh>
            
            {/* Halo for high risk hubs */}
            {node.risk > 0.6 && (
                <mesh>
                    <sphereGeometry args={[0.08, 16, 16]} />
                    <meshBasicMaterial color={node.color} opacity={0.2} transparent />
                </mesh>
            )}

            <AnimatePresence>
                {hovered && (
                    <Html distanceFactor={10}>
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[var(--bg-card)] border border-white/20 p-4 -translate-x-1/2 -translate-y-[120%] flex flex-col font-mono uppercase tracking-[0.2em] text-[8px] whitespace-nowrap shadow-2xl backdrop-blur-xl"
                        >
                            <div className="flex items-center gap-2 mb-2 border-b border-[var(--border-ui)] pb-2">
                                <Zap className="w-3 h-3 text-accent-neon" />
                                <span className="text-white font-black text-[10px]">{node.airport} HUB</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-brand-500">OPERATIONAL RISK</span>
                                <span className={node.risk > 0.5 ? "text-accent-alert underline" : "text-accent-neon"}>
                                    {(node.risk * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex justify-between gap-4 mt-1">
                                <span className="text-brand-500">STATUS</span>
                                <span className="text-white">{node.risk > 0.6 ? "CRITICAL" : "OPTIMAL"}</span>
                            </div>
                            {node.reasoning && (
                                <div className="mt-3 pt-2 border-t border-[var(--border-ui)]">
                                    <div className="text-[7px] text-accent-neon mb-1 italic opacity-80">AI INSIGHT // 04-B</div>
                                    <div className="text-white font-bold leading-tight break-words uppercase">
                                        {node.reasoning}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </Html>
                )}
            </AnimatePresence>
        </group>
    );
}

function GlobalNetwork({ hubs, routes }: { hubs: any[], routes: any[] }) {
    const globeRef = useRef<THREE.Group>(null!);
    
    useFrame((state, delta) => {
        if (globeRef.current) {
            globeRef.current.rotation.y += delta * 0.05;
        }
    });

    return (
        <group ref={globeRef}>
            {/* Core Globe (Wireframe Style for Ops Look) */}
            <Sphere args={[2, 40, 40]}>
                <meshPhongMaterial 
                    color="#0a0c10" 
                    emissive="#1a1a1a"
                    wireframe 
                    opacity={0.15} 
                    transparent 
                />
            </Sphere>
            <Sphere args={[1.98, 40, 40]}>
                <meshBasicMaterial color="#000000" opacity={0.6} transparent />
            </Sphere>

            {/* Arcs (Connections) */}
            {routes.map((route, i) => {
                const start = latLongToVector3(route.origin_lat, route.origin_lon, 2.01);
                const end = latLongToVector3(route.dest_lat, route.dest_lon, 2.01);
                return (
                    <NetworkArc 
                        key={`route-${i}`} 
                        start={start} 
                        end={end} 
                        color={route.status === 'delayed' ? "#FF3B30" : route.status === 'at_risk' ? "#FBBF24" : "#DFFF00"}
                        delay={route.status !== 'on_time'}
                    />
                );
            })}

            {/* Hubs (Airports) */}
            {hubs.map((hub) => (
                <Hub key={hub.airport} node={hub} />
            ))}
        </group>
    );
}

// --- Main Page ---

import * as Mocks from "@/lib/mocks";

const AIRPORT_COORDS: Record<string, { lat: number; lon: number }> = {
    ATL: { lat: 33.6367, lon: -84.4281 },
    LAX: { lat: 33.9425, lon: -118.4081 },
    ORD: { lat: 41.9742, lon: -87.9073 },
    DFW: { lat: 32.8998, lon: -97.0403 },
    DEN: { lat: 39.8561, lon: -104.6737 },
    JFK: { lat: 40.6413, lon: -73.7781 },
    SFO: { lat: 37.6213, lon: -122.3790 },
    SEA: { lat: 47.4502, lon: -122.3088 },
    MIA: { lat: 25.7959, lon: -80.2870 },
};

const INITIAL_HUBS = [
    { airport: "ATL", lat: 33.6367, lon: -84.4281, risk: 0.45, color: "#DFFF00" },
    { airport: "ORD", lat: 41.9742, lon: -87.9073, risk: 0.62, color: "#FF3B30" },
    { airport: "DFW", lat: 32.8998, lon: -97.0403, risk: 0.35, color: "#DFFF00" },
    { airport: "DEN", lat: 39.8561, lon: -104.6737, risk: 0.28, color: "#DFFF00" },
    { airport: "LAX", lat: 33.9425, lon: -118.4081, risk: 0.52, color: "#FBBF24" },
    { airport: "JFK", lat: 40.6413, lon: -73.7781,  risk: 0.48, color: "#FBBF24" },
    { airport: "SFO", lat: 37.6213, lon: -122.3790, risk: 0.38, color: "#DFFF00" },
    { airport: "SEA", lat: 47.4502, lon: -122.3088, risk: 0.30, color: "#DFFF00" },
    { airport: "MIA", lat: 25.7959, lon: -80.2870,  risk: 0.55, color: "#FBBF24" },
];

export default function RouteNetworkGraph() {
    const [hubs, setHubs] = useState<any[]>(INITIAL_HUBS);
    const [routes, setRoutes] = useState<any[]>([]);
    const [timestamp, setTimestamp] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false); // No skeleton if we have mocks!
    const [isLive, setIsLive] = useState(false);

    useEffect(() => {
        async function loadGraphData() {
            try {
                const [hubResponse, routeData] = await Promise.all([
                    getHeatmapData(),
                    getLiveFlights()
                ]);
                if (hubResponse.nodes && hubResponse.nodes.length > 0) {
                    // Ensure each node has valid lat/lon; fall back to known coords if missing
                    const nodes = hubResponse.nodes.map((n: any) => {
                        const coords = AIRPORT_COORDS[n.airport];
                        return {
                            ...n,
                            lat: (n.lat && n.lat !== 40.7128) ? n.lat : (coords?.lat ?? n.lat),
                            lon: (n.lon && n.lon !== -74.0060) ? n.lon : (coords?.lon ?? n.lon),
                        };
                    });
                    setHubs(nodes);
                    setTimestamp(hubResponse.timestamp);
                    setRoutes(routeData || []);
                    setIsLive(true);
                }
            } catch (err) {
                console.warn("Network Graph sync failed, using archive.");
                setIsLive(false);
            }
        }
        loadGraphData();
    }, []);

    const metrics = useMemo(() => {
        const atRisk = hubs.filter(h => h.risk > 0.4).length;
        const totalFlow = routes.length;
        const sysHealth = Math.max(0, 100 - (atRisk / (hubs.length || 1) * 100));
        return { atRisk, totalFlow, sysHealth };
    }, [hubs, routes]);

    return (
        <div className="w-full flex relative bg-[var(--bg-card)] h-[calc(100vh-80px)] overflow-hidden">
            
            {/* BG Decoration */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

            {/* Floating Metric Engine Dashboard */}
            <div className="absolute top-10 left-12 z-20 w-80 pointer-events-none">
                <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="pointer-events-auto bg-[var(--ch-brand-900)]/60 backdrop-blur-xl border border-[var(--border-ui)] p-8 space-y-8"
                >
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-2 bg-accent-neon rounded-full animate-pulse" />
                            <h1 className="text-2xl font-heading font-black uppercase text-white tracking-tighter">Route Network</h1>
                        </div>
                        <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-brand-500">Global Node Infrastructure v2.4</p>
                        {timestamp && (
                            <p className="font-mono text-[7px] text-accent-neon uppercase tracking-widest mt-2">
                                AI SYNC: {new Date(timestamp).toLocaleTimeString()}
                            </p>
                        )}
                    </div>

                    <div className="space-y-6 pt-4 border-t border-[var(--border-ui)]">
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="font-mono text-[10px] text-brand-400 uppercase tracking-widest">Network Health</span>
                                <span className="font-mono text-lg text-accent-neon font-black">{metrics.sysHealth.toFixed(1)}%</span>
                            </div>
                            <div className="h-1 w-full bg-brand-800 relative">
                                <motion.div 
                                    className="h-full bg-accent-neon"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${metrics.sysHealth}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[var(--bg-surface)] p-4 border border-white/5">
                                <div className="font-mono text-[8px] text-brand-500 uppercase mb-1">Active Arcs</div>
                                <div className="text-xl font-heading font-black text-white">{metrics.totalFlow}</div>
                            </div>
                            <div className="bg-[var(--bg-surface)] p-4 border border-white/5">
                                <div className="font-mono text-[8px] text-brand-500 uppercase mb-1">Risk Nodes</div>
                                <div className="text-xl font-heading font-black text-accent-alert">{metrics.atRisk}</div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="font-mono text-[9px] text-brand-600 uppercase tracking-widest border-b border-white/5 pb-2">Operational Alerts</div>
                        {hubs.filter(h => h.risk > 0.6).slice(0, 3).map((h, i) => (
                            <div key={i} className="flex items-center gap-3 bg-accent-alert/5 border-l-2 border-accent-alert p-3">
                                <AlertCircle className="w-3 h-3 text-accent-alert" />
                                <div className="font-mono text-[9px] text-white uppercase tracking-wider">
                                    {h.airport}: CRITICAL DELAY THREAT
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Secondary Data Strip */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-4 pointer-events-auto bg-[var(--ch-brand-900)]/60 backdrop-blur-md border border-[var(--border-ui)] p-5 flex items-center gap-6"
                >
                    <BarChart3 className="w-5 h-5 text-brand-400" />
                    <div>
                        <p className="font-mono text-[8px] text-brand-600 uppercase mb-0.5">Packet Loss</p>
                        <p className="font-mono text-[10px] text-brand-200 uppercase">0.0004%</p>
                    </div>
                    <div className="h-4 w-px bg-white/10" />
                    <div>
                        <p className="font-mono text-[8px] text-brand-600 uppercase mb-0.5">Entropy</p>
                        <p className="font-mono text-[10px] text-brand-200 uppercase">Normalized</p>
                    </div>
                </motion.div>
            </div>

            {/* Ops Center Legend (Right) */}
            <div className="absolute bottom-8 right-8 z-20 space-y-3">
                {[
                    { label: "Optimal Stream", color: "bg-accent-neon" },
                    { label: "At-Risk Vector", color: "bg-yellow-400" },
                    { label: "Congestion Block", color: "bg-accent-alert" }
                ].map((item, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + (i * 0.1) }}
                        className="flex items-center gap-3 bg-[var(--ch-brand-900)]/40 px-4 py-2 border border-white/5 backdrop-blur-sm"
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${item.color} shadow-[0_0_8px_rgba(255,255,255,0.2)]`} />
                        <span className="font-mono text-[9px] uppercase tracking-widest text-brand-400">{item.label}</span>
                    </motion.div>
                ))}
            </div>

            {/* 3D Visual Layer */}
            <div className="flex-1 relative cursor-crosshair">
                <Canvas camera={{ position: [0, 0, 5], fov: 40 }} dpr={[1, 2]}>
                    <color attach="background" args={['#07080a']} />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    
                    {!isLoading && (
                        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
                            <GlobalNetwork hubs={hubs} routes={routes} />
                        </Float>
                    )}

                    <OrbitControls 
                        enableZoom={true} 
                        enablePan={false} 
                        autoRotate={false}
                        minDistance={3}
                        maxDistance={8}
                    />
                </Canvas>

                {/* Corner Telemetry Decor */}
                <div className="absolute top-8 right-8 font-mono text-[9px] text-brand-700 pointer-events-none hidden lg:block uppercase tracking-[0.5em] [writing-mode:vertical-lr]">
                    SKYLYTICS // NET_VISUAL_SYSTEM // {new Date().getFullYear()}
                </div>
            </div>

            {/* Loading Mask */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div 
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-[var(--bg-card)] flex flex-col items-center justify-center gap-6"
                    >
                        <GlobeIcon className="w-12 h-12 text-accent-neon animate-spin" />
                        <div className="flex flex-col items-center gap-2">
                            <span className="font-mono text-xs uppercase tracking-[0.4em] text-white animate-pulse">Initializing Route Matrix</span>
                            <span className="font-mono text-[8px] uppercase tracking-widest text-brand-600">Mapping 40 Global Hubs + Active Flight Vectors</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
