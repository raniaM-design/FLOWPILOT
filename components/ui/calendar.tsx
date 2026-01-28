import * as React from "react";
import { cn } from "@/lib/utils";

export interface CalendarProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Calendar = React.forwardRef<HTMLInputElement, CalendarProps>(
  ({ className, type = "date", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md bg-section-bg/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:bg-section-bg disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Calendar.displayName = "Calendar";

export { Calendar };

