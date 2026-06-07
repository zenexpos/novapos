'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { DatePreset } from '@/lib/types';
import { DATE_PRESETS } from '@/lib/constants';

interface DateRangePickerProps {
    date:      DateRange | undefined;
    setDate:   (date: DateRange | undefined) => void;
    setPreset?: (preset: DatePreset) => void;
    activePreset?: DatePreset | null;
    className?: string;
}

export function DateRangePicker({
    date, setDate, setPreset, activePreset, className,
}: DateRangePickerProps) {
    const [open, setOpen] = React.useState(false);

    const label = React.useMemo(() => {
        if (!date?.from) return 'Choisissez une plage';
        if (!date.to)    return format(date.from, 'd MMM yyyy', { locale: fr });
        return `${format(date.from, 'd MMM', { locale: fr })} — ${format(date.to, 'd MMM yyyy', { locale: fr })}`;
    }, [date]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        'w-full justify-start text-left font-normal h-10 rounded-xl sm:w-[280px]',
                        'border-[var(--glass-border)] bg-[var(--glass-bg)]',
                        !date && 'text-muted-foreground/50',
                        className,
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary/60 shrink-0" />
                    <span className="flex-1 truncate text-sm">{label}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 glass-elevated" align="end">
                {/* Preset buttons */}
                {setPreset && (
                    <div className="flex flex-wrap gap-1.5 p-3 border-b border-[var(--glass-border)]">
                        {DATE_PRESETS.map(preset => (
                            <button
                                key={preset.label}
                                onClick={() => { setPreset(preset); setOpen(false); }}
                                className={cn(
                                    'px-2.5 py-1 rounded-lg text-xs font-semibold tracking-tight transition-all',
                                    activePreset?.label === preset.label
                                        ? 'bg-primary/15 text-primary border border-primary/25'
                                        : 'text-muted-foreground/60 hover:bg-muted/40 border border-transparent',
                                )}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                )}
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                    locale={fr}
                />
            </PopoverContent>
        </Popover>
    );
}
