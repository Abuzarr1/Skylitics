
"use client";
import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Text, Float, QuadraticBezierLine } from "@react-three/drei";
import * as THREE from "three";

interface Hub {
    id: string;
    lat: number;
    lng: number;
    size: number;
    color: string;
    label: string;
}

interface RouteArc {
    start: [number, number];
    end: [number, number];
    intensity: number;
    thickness: number;
    color: string;
}

interface Props {
    hubs: Hub[];
    routes: RouteArc[];
}

const RADIUS = 100;

function latLngToVector3(lat: number, lng: number, radius: number) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

const HubNode = ({ hub }: { hub: Hub }) => {
    const pos = useMemo(() => latLngToVector3(hub.lat, hub.lng, RADIUS), [hub.lat, hub.lng]);
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.1);
        }
    });

    return (
        <group position={pos}>
            <mesh ref={meshRef}>
                <sphereGeometry args={[hub.size || 1, 16, 16]} />
                <meshBasicMaterial color={hub.color} />
            </mesh>
            <mesh>
                <sphereGeometry args={[(hub.size || 1) * 2, 16, 16]} />
                <meshBasicMaterial color={hub.color} transparent opacity={0.2} />
            </mesh>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <Text
                    position={[0, (hub.size || 1) * 2.5, 0]}
                    fontSize={1.5}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                >
                    {hub.id}
                </Text>
            </Float>
        </group>
    );
};

const ConnectionArc = ({ route }: { route: RouteArc }) => {
    const start = useMemo(() => latLngToVector3(route.start[0], route.start[1], RADIUS), [route.start]);
    const end = useMemo(() => latLngToVector3(route.end[0], route.end[1], RADIUS), [route.end]);
    
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const distance = start.distanceTo(end);
    mid.normalize().multiplyScalar(RADIUS + distance * 0.2);

    return (
        <QuadraticBezierLine
            start={start}
            end={end}
            mid={mid}
            color={route.color}
            lineWidth={route.thickness || 1}
            transparent
            opacity={route.intensity || 0.5}
        />
    );
};

export default function RouteNetworkGraph({ hubs, routes }: Props) {
    return (
        <div className="w-full h-full bg-[#05070a]">
            <Canvas camera={{ position: [0, 0, 250], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                
                <Stars radius={300} depth={60} count={20000} factor={7} saturation={0} fade speed={1} />
                
                <mesh>
                    <sphereGeometry args={[RADIUS, 64, 64]} />
                    <meshBasicMaterial color="#1a202c" wireframe transparent opacity={0.1} />
                </mesh>

                <group>
                    {hubs.map((hub) => (
                        <HubNode key={hub.id} hub={hub} />
                    ))}
                    {routes.map((route, i) => (
                        <ConnectionArc key={i} route={route} />
                    ))}
                </group>

                <OrbitControls 
                    enablePan={false} 
                    minDistance={150} 
                    maxDistance={400} 
                    autoRotate 
                    autoRotateSpeed={0.5} 
                />
            </Canvas>
        </div>
    );
}
