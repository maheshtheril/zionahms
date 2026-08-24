import { EventEmitter } from 'events';

export type NotificationType =
    | 'CRITICAL_LAB_RESULT'
    | 'NURSE_CALL_ALERT'
    | 'NEW_PATIENT_WAITING'
    | 'STAT_MEDICATION_ORDER'
    | 'GENERAL';

export interface RealtimeNotification {
    id: string;
    tenantId: string;
    companyId: string;
    targetRole?: string; // 'doctor' | 'nurse' | 'pharmacist' | 'lab' | 'reception'
    targetUserId?: string;
    type: NotificationType;
    title: string;
    message: string;
    patientName?: string;
    patientId?: string;
    referenceUrl?: string;
    severity: 'info' | 'warning' | 'critical';
    createdAt: string;
}

class NotificationBus extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(200); // Support high concurrent connections
    }

    emitNotification(notification: Omit<RealtimeNotification, 'id' | 'createdAt'>) {
        const fullNotification: RealtimeNotification = {
            ...notification,
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            createdAt: new Date().toISOString()
        };

        // Channel key by tenant & company
        const channelKey = `tenant:${notification.tenantId}:company:${notification.companyId}`;
        this.emit(channelKey, fullNotification);
    }
}

// Global singleton instance across Next.js reloads
const globalForNotifications = global as unknown as { notificationBus?: NotificationBus };

export const notificationBus = globalForNotifications.notificationBus || new NotificationBus();

if (process.env.NODE_ENV !== 'production') globalForNotifications.notificationBus = notificationBus;
