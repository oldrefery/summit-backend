# Database Schema

## Database Schemas

The database contains the following schemas:

1. `public` - Main schema containing user data and application tables
2. `auth` - Authentication schema (managed by Supabase)
3. `storage` - File storage schema (managed by Supabase)
4. `realtime` - Real-time functionality schema (managed by Supabase)
5. `extensions` - PostgreSQL extensions schema
6. `graphql` and `graphql_public` - GraphQL API schemas
7. `pgsodium` and `pgsodium_masks` - Encryption schemas
8. `vault` - Secrets storage schema
9. `supabase_migrations` - Database migrations schema

## Functions

### Authentication and Access Control
1. `check_app_settings_access()`
   - Returns: boolean
   - Security: SECURITY DEFINER
   - Purpose: Checks access to app settings based on device_id
   - Logs: debug_logs with request headers and device_id
   - Logic: 
     - Always allows authenticated users
     - For anonymous users, checks device_id in app_users table

2. `check_device_id(check_id text)`
   - Returns: boolean
   - Security: SECURITY DEFINER
   - Purpose: Validates device_id existence
   - Logs: debug_logs with headers, JWT claims, and device_id
   - Logic: Checks if device_id exists in app_users table

3. `get_device_user_id(device_id text)`
   - Returns: uuid
   - Security: SECURITY DEFINER
   - Purpose: Retrieves user_id associated with device_id
   - Logic: Looks up user_id in app_users table by device_id

### Push Notifications
1. `send_push_notification(p_title text, p_body text, p_data jsonb, p_target_type text, p_target_users uuid[])`
   - Returns: bigint (notification_id)
   - Security: SECURITY DEFINER
   - Purpose: Sends push notification to specified users
   - Logs: notification_history with delivery status
   - Parameters:
     - p_title: Notification title
     - p_body: Notification body
     - p_data: Additional JSON data
     - p_target_type: 'all' or 'specific'
     - p_target_users: Array of target user IDs

2. `send_push_notifications(title text, body text, data jsonb, target_type text, target_device_ids text[])`
   - Returns: jsonb with delivery results
   - Security: SECURITY DEFINER
   - Purpose: Sends push notifications to multiple devices
   - Logs: notification_history with success/failure counts
   - Features:
     - Handles multiple devices
     - Tracks success/failure per device
     - Supports different target types

3. `cleanup_inactive_tokens(days_threshold integer)`
   - Returns: integer (count of deleted tokens)
   - Purpose: Removes inactive push tokens
   - Default threshold: 30 days
   - Logic: Deletes tokens not used within threshold period

### Version Management
1. `publish_new_version()`
   - Returns: jsonb with full app data
   - Purpose: Creates new version of app data
   - Features:
     - Generates sequential version numbers
     - Includes all related data
     - Tracks changes since last version
     - Creates JSON file in storage

2. `publish_new_version_from(source_version_id uuid)`
   - Returns: jsonb with new version info
   - Purpose: Creates version from existing one
   - Logic: Copies source version data with new ID

3. `get_changes_since_last_version()`
   - Returns: jsonb with change counts
   - Purpose: Tracks changes across all tables
   - Features:
     - Counts new/updated records
     - Includes deleted records
     - Groups by table

### Data Retrieval
1. `get_events_with_related()`
   - Returns: jsonb with events and related data
   - Purpose: Retrieves events with all related information
   - Includes:
     - Event details
     - Location information
     - Event people (speakers/participants)
   - Orders by start_time

2. `get_push_statistics()`
   - Returns: TABLE with statistics
   - Security: SECURITY DEFINER
   - Purpose: Provides push notification metrics
   - Metrics:
     - Total users
     - Active users (30 days)
     - Total tokens
     - Active tokens

### Utility Functions
1. `get_app_data_url()`
   - Returns: text (URL)
   - Purpose: Returns URL for app data file
   - Used by: Version management functions

2. `set_device_id(device_id text)`
   - Returns: void
   - Purpose: Sets device_id in request context
   - Used by: Authentication functions

### Trigger Functions
1. `update_timestamp()`
   - Returns: trigger
   - Purpose: Updates updated_at column
   - Used by: Most tables

