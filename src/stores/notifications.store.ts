'use client';

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    read: boolean;
    createdAt: Date;
}

interface NotificationState {
    notifications: AppNotification[];
    unreadCount: number;
    addNotification: (type: NotificationType, title: string, message?: string) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    unreadCount: 0,

    addNotification: (type, title, message) => set((state) => {
        const newNotif: AppNotification = {
            id: uuidv4(),
            type,
            title,
            message,
            read: false,
            createdAt: new Date(),
        };
        const updated = [newNotif, ...state.notifications].slice(0, 50); // Keep last 50
        return {
            notifications: updated,
            unreadCount: updated.filter(n => !n.read).length
        };
    }),

    markAsRead: (id) => set((state) => {
        const updated = state.notifications.map(n => n.id === id ? { ...n, read: true } : n);
        return {
            notifications: updated,
            unreadCount: updated.filter(n => !n.read).length
        };
    }),

    markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
    })),

    clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));