export enum ActivityAction {
    VIEWED_LOGS = 'viewed_logs',
    LOGIN = 'login',
    LOGOUT = 'logout',
    VIEWED_DASHBOARD = 'viewed_dashboard',
    VIEWED_SENSORS = 'viewed_sensors',
    OTHER = 'other',
}

export interface UserActivity {
    id: string;
    userId: string;
    action: ActivityAction;
    timestamp: Date;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
}

export interface UserActivityState {
    list: UserActivity[];
    loading: boolean;
    error: string | null;
}