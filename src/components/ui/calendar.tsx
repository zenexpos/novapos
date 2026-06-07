'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * Calendar — react-day-picker v9
 *
 * Breaking changes v8 → v9:
 * - classNames keys renamed: caption_label → caption-label (kebab-case)
 * - nav_button → nav-button, nav_button_previous → nav-button-previous, etc.
 * - IconLeft/IconRight components → Chevron component with orientation prop
 * - day_selected → day-selected (kebab-case)
 * - day_today → day-today, day_outside → day-outside, etc.
 */
function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn('p-3', className)}
            classNames={{
                months:   'flex flex-col sm:flex-row gap-4',
                month:    'space-y-4',
                caption: 'flex justify-center pt-1 relative items-center',
                caption_label: 'text-sm font-semibold',
                nav:      'flex items-center gap-1',
                nav_button_previous: cn(
                    buttonVariants({ variant: 'outline' }),
                    'absolute left-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                ),
                nav_button_next: cn(
                    buttonVariants({ variant: 'outline' }),
                    'absolute right-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                ),
                table: 'w-full border-collapse space-y-1',
                head_row:   'flex',
                head_cell:  'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
                row:        'flex w-full mt-2',
                day:        'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                button: cn(
                    buttonVariants({ variant: 'ghost' }),
                    'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
                ),
                day_selected:         'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                day_today:            'bg-accent text-accent-foreground',
                day_outside:          'text-muted-foreground opacity-50',
                day_disabled:         'text-muted-foreground opacity-50',
                day_range_middle:     'aria-selected:bg-accent aria-selected:text-accent-foreground',
                day_hidden:           'invisible',
                day_range_start:      'day-range-start',
                day_range_end:        'day-range-end',
                ...classNames,
            }}
            components={{
                IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                IconRight: () => <ChevronRight className="h-4 w-4" />,
            }}
            {...props}
        />
    );
}

Calendar.displayName = 'Calendar';

export { Calendar };