2. `log_deletion()`
   - Returns: trigger
   - Security: SECURITY DEFINER
   - Purpose: Logs record deletions
   - Logs to: deletions_log table

3. `set_social_feed_post_user_id()`
   - Returns: trigger
   - Security: SECURITY DEFINER
   - Purpose: Sets user_id for social feed posts
   - Logic: Uses auth.uid() if not set

4. `update_last_active_timestamp()`
   - Returns: trigger
   - Purpose: Updates last_active_at
   - Used by: app_user_settings

## Triggers

### Common Triggers
1. `update_timestamp`
   - Purpose: Updates the `updated_at` column on UPDATE operations
   - Applied to: announcements, event_people, events, locations, markdown_pages, people, resources, sections, social_feed_posts
   - Event: UPDATE
   - Timing: BEFORE
   - Function: update_timestamp()

2. `log_deletion`
   - Purpose: Logs record deletions to deletions_log table
   - Applied to: announcements, events, locations, markdown_pages, people, resources, sections, social_feed_posts
   - Event: DELETE
   - Timing: BEFORE
   - Function: log_deletion()

### Special Triggers
1. `markdown_pages`:
   - `update_markdown_pages_updated_at`
     - Purpose: Special trigger for updating updated_at
     - Event: UPDATE
     - Timing: BEFORE
     - Function: update_updated_at_column()

2. `social_feed_posts`:
   - `set_social_feed_post_user_id`
     - Purpose: Sets user_id from auth.users on INSERT
     - Event: INSERT
     - Timing: BEFORE
     - Function: set_social_feed_post_user_id()
     - Note: Trigger is duplicated (set_social_feed_post_user_id and set_social_feed_posts_user_id)

### Trigger Characteristics
1. Execution Timing:
   - All triggers execute BEFORE operation
   - No AFTER triggers
   - No INSTEAD OF triggers

2. Event Types:
   - UPDATE: For timestamp updates
   - DELETE: For deletion logging
   - INSERT: For setting user_id in social_feed_posts

3. Table Distribution:
   - Most tables have two triggers:
     - One for timestamp updates
     - One for deletion logging
   - markdown_pages has additional timestamp trigger
   - social_feed_posts has user_id setting trigger

4. Special Cases:
   - Duplicate trigger set_social_feed_post_user_id
   - No triggers on app_user_settings and debug_logs
   - No triggers on json_versions and notification_history

### Trigger Functions
1. `update_timestamp()` - Updates updated_at
2. `update_updated_at_column()` - Special version for markdown_pages
3. `log_deletion()` - Logs deletions
4. `set_social_feed_post_user_id()` - Sets user_id

### Usage Patterns
1. Automatic Timestamp Updates:
   - All tables with updated_at have update_timestamp trigger
   - markdown_pages has additional trigger

2. Deletion Audit:
   - All main tables log deletions
   - Logging occurs before deletion (BEFORE DELETE)

3. Automatic Field Population:
   - social_feed_posts automatically gets user_id
   - Population occurs on insert (BEFORE INSERT)

## Indexes

### Primary Key Indexes
All tables have a primary key on the `id` column:
- `announcements_pkey` - UNIQUE INDEX USING btree (id)
- `app_user_settings_pkey` - UNIQUE INDEX USING btree (id)
- `debug_logs_pkey` - UNIQUE INDEX USING btree (id)
- `deletions_log_pkey` - UNIQUE INDEX USING btree (id)
- `event_people_pkey` - UNIQUE INDEX USING btree (id)
- `events_pkey` - UNIQUE INDEX USING btree (id)
- `json_versions_pkey` - UNIQUE INDEX USING btree (id)
- `locations_pkey` - UNIQUE INDEX USING btree (id)
- `markdown_pages_pkey` - UNIQUE INDEX USING btree (id)
- `notification_history_pkey` - UNIQUE INDEX USING btree (id)
- `people_pkey` - UNIQUE INDEX USING btree (id)
- `resources_pkey` - UNIQUE INDEX USING btree (id)
- `sections_pkey` - UNIQUE INDEX USING btree (id)
- `social_feed_posts_pkey` - UNIQUE INDEX USING btree (id)

### Unique Indexes
1. `app_user_settings`:
   - `app_user_settings_device_id_key` - UNIQUE INDEX USING btree (device_id)
   - Duplicated with `idx_app_user_settings_device_id` for optimization

2. `locations`:
   - `locations_name_key` - UNIQUE INDEX USING btree (name)

3. `markdown_pages`:
   - `markdown_pages_slug_key` - UNIQUE INDEX USING btree (slug)
   - Duplicated with `markdown_pages_slug_idx` for optimization

4. `sections`:
   - `sections_name_key` - UNIQUE INDEX USING btree (name)

### Performance Indexes
1. `app_user_settings`:
   - `idx_app_user_settings_device_id` - INDEX USING btree (device_id)
   - `idx_app_user_settings_push_token` - PARTIAL INDEX USING btree (push_token) WHERE push_token IS NOT NULL

2. `json_versions`:
   - `idx_json_versions_published_at` - INDEX USING btree (published_at DESC)

3. `markdown_pages`:
   - `markdown_pages_slug_idx` - INDEX USING btree (slug)

4. `notification_history`:
   - `idx_notification_history_sent_at` - INDEX USING btree (sent_at DESC)

5. `social_feed_posts`:
   - `idx_social_feed_posts_user_id` - INDEX USING btree (user_id)

### Index Characteristics
1. Index Types:
   - All indexes use B-tree implementation
   - No composite indexes
   - No GiST, GIN or other special index types

2. Features:
   - All primary keys are UNIQUE
   - Partial indexes (PARTIAL) used for optimization:
     - `push_token` only for non-null values
   - Descending indexes (DESC) for timestamp fields:
     - `published_at` in json_versions
     - `sent_at` in notification_history

3. Index Duplication:
   - `app_user_settings`: device_id has both UNIQUE and regular index
   - `markdown_pages`: slug has both UNIQUE and regular index
   - This may be optimization for different query types

4. Missing Indexes:
   - No indexes on foreign keys (except user_id)
   - No indexes on frequently searched fields
   - No indexes on sorting fields

## Table Relationships

### Core Entities
1. `people` - Central entity for all participants
   - Table references:
     - `announcements.person_id` -> `people.id` - Announcement author
     - `event_people.person_id` -> `people.id` - Event participant
     - `social_feed_posts.author_id` -> `people.id` - Social feed post author

2. `events` - Main entity for event management
   - Table references:
     - `event_people.event_id` -> `events.id` - Event-participant relationship
   - Other table references:
     - `events.location_id` -> `locations.id` - Event location
     - `events.section_id` -> `sections.id` - Event section

3. `sections` - Event sections/days
   - Table references:
     - `events.section_id` -> `sections.id` - Events in this section

4. `locations` - Event venues
   - Table references:
     - `events.location_id` -> `locations.id` - Events at this location

### Supporting Entities
1. `social_feed_posts` - Social feed posts
   - Other table references:
     - `social_feed_posts.author_id` -> `people.id` - Post author
     - `social_feed_posts.user_id` -> `auth.users.id` - User who created the post

2. `announcements` - Announcements
   - Other table references:
     - `announcements.person_id` -> `people.id` - Announcement author

3. `event_people` - Event-participant relationships
   - Other table references:
     - `event_people.event_id` -> `events.id` - Event
     - `event_people.person_id` -> `people.id` - Participant

4. `json_versions` - JSON data versions
   - Other table references:
     - `json_versions.published_by` -> `auth.users.id` - User who published the version

5. `notification_history` - Notification history
   - Other table references:
     - `notification_history.sent_by` -> `auth.users.id` - User who sent the notification

### Independent Entities
The following tables have no foreign keys:
- `app_user_settings`
- `debug_logs`
- `deletions_log`
- `markdown_pages`
- `resources`

### Foreign Key Schemas
1. Internal relationships (public -> public):
   - `announcements` -> `people`
   - `event_people` -> `events`, `people`
   - `events` -> `locations`, `sections`
   - `social_feed_posts` -> `people`

2. Auth schema relationships (public -> auth):
   - `json_versions` -> `auth.users`
   - `notification_history` -> `auth.users`
   - `social_feed_posts` -> `auth.users`

### Relationship Characteristics
1. All foreign keys use CASCADE for updates and deletions
2. All relationships are mandatory (NOT NULL)
3. Schema separation:
   - Most relationships within public schema
   - User relationships in auth schema
4. Special cases:
   - `social_feed_posts` has relationships with both schemas
   - `event_people` is a junction table

## Common Fields

Most tables include these common fields:
- `id` - Primary key (bigint or uuid)
- `created_at` - Creation timestamp (with timezone)
- `updated_at` - Last update timestamp (with timezone)

## Tables with user_id

Only two tables require user_id for RLS:

1. `app_user_settings` - uses `id` (uuid) as user identifier
2. `social_feed_posts` - has explicit `user_id` column with FK to `auth.users(id)`

## RLS Policies

### Standard Pattern (Most Tables)
Most tables follow this pattern with two policies:
1. `allow_auth_access`
   - Roles: authenticated
   - Commands: ALL
   - Qualifier: true
   - With Check: null (some tables have "true")
   - Permissive: Yes

2. `deny_anon_access`
   - Roles: anon
   - Commands: ALL
   - Qualifier: false
   - With Check: null
   - Permissive: Yes

Tables using this pattern:
- announcements
- event_people
- events
- json_versions
- locations
- markdown_pages
- notification_history
- people
- resources
- sections

### Special Cases

#### app_user_settings
- Single policy `app_user_settings_policy`
  - Roles: public
  - Commands: ALL
  - Qualifier: true
  - With Check: true
  - Permissive: Yes
- Allows all operations for all users

#### debug_logs
- Single policy `debug_logs_auth_policy`
  - Roles: authenticated
  - Commands: ALL
  - Qualifier: true
  - With Check: true
  - Permissive: Yes
- Allows all operations for authenticated users only

#### deletions_log
Two separate policies:
1. `Allow anonymous inserts`
   - Roles: anon
   - Commands: INSERT
   - Qualifier: null
   - With Check: true
   - Permissive: Yes

2. `Allow anonymous read`
   - Roles: public
   - Commands: SELECT
   - Qualifier: true
   - With Check: null
   - Permissive: Yes

#### social_feed_posts
Five separate policies for fine-grained control:
1. `allow_auth_select`
   - Roles: authenticated
   - Commands: SELECT
   - Qualifier: true
   - With Check: null
   - Permissive: Yes

2. `allow_auth_insert`
   - Roles: authenticated
   - Commands: INSERT
   - Qualifier: null
   - With Check: (user_id IS NULL) OR (auth.uid() = user_id)
   - Permissive: Yes

3. `allow_auth_update`
   - Roles: authenticated
   - Commands: UPDATE
   - Qualifier: auth.uid() = user_id
   - With Check: auth.uid() = user_id
   - Permissive: Yes

4. `allow_auth_delete`
   - Roles: authenticated
   - Commands: DELETE
   - Qualifier: auth.uid() = user_id
   - With Check: null
   - Permissive: Yes

5. `deny_anon_access`
   - Roles: anon
   - Commands: ALL
   - Qualifier: false
   - With Check: null
   - Permissive: Yes

### Policy Characteristics
1. All policies are PERMISSIVE
2. Most tables use simple auth/anon split
3. Some tables have additional checks:
   - locations, markdown_pages, people, resources: with_check = true
   - social_feed_posts: user-specific checks for all operations
4. Special cases:
   - app_user_settings: public access
   - debug_logs: authenticated only
   - deletions_log: anonymous inserts and public reads

## All Tables

### announcements
- PK: id (bigint)
- FK: person_id -> people.id
- Has RLS: Yes
- Description: Announcements
- Key fields:
  - content (text, not null)
  - published_at (timestamp with timezone, not null)

### app_user_settings
- PK: id (uuid) - acts as user_id
- No FKs
- Has RLS: Yes
- Key fields:
  - device_id (text, not null)
  - device_info (jsonb, not null, default '{}')
  - push_token (text, nullable)
  - settings (jsonb, not null, default '{"social_feed": true, "announcements": true}')
  - last_active_at (timestamp with timezone, not null, default now())

### debug_logs
- PK: id (integer, auto-increment)
- Has RLS: Yes
- Key fields:
  - device_id (text, nullable)
  - headers (text, nullable)
  - jwt_claims (text, nullable)
  - created_at (timestamp with timezone, nullable, default now())

