import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    {
        variants: {
            variant: {
                default:     'border-transparent bg-primary text-primary-foreground shadow-sm',
                secondary:   'border-transparent bg-secondary text-secondary-foreground shadow-sm',
                destructive: 'border-transparent bg-destructive text-destructive-foreground shadow-sm',
                outline:     'text-foreground border-border bg-background/50',
                success:     'bg-emerald-500/12 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
                warning:     'bg-amber-500/12 text-amber-600 border-amber-500/20 dark:text-amber-400',
                danger:      'bg-red-500/12 text-red-600 border-red-500/20 dark:text-red-400',
                info:        'bg-blue-500/12 text-blue-600 border-blue-500/20 dark:text-blue-400',
                violet:      'bg-violet-500/12 text-violet-600 border-violet-500/20 dark:text-violet-400',
                glass:       'bg-[var(--glass-bg)] border-[var(--glass-border)] text-foreground backdrop-blur-sm',
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
