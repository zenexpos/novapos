'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn('p-3 bg-card border border-border rounded-3xl shadow-xl', className)}
            classNames={{
                months:   'flex flex-col sm:flex-row gap-4',
                month:    'space-y-4',
                month_caption: 'flex justify-center pt-1 relative items-center mb-4',
                caption_label: 'text-sm font-bold uppercase tracking-widest text-secondary',
                nav:      'flex items-center gap-1',
                button_previous: cn(
                    buttonVariants({ variant: 'outline' }),
                    'absolute left-1 h-7 w-7 bg-card p-0 hover:opacity-100'
                ),
                button_next: cn(
                    buttonVariants({ variant: 'outline' }),
                    'absolute right-1 h-7 w-7 bg-card p-0 hover:opacity-100'
                ),
                month_grid: 'w-full border-collapse space-y-1',
                weekdays:   'flex',
                weekday:  'text-muted-foreground rounded-md w-9 font-bold text-[0.8rem] uppercase',
                week:        'flex w-full mt-2',
                day:        'h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20',
                day_button: cn(
                    buttonVariants({ variant: 'ghost' }),
                    'h-9 w-9 p-0 font-bold hover:bg-primary/10 hover:text-primary transition-all'
                ),
                selected:         'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                today:            'bg-secondary/10 text-secondary border border-secondary/20',
                outside:          'text-muted-foreground opacity-30',
                disabled:         'text-muted-foreground opacity-30',
                range_middle:     'aria-selected:bg-accent aria-selected:text-accent-foreground',
                hidden:           'invisible',
                ...classNames,
            }}
            components={{
                Chevron: ({ ...props }) => {
                    if (props.orientation === 'left') return <ChevronLeft className="h-4 w-4" />;
                    return <ChevronRight className="h-4 w-4" />;
                }
            }}
            {...props}
        />
    );
}

Calendar.displayName = 'Calendar';

export { Calendar };