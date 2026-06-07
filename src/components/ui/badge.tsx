import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-xs font-semibold tracking-tight transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    {
        variants: {
            variant: {
                default:     'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
                secondary:   'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
                destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
                outline:     'text-foreground border-border',
                success:     'bg-emerald-500/12 text-emerald-500 border-emerald-500/25',
                warning:     'bg-amber-500/12 text-amber-500 border-amber-500/25',
                danger:      'bg-red-500/12 text-red-500 border-red-500/25',
                glass:       'bg-[var(--glass-bg)] border-[var(--glass-border)] text-foreground backdrop-blur-sm',
                paid:        'bg-emerald-500/12 text-emerald-500 border-emerald-500/25',
                partial:     'bg-amber-500/12 text-amber-500 border-amber-500/25',
                unpaid:      'bg-red-500/12 text-red-500 border-red-500/25',
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
