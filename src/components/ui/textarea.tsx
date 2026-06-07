'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    /** Afficher le compteur de caractères */
    showCount?: boolean;
    maxLength?:  number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, showCount, maxLength, value, onChange, ...props }, ref) => {
        const [charCount, setCharCount] = React.useState(
            typeof value === 'string' ? value.length : 0,
        );

        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setCharCount(e.target.value.length);
            onChange?.(e);
        };

        return (
            <div className="relative w-full">
                <textarea
                    className={cn(
                        'flex min-h-[80px] w-full rounded-xl border border-input',
                        'bg-[var(--glass-bg)] backdrop-blur-sm',
                        'px-3 py-2 text-sm',
                        'placeholder:text-muted-foreground/40',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        'resize-y transition-colors duration-150',
                        showCount && 'pb-6',
                        className,
                    )}
                    ref={ref}
                    maxLength={maxLength}
                    value={value}
                    onChange={handleChange}
                    {...props}
                />
                {showCount && maxLength && (
                    <span className={cn(
                        'absolute bottom-2 right-3 text-xs font-bold tabular-nums',
                        charCount >= maxLength * 0.9
                            ? 'text-amber-500'
                            : 'text-muted-foreground/30',
                    )}>
                        {charCount}/{maxLength}
                    </span>
                )}
            </div>
        );
    },
);
Textarea.displayName = 'Textarea';

export { Textarea };
