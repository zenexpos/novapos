import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-black uppercase tracking-widest transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    {
        variants: {
            variant: {
                default:     'border-transparent bg-primary text-primary-foreground shadow-sm',
                secondary:   'border-transparent bg-secondary text-secondary-foreground shadow-sm',
                destructive: 'border-transparent bg-destructive text-destructive-foreground shadow-sm',
                outline:     'text-foreground border-border bg-background/50',
                success:     'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400',
                warning:     'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400',
                danger:      'bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-400',
                info:        'bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400',
                violet:      'bg-violet-500/15 text-violet-700 border-violet-500/30 dark:text-violet-400',
                glass:       'bg-[var(--glass-bg)] border-[var(--glass-border)] text-foreground backdrop-blur-sm shadow-sm',
            },
        },
        defaultVariants: { variant: 'default' },
    },
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };