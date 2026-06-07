'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

interface ProgressProps
    extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
    /** Couleur de la barre en fonction de la valeur */
    colorScale?: boolean;
    /** Afficher le % en overlay */
    showLabel?:  boolean;
}

const Progress = React.forwardRef<
    React.ElementRef<typeof ProgressPrimitive.Root>,
    ProgressProps
>(({ className, value, colorScale, showLabel, ...props }, ref) => {
    const pct = Math.min(100, Math.max(0, value ?? 0));

    const barColor = colorScale
        ? pct >= 80 ? 'bg-red-500'
        : pct >= 60 ? 'bg-amber-500'
        : 'bg-primary'
        : 'bg-primary';

    return (
        <ProgressPrimitive.Root
            ref={ref}
            className={cn(
                'relative h-2 w-full overflow-hidden rounded-full bg-muted/40',
                className,
            )}
            {...props}
        >
            <ProgressPrimitive.Indicator
                className={cn(
                    'h-full rounded-full transition-all duration-700 ease-out',
                    barColor,
                )}
                style={{ width: `${pct}%` }}
            />
            {showLabel && (
                <span className="absolute right-0 top-0 text-[8px] font-black text-muted-foreground/50 -mt-4">
                    {pct.toFixed(0)}%
                </span>
            )}
        </ProgressPrimitive.Root>
    );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
