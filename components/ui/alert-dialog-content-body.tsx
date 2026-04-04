"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "@/lib/utils";
import { Z_INDEX_CLASSES } from "@/lib/z-index";

type Props = React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>;

export const AlertDialogContentBody = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  Props
>(({ className, children, ...props }, forwardedRef) => {
  const mergedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [forwardedRef],
  );

  const [isMobile, setIsMobile] = React.useState(false);
  const [heightVh, setHeightVh] = React.useState(60);
  const dragRef = React.useRef<{ startY: number; startH: number } | null>(null);

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const onHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    e.preventDefault();
    dragRef.current = { startY: e.clientY, startH: heightVh };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobile || !dragRef.current) return;
    const { startY, startH } = dragRef.current;
    const dy = e.clientY - startY;
    const deltaVh = (-dy / window.innerHeight) * 100;
    const nh = Math.round(Math.min(95, Math.max(40, startH + deltaVh)));
    setHeightVh(nh);
  };

  const onHandlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  return (
    <AlertDialogPrimitive.Content
      ref={mergedRef}
      style={
        isMobile
          ? ({
              height: `${heightVh}vh`,
              maxHeight: "95vh",
            } as React.CSSProperties)
          : undefined
      }
      className={cn(
        `fixed ${Z_INDEX_CLASSES.modal} z-50 w-full border bg-background shadow-lg duration-200 touch-manipulation overscroll-y-contain`,
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "md:grid md:gap-4 md:left-[50%] md:top-[50%] md:max-w-lg md:translate-x-[-50%] md:translate-y-[-50%] md:p-6",
        "md:data-[state=closed]:zoom-out-95 md:data-[state=open]:zoom-in-95 md:data-[state=closed]:slide-out-to-left-1/2 md:data-[state=closed]:slide-out-to-top-[48%] md:data-[state=open]:slide-in-from-left-1/2 md:data-[state=open]:slide-in-from-top-[48%]",
        "md:rounded-lg",
        "max-md:left-0 max-md:right-0 max-md:top-auto max-md:bottom-0 max-md:translate-x-0 max-md:translate-y-0 max-md:max-w-none max-md:rounded-t-2xl max-md:rounded-b-none max-md:p-0 max-md:flex max-md:flex-col",
        "max-md:data-[state=open]:slide-in-from-bottom max-md:data-[state=closed]:slide-out-to-bottom max-md:data-[state=open]:zoom-in-100 max-md:data-[state=closed]:zoom-out-100",
        className,
      )}
      {...props}
    >
      <div
        className="md:hidden flex flex-col items-center pt-3 pb-2 shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerUp}
        onPointerCancel={onHandlePointerUp}
      >
        <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" aria-hidden />
      </div>

      <div className="max-md:flex-1 max-md:min-h-0 max-md:overflow-y-auto max-md:overscroll-y-contain max-md:px-6 max-md:pb-6 max-md:pt-2 md:contents">
        {children}
      </div>
    </AlertDialogPrimitive.Content>
  );
});
AlertDialogContentBody.displayName = "AlertDialogContentBody";