### deletions_log
- PK: id (uuid, default gen_random_uuid())
- Has RLS: Yes
- Key fields:
  - table_name (text, not null)
  - record_id (bigint, not null)
  - deleted_at (timestamp with timezone, nullable, default now())

### event_people
- PK: id (bigint)
- FKs: 
  - event_id -> events.id
  - person_id -> people.id
- Has RLS: Yes
- Description: Speakers for event
- Key fields:
  - role (text, not null, default 'speaker')

### events
- PK: id (bigint)
- FKs:
  - location_id -> locations.id
  - section_id -> sections.id
- Has RLS: Yes
- Description: Events
- Key fields:
  - title (text, not null)
  - description (text, nullable)
  - date (date, not null)
  - start_time (timestamp with timezone, not null)
  - end_time (timestamp with timezone, not null)
  - duration (text, nullable)
  - section (text, not null, default '')

### json_versions
- PK: id (uuid, default gen_random_uuid())
- FK: published_by -> users.id
- Has RLS: Yes
- Key fields:
  - version (varchar, not null)
  - file_path (text, not null)
  - file_url (text, not null)
  - changes (jsonb, not null)
  - published_at (timestamp with timezone, nullable, default now())

### locations
- PK: id (bigint)
- Has RLS: Yes
- Description: Locations
- Key fields:
  - name (text, not null)
  - link_map (text, nullable)
  - link (text, nullable)
  - link_address (text, nullable)

### markdown_pages
- PK: id (bigint)
- Has RLS: Yes
- Key fields:
  - slug (text, not null)
  - title (text, not null)
  - content (text, not null)
  - published (boolean, not null, default false)

### notification_history
- PK: id (bigint)
- FK: sent_by -> users.id
- Has RLS: Yes
- Key fields:
  - title (text, not null)
  - body (text, not null)
  - data (jsonb, nullable, default '{}')
  - target_type (text, not null)
  - target_users (uuid[], nullable, default '{}')
  - success_count (integer, nullable, default 0)
  - failure_count (integer, nullable, default 0)
  - sent_at (timestamp with timezone, nullable, default now())

### people
- PK: id (bigint)
- Has RLS: Yes
- Description: Speakers and participants
- Key fields:
  - name (text, not null)
  - title (text, nullable)
  - company (text, nullable)
  - bio (text, nullable)
  - photo_url (text, nullable)
  - country (text, nullable)
  - role (text, not null, default 'attendee')
  - email (text, nullable)
  - mobile (text, nullable)

### resources
- PK: id (bigint)
- Has RLS: Yes
- Description: Resources
- Key fields:
  - name (text, not null)
  - link (text, not null)
  - description (text, nullable, default '')
  - is_route (boolean, not null, default false)

### sections
- PK: id (bigint)
- Has RLS: Yes
- Description: sections of events and dates
- Key fields:
  - name (text, not null)
  - date (text, not null)

### social_feed_posts
- PK: id (bigint)
- FKs:
  - author_id -> people.id
  - user_id -> users.id
- Has RLS: Yes
- Description: Social Feed records
- Key fields:
  - content (text, not null)
  - timestamp (timestamp with timezone, not null)
  - image_urls (array, not null)

## Notes

1. RLS Policy Patterns:
   - Most tables use simple auth/anon split
   - Only `social_feed_posts` uses user-specific checks
   - `app_user_settings` and `deletions_log` have unique patterns
2. All tables have RLS enabled
3. Most tables use `bigint` for primary keys, except:
   - `app_user_settings`, `json_versions`, `deletions_log` use UUID
   - `debug_logs` uses integer
4. Common timestamp fields:
   - created_at
   - updated_at
   - deleted_at (in deletions_log)
   - published_at (in json_versions)
   - sent_at (in notification_history)
5. JSON fields:
   - app_user_settings: device_info, settings
   - notification_history: data
   - json_versions: changes
6. Array fields:
   - notification_history: target_users (uuid[])
   - social_feed_posts: image_urls (array)

## References
- Original SQL query: `src/__tests__/integration/rls/sql/show_schema.sql`
- Testing plan: `TESTING_PLAN.md` 