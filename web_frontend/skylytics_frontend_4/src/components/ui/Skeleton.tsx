"use client";
import React from "react";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-white/5 rounded-sm ${className}`}
    />
  );
}

export function SkeletonMetric() {
  return (
    <div className="p-6 border-b md:border-b-0 md:border-r border-[var(--border-ui)] last:border-0 space-y-4">
      <Skeleton className="h-2 w-16" />
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-3 w-12" />
    </div>
  );
}

export function SkeletonChart() {
    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border-ui)] p-8 h-[400px] flex flex-col space-y-6">
            <div className="flex justify-between items-start border-b border-[var(--border-ui)] pb-4">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex-1 flex items-end gap-2 pb-4">
                {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} className="flex-1" style={{ height: `${Math.random() * 60 + 20}%` }} />
                ))}
            </div>
        </div>
    );
}
