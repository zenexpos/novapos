'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    startIcon?: React.ReactNode;
    endIcon?:   React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, startIcon, endIcon, ...props }, ref) => {
        const baseClass = cn(
            'flex h-11 w-full rounded-xl border border-border',
            'bg-muted',
            'px-4 py-2 text-sm font-medium',
            'ring-offset-background',
            'placeholder:text-muted-foreground/40',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-0',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-200',
            startIcon && 'pl-11',
            endIcon   && 'pr-11',
            className,
        );

        if (startIcon || endIcon) {
            return (
                <div className="relative flex items-center w-full group">
                    {startIcon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/30 group-focus-within:text-primary transition-colors">
                            {startIcon}
                        </div>
                    )}
                    <input type={type} className={baseClass} ref={ref} {...props} />
                    {endIcon && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors">
                            {endIcon}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <input
                type={type}
                className={baseClass}
                ref={ref}
                {...props}
            />
        );
    },
);
Input.displayName = 'Input';

export { Input };