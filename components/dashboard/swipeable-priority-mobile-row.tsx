"use client";

import { useCallback, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD_PX = 72;

interface SwipeablePriorityMobileRowProps {
  children: ReactNode;
  /** Même logique que le bouton « Terminer » (pas pour « Bloquer »). */
  swipeToCompleteEnabled: boolean;
  onSwipeComplete: () => void;
  className?: string;
}

/**
 * Glisser vers la droite pour marquer la tâche comme terminée (mobile).
 */
export function SwipeablePriorityMobileRow({
  children,
  swipeToCompleteEnabled,
  onSwipeComplete,
  className,
}: SwipeablePriorityMobileRowProps) {
  const startX = useRef(0);
  const startY = useRef(0);
  const suppressClick = useRef(false);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!swipeToCompleteEnabled) return;
      const t = e.touches[0];
      if (!t) return;
      startX.current = t.clientX;
      startY.current = t.clientY;
    },
    [swipeToCompleteEnabled],
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!swipeToCompleteEnabled) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX.current;
      const dy = t.clientY - startY.current;
      if (dx > SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy) * 1.15) {
        suppressClick.current = true;
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(12);
        }
        onSwipeComplete();
      }
    },
    [swipeToCompleteEnabled, onSwipeComplete],
  );

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (suppressClick.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClick.current = false;
    }
  }, []);

  return (
    <div
      className={cn("touch-pan-y", className)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClickCapture={onClickCapture}
    >
      {children}
    </div>
  );
}
