// src/types/push.ts

interface DeviceInfo {
  osName: string; // 'iOS' | 'Android'
  osVersion: string; // '15.0', '13.0', etc.
  deviceName: string; // 'iPhone 13', 'Pixel 6', etc.
  deviceModel: string; // Specific model identifier
  appVersion: string; // Version of the mobile app
  buildNumber: string; // Build number of the mobile app
}

export interface NotificationData extends Record<string, unknown> {
  screen?: string;
  entityId?: string;
  entityType?: 'event' | 'person' | 'location';
  action?: 'open' | 'update' | 'delete';
  deepLink?: string;
  extra?: Record<string, string | number | boolean>;
}

export interface AppUser {
  id: string;
  created_at: string;
  last_active_at: string;
  device_id: string;
  device_info: DeviceInfo;
}

export interface PushToken {
  id: number;
  user_id: string;
  token: string;
  created_at: string;
  last_used_at: string;
  is_active: boolean;
}

export interface NotificationHistory {
  id: number;
  title: string;
  body: string;
  data: NotificationData;
  sent_at: string;
  sent_by: string;
  target_type: 'all' | 'specific_users';
  target_users: string[];
  success_count: number;
  failure_count: number;
}

export interface NotificationFormData {
  title: string;
  body: string;
  target_type: 'all' | 'specific_users';
  target_users?: string[];
  data: NotificationData;
}

export interface PushStatistics {
  total_users: number;
  active_users: number;
  total_tokens: number;
  active_tokens: number;
}

export interface ApiSuccessResponse<T> {
  data: T;
  error: null;
}

export interface ApiErrorResponse {
  data: null;
  error: {
    message: string;
    code?: string;
    details?: string;
  };
}

export interface PushStatistics {
  total_users: number;
  active_users: number;
  total_tokens: number;
  active_tokens: number;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
