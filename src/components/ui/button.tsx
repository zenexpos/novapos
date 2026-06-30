'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.96]',
    {
        variants: {
            variant: {
                default:     'border border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
                destructive: 'border border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
                outline:     'border border-input bg-card hover:bg-muted hover:text-accent-foreground',
                secondary:   'border border-transparent bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90',
                ghost:       'hover:bg-muted hover:text-primary',
                link:        'text-primary underline-offset-4 hover:underline',
                accent:      'bg-accent text-accent-foreground hover:bg-accent shadow-sm',
                success:     'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
            },
            size: {
                default: 'h-11 px-5',
                sm:      'h-9 rounded-lg px-4 text-sm',
                lg:      'h-12 rounded-xl px-8',
                xl:      'h-14 rounded-2xl px-10 text-base font-black uppercase tracking-widest',
                icon:    'h-10 w-10',
                'icon-sm': 'h-8 w-8 rounded-lg',
                'icon-lg': 'h-12 w-12 rounded-xl',
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