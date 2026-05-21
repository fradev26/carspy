import { cn } from "@/lib/utils";
import React from "react";

interface SkeletonCardProps {
  variant?: "default" | "horizontal";
  className?: string;
  style?: React.CSSProperties;
}

export function SkeletonCard({ variant = "default", className, style }: SkeletonCardProps) {
  if (variant === "horizontal") {
    return (
      <div className={cn("flex gap-4 rounded-lg border bg-card p-4", className)} style={style}>
        {/* Image skeleton */}
        <div className="relative h-32 w-48 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%]" />
        </div>
        
        {/* Content skeleton */}
        <div className="flex flex-1 flex-col justify-between py-1">
          <div className="space-y-3">
            <div className="h-5 w-3/4 rounded bg-muted animate-pulse-soft" />
            <div className="h-6 w-24 rounded bg-muted animate-pulse-soft" />
            <div className="flex gap-4">
              <div className="h-4 w-16 rounded bg-muted animate-pulse-soft" />
              <div className="h-4 w-20 rounded bg-muted animate-pulse-soft" />
              <div className="h-4 w-14 rounded bg-muted animate-pulse-soft" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 rounded bg-muted animate-pulse-soft" />
            <div className="h-5 w-16 rounded bg-muted animate-pulse-soft" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border bg-card", className)} style={style}>
      {/* Image skeleton */}
      <div className="relative aspect-[16/10] bg-muted">
        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%]" />
      </div>
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <div className="h-5 w-4/5 rounded bg-muted animate-pulse-soft" />
        <div className="h-6 w-28 rounded bg-muted animate-pulse-soft" />
        <div className="flex gap-3">
          <div className="h-4 w-12 rounded bg-muted animate-pulse-soft" />
          <div className="h-4 w-16 rounded bg-muted animate-pulse-soft" />
          <div className="h-4 w-14 rounded bg-muted animate-pulse-soft" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="h-4 w-20 rounded bg-muted animate-pulse-soft" />
          <div className="h-5 w-14 rounded bg-muted animate-pulse-soft" />
        </div>
      </div>
    </div>
  );
}
