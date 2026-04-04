"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SwipeRevealAction = {
  label: string;
  className?: string;
  onClick: () => void;
};

const ACTION_SLOT_PX = 88;

export function SwipeRevealRow({
  children,
  actions,
  className,
  contentClassName,
}: {
  children: ReactNode;
  actions: SwipeRevealAction[];
  className?: string;
  /** Applied to the sliding foreground (e.g. card background) */
  contentClassName?: string;
}) {
  const revealW = actions.length * ACTION_SLOT_PX;
  const [dx, setDx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const gestureActive = useRef(false);
  const startX = useRef(0);
  const startDx = useRef(0);

  const clamp = useCallback(
    (v: number) => Math.max(-revealW, Math.min(0, v)),
    [revealW],
  );

  const snap = useCallback(
    (v: number) => (v < -revealW / 2 ? -revealW : 0),
    [revealW],
  );

  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      <div
        className="absolute inset-y-0 right-0 z-0 flex"
        style={{ width: revealW }}
        aria-hidden
      >
        {actions.map((a, i) => (
          <button
            key={i}
            type="button"
            className={cn(
              "flex flex-1 min-w-[88px] items-center justify-center px-2 text-xs font-semibold text-white active:opacity-90",
              a.className,
            )}
            onClick={() => {
              setDx(0);
              a.onClick();
            }}
          >
            {a.label}
          </button>
        ))}
      </div>
      <div
        className={cn(
          "relative z-10 shadow-[2px_0_8px_rgba(0,0,0,0.04)]",
          contentClassName,
        )}
        style={{
          transform: `translateX(${dx}px)`,
          transition: isDragging ? "none" : "transform 0.2s ease-out",
        }}
        onTouchStart={(e) => {
          gestureActive.current = true;
          setIsDragging(true);
          startX.current = e.touches[0]!.clientX;
          startDx.current = dx;
        }}
        onTouchMove={(e) => {
          if (!gestureActive.current) return;
          const x = e.touches[0]!.clientX;
          const delta = x - startX.current;
          setDx(clamp(startDx.current + delta));
        }}
        onTouchEnd={() => {
          gestureActive.current = false;
          setIsDragging(false);
          setDx((d) => snap(d));
        }}
        onTouchCancel={() => {
          gestureActive.current = false;
          setIsDragging(false);
          setDx((d) => snap(d));
        }}
      >
        {children}
      </div>
    </div>
  );
}
