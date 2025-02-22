# Database Schema

## Tables with user_id

Only two tables require user_id for RLS:

1. `app_user_settings` - uses `id` (uuid) as user identifier
2. `social_feed_posts` - has explicit `user_id` column with FK to `auth.users(id)`

## RLS Policies

### Standard Pattern (Most Tables)
Most tables follow this pattern:
- `allow_auth_access` - allows all operations for authenticated users
- `deny_anon_access` - denies all operations for anonymous users

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
- Single policy `app_user_settings_policy` allowing all operations for all users (public)

#### debug_logs
- Single policy `debug_logs_auth_policy` allowing all operations for authenticated users

#### deletions_log
- Allows anonymous inserts
- Allows public read access

#### social_feed_posts
Only table with user-specific restrictions:
- `allow_auth_select` - authenticated users can read all posts
- `allow_auth_insert` - authenticated users can create posts
- `allow_auth_modify` - users can only update their own posts (user_id check)
- `allow_auth_delete` - users can only delete their own posts (user_id check)
- `deny_anon_access` - denies all operations for anonymous users

## All Tables

### announcements
- PK: id (bigint)
- FK: person_id -> people.id
- Has RLS: Yes
- Description: Announcements

### app_user_settings
- PK: id (uuid) - acts as user_id
- No FKs
- Has RLS: Yes
- Key fields: device_id, device_info, push_token, settings

### debug_logs
- PK: id (integer)
- Has RLS: Yes
- Key fields: device_id, headers, jwt_claims

### deletions_log
- PK: id (uuid)
- Has RLS: Yes
- Key fields: record_id, table_name, deleted_at

### event_people
- PK: id (bigint)
- FKs: 
  - event_id -> events.id
  - person_id -> people.id
- Has RLS: Yes
- Description: Speakers for event

### events
- PK: id (bigint)
- FKs:
  - location_id -> locations.id
  - section_id -> sections.id
- Has RLS: Yes
- Description: Events

### json_versions
- PK: id (uuid)
- FK: published_by -> users.id
- Has RLS: Yes
- Key fields: version, file_path, file_url, changes

### locations
- PK: id (bigint)
- Has RLS: Yes
- Description: Locations

### markdown_pages
- PK: id (bigint)
- Has RLS: Yes
- Key fields: slug, title, content, published

### notification_history
- PK: id (bigint)
- FK: sent_by -> users.id
- Has RLS: Yes
- Key fields: title, body, target_type, target_users

### people
- PK: id (bigint)
- Has RLS: Yes
- Description: Speakers and participants

### resources
- PK: id (bigint)
- Has RLS: Yes
- Description: Resources

### sections
- PK: id (bigint)
- Has RLS: Yes
- Description: sections of events and dates

### social_feed_posts
- PK: id (bigint)
- FKs:
  - author_id -> people.id
  - user_id -> users.id
- Has RLS: Yes
- Description: Social Feed records

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

## References
- Original SQL query: `src/__tests__/integration/rls/sql/show_schema.sql`
- Testing plan: `TESTING_PLAN.md` 