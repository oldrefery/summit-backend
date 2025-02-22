import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../../types/database'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const TEST_USER_EMAIL = process.env.INTEGRATION_SUPABASE_USER_EMAIL!
const TEST_USER_PASSWORD = process.env.INTEGRATION_SUPABASE_USER_PASSWORD!

/**
 * Setup test clients - both authenticated and anonymous
 */
export async function setupTestClient() {
    // Create anonymous client
    const anonClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Create authenticated client
    const authClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)

    const { error } = await authClient.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
    })

    if (error) {
        throw new Error(`Failed to authenticate test user: ${error.message}`)
    }

    return { authClient, anonClient }
}

/**
 * Clean up test data from all tables
 */
export async function cleanupTestData(client: ReturnType<typeof createClient<Database>>) {
    const tables = [
        'announcements',
        'app_user_settings',
        'debug_logs',
        'deletions_log',
        'event_people',
        'events',
        'json_versions',
        'locations',
        'markdown_pages',
        'notification_history',
        'people',
        'resources',
        'sections',
        'social_feed_posts'
    ]

    for (const table of tables) {
        await client
            .from(table)
            .delete()
            .neq('id', 0)
    }
}

/**
 * Generate a unique test name to avoid conflicts
 */
export function generateTestName(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`
}

/**
 * Wait for a specified time
 */
export function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Wait for a specified time
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Verify that we are using test database
 */
export function verifyTestDatabase() {
    if (!SUPABASE_URL.includes('test')) {
        throw new Error('Tests must be run against test database only!')
    }
} 