// src/lib/supabase-server.ts
// Server version of supabase.ts without using toasts

import { createClient } from '@supabase/supabase-js';
import type {
    NotificationFormData,
} from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonEmail = process.env.SUPABASE_ANON_EMAIL!;
const supabaseAnonPassword = process.env.SUPABASE_ANON_PASSWORD!;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are not set!');
}

// client with auto refresh of the session
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
    },
});

// Service client with elevated privileges to bypass RLS
export const supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
        },
    })
    : supabase; // Fallback to regular client if service key is not set

export async function ensureAuthenticated() {
    const email = supabaseAnonEmail;
    const password = supabaseAnonPassword;

    if (!email || !password) {
        throw new Error('Supabase auth credentials are not set!');
    }

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        // If there is no session, perform anonymous authentication
        await supabase.auth.signInWithPassword({
            email,
            password,
        });
    }
}

// Unused function - commented for future use
// function getPublicFileUrl(bucketName: string, fileName: string) {
//    return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${fileName}`;
// }

// Unused function - commented for future use
// function logError(message: string) {
//    console.error(`[Server Error]: ${message}`);
// }

// Server function to save notification history
export async function saveNotificationHistoryDirectly(
    notification: NotificationFormData,
    successCount: number,
    failureCount: number,
    sentBy: string = 'system'
) {
    try {
        // Using RPC call to bypass RLS
        const { error } = await supabase.rpc('insert_notification_history', {
            p_title: notification.title,
            p_body: notification.body,
            p_data: notification.data || {},
            p_sent_at: new Date().toISOString(),
            p_sent_by: sentBy,
            p_target_type: notification.target_type,
            p_target_users: notification.target_users || [],
            p_success_count: successCount,
            p_failure_count: failureCount
        });

        if (error) {
            console.error('Error in saveNotificationHistoryDirectly (RPC):', error);

            // If RPC failed, try direct insertion
            const { error: insertError } = await supabase
                .from('notification_history')
                .insert({
                    title: notification.title,
                    body: notification.body,
                    data: notification.data || {},
                    sent_at: new Date().toISOString(),
                    sent_by: sentBy,
                    target_type: notification.target_type,
                    target_users: notification.target_users || [],
                    success_count: successCount,
                    failure_count: failureCount
                });

            if (insertError) {
                console.error('Error in saveNotificationHistoryDirectly (direct insert):', insertError);
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error('Exception in saveNotificationHistoryDirectly:', error);
        return false;
    }
} 