'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    /** Icône placée à gauche dans l'input */
    startIcon?: React.ReactNode;
    /** Icône ou bouton placé à droite dans l'input */
    endIcon?:   React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, startIcon, endIcon, ...props }, ref) => {
        if (startIcon || endIcon) {
            return (
                <div className="relative flex items-center w-full">
                    {startIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/50">
                            {startIcon}
                        </div>
                    )}
                    <input
                        type={type}
                        className={cn(
                            'flex h-10 w-full rounded-xl border border-input',
                            'bg-[var(--glass-bg)] backdrop-blur-sm',
                            'px-3 py-2 text-sm',
                            'ring-offset-background',
                            'placeholder:text-muted-foreground/40',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                            'disabled:cursor-not-allowed disabled:opacity-50',
                            'transition-colors duration-150',
                            'focus-within-glass',
                            startIcon && 'pl-9',
                            endIcon   && 'pr-9',
                            className,
                        )}
                        ref={ref}
                        {...props}
                    />
                    {endIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                            {endIcon}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <input
                type={type}
                className={cn(
                    'flex h-10 w-full rounded-xl border border-input',
                    'bg-[var(--glass-bg)] backdrop-blur-sm',
                    'px-3 py-2 text-sm',
                    'ring-offset-background',
                    'placeholder:text-muted-foreground/40',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'transition-colors duration-150',
                    className,
                )}
                ref={ref}
                {...props}
            />
        );
    },
);
Input.displayName = 'Input';

export { Input };
