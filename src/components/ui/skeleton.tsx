import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'text' | 'circular' | 'card';
    lines?:   number;
}

function Skeleton({ className, variant = 'default', lines, ...props }: SkeletonProps) {
    if (variant === 'text' && lines) {
        return (
            <div className="space-y-2">
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            'h-3 rounded-lg bg-muted/60 animate-pulse',
                            i === lines - 1 && 'w-2/3',
                            className,
                        )}
                    />
                ))}
            </div>
        );
    }

    if (variant === 'circular') {
        return (
            <div
                className={cn('rounded-full bg-muted/60 animate-pulse shimmer', className)}
                {...props}
            />
        );
    }

    return (
        <div
            className={cn(
                'rounded-xl bg-muted/60 animate-pulse shimmer',
                className,
            )}
            {...props}
        />
    );
}

export { Skeleton };
