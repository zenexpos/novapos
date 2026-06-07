'use client';

import React, {
    createContext, useContext, useState,
    useCallback, useMemo, useEffect,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Notification } from '@/lib/types';

interface NotificationContextValue {
    notifications: Notification[];
    unreadCount:   number;
    addNotification:   (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
    markAllRead:       () => void;
    markRead:          (id: string) => void;
    remove:            (id: string) => void;
    clearAll:          () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback(
        (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
            setNotifications(prev => [
                { ...n, id: uuidv4(), createdAt: new Date(), read: false },
                ...prev.slice(0, 49), // Max 50 notifications
            ]);
        },
        [],
    );

    const markRead = useCallback((id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    }, []);

    const markAllRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const remove = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const clearAll = useCallback(() => setNotifications([]), []);

    const unreadCount = useMemo(
        () => notifications.filter(n => !n.read).length,
        [notifications],
    );

    const value = useMemo(
        () => ({ notifications, unreadCount, addNotification, markAllRead, markRead, remove, clearAll }),
        [notifications, unreadCount, addNotification, markAllRead, markRead, remove, clearAll],
    );

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
    return ctx;
}
