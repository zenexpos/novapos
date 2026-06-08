'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DatePickerProps {
    date:      Date | undefined;
    setDate:   (date: Date | undefined) => void;
    placeholder?: string;
    className?:   string;
    clearable?:   boolean;
    disabled?:    boolean;
}

export function DatePicker({
    date, setDate,
    placeholder = 'Choisissez une date',
    className, clearable = true, disabled,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        'w-full justify-start text-left font-normal h-10 rounded-xl',
                        'border-border bg-card',
                        !date && 'text-muted-foreground',
                        className,
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary shrink-0" />
                    <span className="flex-1 truncate">
                        {date ? format(date, 'd MMMM yyyy', { locale: fr }) : placeholder}
                    </span>
                    {clearable && date && (
                        <div
                            role="button"
                            aria-label="Effacer la date"
                            className="ml-2 rounded-md p-0.5 hover:bg-muted transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                setDate(undefined);
                            }}
                        >
                            <X className="h-3 w-3 text-muted-foreground" />
                        </div>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-border bg-card shadow-xl" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => { setDate(d); setOpen(false); }}
                    locale={fr}
                />
            </PopoverContent>
        </Popover>
    );
}
