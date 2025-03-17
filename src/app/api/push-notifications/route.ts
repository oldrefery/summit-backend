import { NextRequest, NextResponse } from 'next/server';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { supabase, ensureAuthenticated } from '@/lib/supabase-server';
import type { NotificationFormData } from '@/types/push';

// Create a new Expo SDK client
const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

export async function POST(request: NextRequest) {
    try {
        // Get the notification data from the request
        const notification: NotificationFormData = await request.json();

        // Get push tokens based on target type
        let pushTokens: string[] = [];

        if (notification.target_type === 'all') {
            // Get all active tokens
            const { data } = await supabase
                .from('app_user_settings')
                .select('push_token')
                .not('push_token', 'is', null);

            pushTokens = data?.map(item => item.push_token).filter(Boolean) || [];
        } else if (notification.target_type === 'specific_users' && notification.target_users?.length) {
            // Get tokens for specific users
            const { data } = await supabase
                .from('app_user_settings')
                .select('push_token')
                .in('id', notification.target_users)
                .not('push_token', 'is', null);

            pushTokens = data?.map(item => item.push_token).filter(Boolean) || [];
        }

        if (pushTokens.length === 0) {
            return NextResponse.json(
                { error: 'No valid push tokens found' },
                { status: 400 }
            );
        }

        // Create the messages to send
        const messages: ExpoPushMessage[] = [];

        // Filter out invalid tokens
        for (const pushToken of pushTokens) {
            // Check if the token is a valid Expo push token
            if (!Expo.isExpoPushToken(pushToken)) {
                console.warn(`Push token ${pushToken} is not a valid Expo push token`);
                continue;
            }

            // Construct the message
            messages.push({
                to: pushToken,
                sound: 'default',
                title: notification.title,
                body: notification.body,
                data: notification.data || {},
                priority: 'high',
            });
        }

        // Chunk the messages (Expo accepts a maximum of 100 messages per request)
        const chunks = expo.chunkPushNotifications(messages);
        const tickets: ExpoPushTicket[] = [];

        // Send the chunks
        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('Error sending push notification chunk:', error);
            }
        }

        // Process the tickets
        const receiptIds: string[] = [];
        let successCount = 0;
        let failureCount = 0;

        for (const ticket of tickets) {
            if (ticket.status === 'ok') {
                successCount++;
                // Save the receipt ID for later checking
                if (ticket.id) {
                    receiptIds.push(ticket.id);
                }
            } else {
                failureCount++;
                console.error('Push notification error:', ticket.details);

                // If the device is not registered, we should remove or update the token
                if (ticket.details?.error === 'DeviceNotRegistered') {
                    const index = tickets.indexOf(ticket);
                    if (index >= 0 && index < messages.length) {
                        const token = messages[index].to;
                        await handleInvalidToken(token as string);
                    }
                }
            }
        }

        // Save notification history
        await saveNotificationHistory(notification, successCount, failureCount);

        // Check receipts after a delay (in a real app, this would be done by a cron job or similar)
        if (receiptIds.length > 0) {
            // We can't use setTimeout in API routes, so we'll just log the receipt IDs
            console.log('Receipt IDs to check later:', receiptIds);
        }

        return NextResponse.json({
            successful: successCount,
            failed: failureCount
        });
    } catch (error) {
        console.error('Error sending push notifications:', error);
        return NextResponse.json(
            { error: 'Failed to send push notifications' },
            { status: 500 }
        );
    }
}

/**
 * Handles an invalid token by updating the database
 * @param token The invalid push token
 */
async function handleInvalidToken(token: string) {
    try {
        // Update the user's push token to null
        const { error } = await supabase
            .from('app_user_settings')
            .update({ push_token: null })
            .eq('push_token', token);

        if (error) {
            console.error('Error updating invalid token:', error);
        }
    } catch (error) {
        console.error('Error handling invalid token:', error);
    }
}

/**
 * Saves notification history to the database
 * @param notification The notification that was sent
 * @param successCount Number of successful deliveries
 * @param failureCount Number of failed deliveries
 */
async function saveNotificationHistory(
    notification: NotificationFormData,
    successCount: number,
    failureCount: number
) {
    try {
        // Ensure we're authenticated before inserting
        await ensureAuthenticated();

        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();

        // Прямая вставка после аутентификации
        const { error } = await supabase
            .from('notification_history')
            .insert({
                title: notification.title,
                body: notification.body,
                data: notification.data || {},
                sent_at: new Date().toISOString(),
                sent_by: user?.id || 'system',
                target_type: notification.target_type,
                target_users: notification.target_users || [],
                success_count: successCount,
                failure_count: failureCount
            });

        if (error) {
            console.error('Error saving notification history:', error);
        } else {
            console.log('Notification history saved successfully');
        }
    } catch (error) {
        console.error('Error in saveNotificationHistory:', error);
    }
} 