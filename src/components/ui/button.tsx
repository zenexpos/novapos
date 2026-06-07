'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                default:     'border border-transparent bg-primary text-primary-foreground shadow-[0_0_16px_var(--glow-primary)] hover:bg-primary/90 hover:shadow-[0_0_24px_var(--glow-primary)] active:scale-[0.98]',
                destructive: 'border border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:scale-[0.98]',
                outline:     'border border-input bg-[var(--glass-bg)] backdrop-blur-sm hover:bg-accent hover:text-accent-foreground',
                secondary:   'border border-border bg-muted/80 text-foreground hover:bg-muted/70 shadow-sm',
                ghost:       'hover:bg-primary/8 hover:text-primary transition-colors',
                link:        'text-primary underline-offset-4 hover:underline',
                glass:       'bg-[var(--glass-bg)] border border-[var(--glass-border)] backdrop-blur-sm text-foreground hover:border-primary/30 hover:bg-primary/5',
                'glass-primary': 'glass-btn-primary text-white font-black',
                success:     'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 hover:bg-emerald-500/25',
                warning:     'bg-amber-500/15 text-amber-500 border border-amber-500/25 hover:bg-amber-500/25',
                danger:      'bg-red-500/15 text-red-500 border border-red-500/25 hover:bg-red-500/25',
            },
            size: {
                default: 'h-11 px-5',
                sm:      'h-9 rounded-lg px-4 text-sm',
                lg:      'h-12 rounded-xl px-8',
                xl:      'h-13 rounded-2xl px-10 text-base font-black',
                icon:    'h-10 w-10',
                'icon-sm': 'h-8 w-8 rounded-lg',
                'icon-lg': 'h-11 w-11 rounded-xl',
            },
        },
        defaultVariants: { variant: 'default', size: 'default' },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
