'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DateRange } from 'react-day-picker';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import type { DatePreset } from '@/lib/types';
import { DATE_PRESETS } from '@/lib/constants';

/**
 * useDateRange v2 — Gestion des plages temporelles.
 * Améliorations v2:
 * - presets intégrés (7j, 30j, 90j, année)
 * - setPreset(preset) pour sélection rapide
 * - activePreset exposé pour UI highlighting
 */
export function useDateRange(defaultDays: number = 29) {
    const [dateRange, setDateRange]       = useState<DateRange | undefined>();
    const [isMounted, setIsMounted]       = useState(false);
    const [activePreset, setActivePreset] = useState<DatePreset | null>(null);

    useEffect(() => {
        const today = new Date();
        setDateRange({
            from: startOfDay(subDays(today, defaultDays)),
            to:   endOfDay(today),
        });
        // Match initial range to a preset if possible
        const matched = DATE_PRESETS.find(p => p.days === defaultDays);
        if (matched) setActivePreset(matched);
        setIsMounted(true);
    }, [defaultDays]);

    const setDate = useCallback((newRange?: DateRange) => {
        if (!newRange) { setDateRange(undefined); setActivePreset(null); return; }
        setDateRange({
            from: newRange.from ? startOfDay(newRange.from) : undefined,
            to:   newRange.to   ? endOfDay(newRange.to)     : undefined,
        });
        setActivePreset(null);
    }, []);

    const setPreset = useCallback((preset: DatePreset) => {
        const today = new Date();
        setDateRange({
            from: startOfDay(subDays(today, preset.days)),
            to:   endOfDay(today),
        });
        setActivePreset(preset);
    }, []);

    return { dateRange, setDate, setPreset, activePreset, isMounted };
}
