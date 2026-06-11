'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Notification } from '@/lib/types';

interface NotificationContextValue {
    notifications: Notification[];
    unreadCount:   number;
    addNotification: (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
    markRead: (id: string) => void;
    clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback((n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
        setNotifications(prev => [
            { ...n, id: uuidv4(), createdAt: new Date(), read: false },
            ...prev.slice(0, 49),
        ]);
    }, []);

    const markRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const clearAll = useCallback(() => setNotifications([]), []);

    const value = useMemo(() => ({
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
        addNotification,
        markRead,
        clearAll
    }), [notifications, addNotification, markRead, clearAll]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotifications = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
    return ctx;
};
