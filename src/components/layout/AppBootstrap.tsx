'use client';
import React from 'react';
/**
 * @fileOverview Composant déprécié. La logique de démarrage a été migrée vers AppSyncManager 
 * pour une meilleure résilience et une gestion granulaire des services.
 */
export const AppBootstrap = ({ children }: { children: React.ReactNode }) => <>{children}</>;
