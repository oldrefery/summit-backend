# Testing Plan and Guidelines

## Status Indicators
- ✅ - Completed
- 🚧 - In Progress
- ⏳ - Pending
- ✔️ - Verified

## General Instructions and Principles
- All code comments in English
- Team communication in Russian
- Follow SOLID, DRY and KISS principles
- Use TypeScript
- Use ESLint
- NEVER ignore TypeScript or ESLint errors
- ALWAYS use unique names in tests to prevent conflicts (especially for tables with unique constraints)
  - Add timestamp or random suffix to test data names
  - This prevents parallel test execution conflicts
  - Allows running tests multiple times without DB cleanup

## Test Environment
- Production Supabase: iabwkgppahudnaouwaep
- Test Supabase: vupwomxxfqjmwtbptkfu
- Test database is a full copy of production
- Sync from PROD to TEST available via `npm run sync:prod:test`

## Safety Rules
- Integration tests MUST run ONLY on Test Supabase
- NEVER run integration tests against Production
- Always verify Supabase project reference before test execution
- Test environment variables are stored in .env.test
- Double verification of database ID in setup.ts

## Project Structure
- Unit tests: Located in `__tests__` folder next to each component
- Integration tests: Located in `src/__tests__/integration`
- E2E tests: Located in `src/__tests__/e2e`

## Current Status

### Unit Tests
- ✅ Components tests
- ✅ Hooks tests
- ✅ API mocks

### Integration Environment
- ✅ Test Supabase project setup
- ✅ Sync script from PROD to TEST
- ✅ Test database configuration
- ✅ Environment variables configuration
- ✅ Pre-commit hooks with integration tests

## Integration Tests Implementation Plan

### Phase 1: Authentication and RLS
- ✅ Basic authentication tests
  - ✅ Login with valid credentials
  - ✅ Failed login with invalid credentials
  - ✅ Session management
  - ✅ Logout functionality
- 🚧 RLS policy verification
  - Общие требования:
    - Каждая таблица должна иметь колонку user_id типа UUID со ссылкой на auth.users(id)
    - Для каждой таблицы должен быть создан триггер для автозаполнения user_id
    - RLS должен быть включен для каждой таблицы
    - Анонимные пользователи не должны иметь доступа к данным
    - Аутентифицированные пользователи должны иметь доступ только к своим записям (кроме чтения)
    - Все изменения должны быть покрыты тестами
    - SQL скрипты должны быть идемпотентными (безопасными для повторного выполнения)
  - ✅ People table policies
    - ✅ Anonymous access restrictions
    - ✅ Authenticated user permissions
    - ✅ Role-based access control
    - ✅ Required Schema Changes:
      ```sql
      -- Add user_id column
      ALTER TABLE people 
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
      
      -- Create trigger for auto-filling user_id
      CREATE OR REPLACE FUNCTION public.set_user_id()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.user_id = auth.uid();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      CREATE TRIGGER set_people_user_id
        BEFORE INSERT ON people
        FOR EACH ROW
        EXECUTE FUNCTION public.set_user_id();
      ```
    - ✅ RLS Policies:
      ```sql
      -- Enable RLS
      ALTER TABLE people ENABLE ROW LEVEL SECURITY;
      
      -- Deny policies for anon
      CREATE POLICY "deny_anon_select" ON people FOR SELECT TO anon USING (false);
      CREATE POLICY "deny_anon_insert" ON people FOR INSERT TO anon WITH CHECK (false);
      CREATE POLICY "deny_anon_update" ON people FOR UPDATE TO anon USING (false);
      CREATE POLICY "deny_anon_delete" ON people FOR DELETE TO anon USING (false);
      
      -- Allow policies for authenticated
      CREATE POLICY "allow_auth_select" ON people FOR SELECT TO authenticated USING (true);
      CREATE POLICY "allow_auth_insert" ON people FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
      CREATE POLICY "allow_auth_update" ON people FOR UPDATE TO authenticated USING (user_id = auth.uid());
      CREATE POLICY "allow_auth_delete" ON people FOR DELETE TO authenticated USING (user_id = auth.uid());
      ```
  - ✅ Events table policies
    - ✅ Anonymous access restrictions
    - ✅ Authenticated user permissions
    - ✅ Required Schema Changes:
      ```sql
      -- Add user_id column
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
      
      -- Create trigger for auto-filling user_id
      CREATE OR REPLACE FUNCTION public.set_event_user_id()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.user_id = auth.uid();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      CREATE TRIGGER set_events_user_id
        BEFORE INSERT ON events
        FOR EACH ROW
        EXECUTE FUNCTION public.set_event_user_id();
      ```
    - ✅ RLS Policies:
      ```sql
      -- Enable RLS
      ALTER TABLE events ENABLE ROW LEVEL SECURITY;
      
      -- Deny policies for anon
      CREATE POLICY "deny_anon_select_events" ON events FOR SELECT TO anon USING (false);
      CREATE POLICY "deny_anon_insert_events" ON events FOR INSERT TO anon WITH CHECK (false);
      CREATE POLICY "deny_anon_update_events" ON events FOR UPDATE TO anon USING (false);
      CREATE POLICY "deny_anon_delete_events" ON events FOR DELETE TO anon USING (false);
      
      -- Allow policies for authenticated
      CREATE POLICY "allow_auth_select_events" ON events FOR SELECT TO authenticated USING (true);
      CREATE POLICY "allow_auth_insert_events" ON events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
      CREATE POLICY "allow_auth_update_events" ON events FOR UPDATE TO authenticated USING (user_id = auth.uid());
      CREATE POLICY "allow_auth_delete_events" ON events FOR DELETE TO authenticated USING (user_id = auth.uid());
      ```
    - ✅ Тесты написаны
    - ✅ SQL скрипт выполнен
    - ✅ Тесты пройдены успешно
  - ✅ Event People table policies
    - ✅ Тесты написаны
    - ✅ SQL скрипт выполнен
    - ✅ Тесты пройдены успешно
    - ✅ Проверено:
      - Анонимные пользователи не могут читать/создавать/обновлять/удалять записи
      - Аутентифицированные пользователи могут читать все записи
      - Аутентифицированные пользователи могут создавать новые записи
      - Аутентифицированные пользователи могут обновлять/удалять только свои записи
      - Поле user_id заполняется автоматически при создании записи
      - Каскадное удаление при удалении события работает
      - Защита от удаления людей с существующими связями работает
      - Проверки внешних ключей работают
    - Required Schema Changes:
      ```sql
      -- Add user_id column
      ALTER TABLE event_people 
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
      
      -- Create trigger for auto-filling user_id
      CREATE OR REPLACE FUNCTION public.set_event_person_user_id()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.user_id = auth.uid();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      DROP TRIGGER IF EXISTS set_event_people_user_id ON event_people;
      CREATE TRIGGER set_event_people_user_id
        BEFORE INSERT ON event_people
        FOR EACH ROW
        EXECUTE FUNCTION public.set_event_person_user_id();
      ```
    - RLS Policies:
      ```sql
      -- Enable RLS
      ALTER TABLE event_people ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "deny_anon_select_event_people" ON event_people;
      DROP POLICY IF EXISTS "deny_anon_insert_event_people" ON event_people;
      DROP POLICY IF EXISTS "deny_anon_update_event_people" ON event_people;
      DROP POLICY IF EXISTS "deny_anon_delete_event_people" ON event_people;
      DROP POLICY IF EXISTS "allow_auth_select_event_people" ON event_people;
      DROP POLICY IF EXISTS "allow_auth_insert_event_people" ON event_people;
      DROP POLICY IF EXISTS "allow_auth_update_event_people" ON event_people;
      DROP POLICY IF EXISTS "allow_auth_delete_event_people" ON event_people;
      
      -- Create policies
      CREATE POLICY "deny_anon_select_event_people" ON event_people FOR SELECT TO anon USING (false);
      CREATE POLICY "deny_anon_insert_event_people" ON event_people FOR INSERT TO anon WITH CHECK (false);
      CREATE POLICY "deny_anon_update_event_people" ON event_people FOR UPDATE TO anon USING (false);
      CREATE POLICY "deny_anon_delete_event_people" ON event_people FOR DELETE TO anon USING (false);
      
      CREATE POLICY "allow_auth_select_event_people" ON event_people FOR SELECT TO authenticated USING (true);
      CREATE POLICY "allow_auth_insert_event_people" ON event_people FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
      CREATE POLICY "allow_auth_update_event_people" ON event_people FOR UPDATE TO authenticated USING (user_id = auth.uid());
      CREATE POLICY "allow_auth_delete_event_people" ON event_people FOR DELETE TO authenticated USING (user_id = auth.uid());
      
      -- Add foreign key constraints with cascade delete for events
      ALTER TABLE event_people 
      DROP CONSTRAINT IF EXISTS event_people_event_id_fkey,
      ADD CONSTRAINT event_people_event_id_fkey 
        FOREIGN KEY (event_id) 
        REFERENCES events(id) 
        ON DELETE CASCADE;
      
      -- Add foreign key constraints without cascade for people
      ALTER TABLE event_people 
      DROP CONSTRAINT IF EXISTS event_people_person_id_fkey,
      ADD CONSTRAINT event_people_person_id_fkey 
        FOREIGN KEY (person_id) 
        REFERENCES people(id) 
        ON DELETE RESTRICT;
      ```
  - ✅ Sections table policies
    - Tests written and passed successfully
    - SQL scripts executed
    - Verified:
      - Anonymous users cannot create or read records
      - Authenticated users can create their own sections
      - Authenticated users can read only their own sections
      - Authenticated users can update their own sections
      - Authenticated users can delete their own sections
    - Required schema changes:
      - Added trigger function `set_section_user_id()` to auto-fill user_id
      - Enabled RLS
      - Added policies:
        ```sql
        CREATE POLICY "Enable read access for authenticated users" ON public.sections
        FOR SELECT TO authenticated USING (auth.uid() = user_id);

        CREATE POLICY "Enable insert access for authenticated users only" ON public.sections
        FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Enable update access for users based on user_id" ON public.sections
        FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Enable delete access for users based on user_id" ON public.sections
        FOR DELETE TO authenticated USING (auth.uid() = user_id);
        ```
  - ✅ Markdown Pages table policies
    - ✅ Тесты написаны
    - ✅ SQL скрипт выполнен
    - ✅ Тесты пройдены успешно
    - Required Schema Changes:
      ```sql
      -- Add user_id column
      ALTER TABLE markdown_pages 
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
      
      -- Create trigger for auto-filling user_id
      CREATE OR REPLACE FUNCTION public.set_markdown_page_user_id()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.user_id = auth.uid();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      CREATE TRIGGER set_markdown_pages_user_id
        BEFORE INSERT ON markdown_pages
        FOR EACH ROW
        EXECUTE FUNCTION public.set_markdown_page_user_id();
      ```
    - RLS Policies:
      ```sql
      -- Enable RLS
      ALTER TABLE markdown_pages ENABLE ROW LEVEL SECURITY;
      
      -- Create policies
      CREATE POLICY "Markdown pages are viewable by everyone" ON markdown_pages
        FOR SELECT
        USING (
          published = true OR 
          (auth.uid() IS NOT NULL AND user_id = auth.uid())
        );
      
      CREATE POLICY "Users can create markdown pages" ON markdown_pages
        FOR INSERT
        WITH CHECK (auth.uid() IS NOT NULL);
      
      CREATE POLICY "Users can update own markdown pages" ON markdown_pages
        FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Users can delete own markdown pages" ON markdown_pages
        FOR DELETE
        USING (auth.uid() = user_id);
      ```
  - 🚧 Social Feed Posts table policies
    - Tests written and passed successfully
    - SQL scripts executed
    - Verified:
      - Anonymous users cannot create or read records
      - Authenticated users can create their own posts
      - Authenticated users can read all posts
      - Authenticated users can update their own posts
      - Authenticated users can delete their own posts
    - Required schema changes:
      - Added trigger function `set_social_feed_post_user_id()` to auto-fill user_id
      - Enabled RLS
      - Added policies:
        ```sql
        CREATE POLICY "Enable read access for authenticated users" ON public.social_feed_posts
        FOR SELECT TO authenticated USING (true);

        CREATE POLICY "Enable insert access for authenticated users only" ON public.social_feed_posts
        FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Enable update access for users based on user_id" ON public.social_feed_posts
        FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Enable delete access for users based on user_id" ON public.social_feed_posts
        FOR DELETE TO authenticated USING (auth.uid() = user_id);
        ```
  - ⏳ Push Tokens table policies
    - Требуется аналогичная структура:
      - Добавить user_id
      - Настроить триггер
      - Настроить RLS политики
      - Особое внимание на связь с app_users
  - ⏳ Notification History table policies
    - Требуется аналогичная структура:
      - Добавить user_id
      - Настроить триггер
      - Настроить RLS политики
  - ⏳ App Users table policies
    - Требуется аналогичная структура:
      - Добавить user_id
      - Настроить триггер
      - Настроить RLS политики
      - Особое внимание на связь с auth.users
  - ⏳ JSON Versions table policies
    - Требуется аналогичная структура:
      - Добавить user_id
      - Настроить триггер
      - Настроить RLS политики
  - ✅ Locations table policies
    - ✅ Тесты написаны
    - ✅ SQL скрипт выполнен
    - ✅ Тесты пройдены успешно
    - Required Schema Changes:
      ```sql
      -- Add user_id column
      ALTER TABLE locations 
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
      
      -- Create trigger for auto-filling user_id
      CREATE OR REPLACE FUNCTION public.set_location_user_id()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.user_id = auth.uid();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      CREATE TRIGGER set_locations_user_id
        BEFORE INSERT ON locations
        FOR EACH ROW
        EXECUTE FUNCTION public.set_location_user_id();
      ```
    - RLS Policies:
      ```sql
      -- Enable RLS
      ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
      
      -- Deny policies for anon
      CREATE POLICY "deny_anon_select_locations" ON locations FOR SELECT TO anon USING (false);
      CREATE POLICY "deny_anon_insert_locations" ON locations FOR INSERT TO anon WITH CHECK (false);
      CREATE POLICY "deny_anon_update_locations" ON locations FOR UPDATE TO anon USING (false);
      CREATE POLICY "deny_anon_delete_locations" ON locations FOR DELETE TO anon USING (false);
      
      -- Allow policies for authenticated
      CREATE POLICY "allow_auth_select_locations" ON locations FOR SELECT TO authenticated USING (true);
      CREATE POLICY "allow_auth_insert_locations" ON locations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
      CREATE POLICY "allow_auth_update_locations" ON locations FOR UPDATE TO authenticated USING (user_id = auth.uid());
      CREATE POLICY "allow_auth_delete_locations" ON locations FOR DELETE TO authenticated USING (user_id = auth.uid());
      ```
  - ✅ Resources table policies
    - ✅ Тесты написаны
    - ✅ SQL скрипт выполнен
    - ✅ Тесты пройдены успешно
    - ✅ Проверено:
      - Анонимные пользователи не могут читать/создавать/обновлять/удалять записи
      - Аутентифицированные пользователи могут читать все записи
      - Аутентифицированные пользователи могут создавать новые записи
      - Аутентифицированные пользователи могут обновлять/удалять только свои записи
      - Поле user_id заполняется автоматически при создании записи
    - Required Schema Changes:
      ```sql
      -- Add user_id column
      ALTER TABLE resources 
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
      
      -- Create trigger for auto-filling user_id
      CREATE OR REPLACE FUNCTION public.set_resource_user_id()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.user_id = auth.uid();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      CREATE TRIGGER set_resources_user_id
        BEFORE INSERT ON resources
        FOR EACH ROW
        EXECUTE FUNCTION public.set_resource_user_id();
      ```
    - RLS Policies:
      ```sql
      -- Enable RLS
      ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
      
      -- Deny policies for anon
      CREATE POLICY "deny_anon_select_resources" ON resources FOR SELECT TO anon USING (false);
      CREATE POLICY "deny_anon_insert_resources" ON resources FOR INSERT TO anon WITH CHECK (false);
      CREATE POLICY "deny_anon_update_resources" ON resources FOR UPDATE TO anon USING (false);
      CREATE POLICY "deny_anon_delete_resources" ON resources FOR DELETE TO anon USING (false);
      
      -- Allow policies for authenticated
      CREATE POLICY "allow_auth_select_resources" ON resources FOR SELECT TO authenticated USING (true);
      CREATE POLICY "allow_auth_insert_resources" ON resources FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
      CREATE POLICY "allow_auth_update_resources" ON resources FOR UPDATE TO authenticated USING (user_id = auth.uid());
      CREATE POLICY "allow_auth_delete_resources" ON resources FOR DELETE TO authenticated USING (user_id = auth.uid());
      ```
  - ✅ Announcements table policies
    - ✅ Тесты написаны
    - ✅ SQL скрипт выполнен
    - ✅ Тесты пройдены успешно
    - ✅ Проверено:
      - Анонимные пользователи не могут читать/создавать/обновлять/удалять записи
      - Аутентифицированные пользователи могут читать все записи
      - Аутентифицированные пользователи могут создавать новые записи
      - Аутентифицированные пользователи могут обновлять/удалять только свои записи
      - Поле user_id заполняется автоматически при создании записи
    - Required Schema Changes:
      ```sql
      -- Add user_id column
      ALTER TABLE announcements 
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
      
      -- Create trigger for auto-filling user_id
      CREATE OR REPLACE FUNCTION public.set_announcement_user_id()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.user_id = auth.uid();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      DROP TRIGGER IF EXISTS set_announcements_user_id ON announcements;
      CREATE TRIGGER set_announcements_user_id
        BEFORE INSERT ON announcements
        FOR EACH ROW
        EXECUTE FUNCTION public.set_announcement_user_id();
      ```
    - RLS Policies:
      ```sql
      -- Enable RLS
      ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "deny_anon_select_announcements" ON announcements;
      DROP POLICY IF EXISTS "deny_anon_insert_announcements" ON announcements;
      DROP POLICY IF EXISTS "deny_anon_update_announcements" ON announcements;
      DROP POLICY IF EXISTS "deny_anon_delete_announcements" ON announcements;
      DROP POLICY IF EXISTS "allow_auth_select_announcements" ON announcements;
      DROP POLICY IF EXISTS "allow_auth_insert_announcements" ON announcements;
      DROP POLICY IF EXISTS "allow_auth_update_announcements" ON announcements;
      DROP POLICY IF EXISTS "allow_auth_delete_announcements" ON announcements;
      
      -- Create policies
      CREATE POLICY "deny_anon_select_announcements" ON announcements FOR SELECT TO anon USING (false);
      CREATE POLICY "deny_anon_insert_announcements" ON announcements FOR INSERT TO anon WITH CHECK (false);
      CREATE POLICY "deny_anon_update_announcements" ON announcements FOR UPDATE TO anon USING (false);
      CREATE POLICY "deny_anon_delete_announcements" ON announcements FOR DELETE TO anon USING (false);
      
      CREATE POLICY "allow_auth_select_announcements" ON announcements FOR SELECT TO authenticated USING (true);
      CREATE POLICY "allow_auth_insert_announcements" ON announcements FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
      CREATE POLICY "allow_auth_update_announcements" ON announcements FOR UPDATE TO authenticated USING (user_id = auth.uid());
      CREATE POLICY "allow_auth_delete_announcements" ON announcements FOR DELETE TO authenticated USING (user_id = auth.uid());
      ```

### Phase 2: CRUD Operations
- ⏳ Create operations tests
- ⏳ Read operations tests
- ⏳ Update operations tests
- ⏳ Delete operations tests
- ⏳ Data validation tests

### Phase 3: Storage Operations
- ⏳ File upload tests
- ⏳ File retrieval tests
- ⏳ File deletion tests
- ⏳ Storage permissions tests

### Phase 4: Push Notifications
- ⏳ Notification sending tests
- ⏳ Notification receiving tests
- ⏳ Notification handling tests

### Test Infrastructure
- ✅ Database cleanup script
- ⏳ Test data generation
- ⏳ CI/CD for integration tests

### Documentation
- 🚧 Testing process description
- ⏳ Test environment setup guide
- ⏳ Integration tests examples

## Test Execution

### Running Tests
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## Notes
- All tests should use real test database (copy of production)
- No mocking for Supabase operations
- Clear test data before and after test runs
- Each test file should handle its own cleanup
- Use test database ID verification to prevent production access
- Integration tests require valid Supabase credentials

## Additional Changes
- ✅ Event People table policies
  - ✅ Тесты написаны
  - ✅ SQL скрипт выполнен
  - ✅ Тесты пройдены успешно
  - ✅ Проверено:
    - Анонимные пользователи не могут читать/создавать/обновлять/удалять записи
    - Аутентифицированные пользователи могут читать все записи
    - Аутентифицированные пользователи могут создавать новые записи
    - Аутентифицированные пользователи могут обновлять/удалять только свои записи
    - Поле user_id заполняется автоматически при создании записи
    - Каскадное удаление при удалении события работает
    - Защита от удаления людей с существующими связями работает
    - Проверки внешних ключей работают
  - Required Schema Changes:
    ```sql
    -- Add user_id column
    ALTER TABLE event_people 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
    
    -- Create trigger for auto-filling user_id
    CREATE OR REPLACE FUNCTION public.set_event_person_user_id()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.user_id = auth.uid();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    DROP TRIGGER IF EXISTS set_event_people_user_id ON event_people;
    CREATE TRIGGER set_event_people_user_id
      BEFORE INSERT ON event_people
      FOR EACH ROW
      EXECUTE FUNCTION public.set_event_person_user_id();
    ```
  - RLS Policies:
    ```sql
    -- Enable RLS
    ALTER TABLE event_people ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "deny_anon_select_event_people" ON event_people;
    DROP POLICY IF EXISTS "deny_anon_insert_event_people" ON event_people;
    DROP POLICY IF EXISTS "deny_anon_update_event_people" ON event_people;
    DROP POLICY IF EXISTS "deny_anon_delete_event_people" ON event_people;
    DROP POLICY IF EXISTS "allow_auth_select_event_people" ON event_people;
    DROP POLICY IF EXISTS "allow_auth_insert_event_people" ON event_people;
    DROP POLICY IF EXISTS "allow_auth_update_event_people" ON event_people;
    DROP POLICY IF EXISTS "allow_auth_delete_event_people" ON event_people;
    
    -- Create policies
    CREATE POLICY "deny_anon_select_event_people" ON event_people FOR SELECT TO anon USING (false);
    CREATE POLICY "deny_anon_insert_event_people" ON event_people FOR INSERT TO anon WITH CHECK (false);
    CREATE POLICY "deny_anon_update_event_people" ON event_people FOR UPDATE TO anon USING (false);
    CREATE POLICY "deny_anon_delete_event_people" ON event_people FOR DELETE TO anon USING (false);
    
    CREATE POLICY "allow_auth_select_event_people" ON event_people FOR SELECT TO authenticated USING (true);
    CREATE POLICY "allow_auth_insert_event_people" ON event_people FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
    CREATE POLICY "allow_auth_update_event_people" ON event_people FOR UPDATE TO authenticated USING (user_id = auth.uid());
    CREATE POLICY "allow_auth_delete_event_people" ON event_people FOR DELETE TO authenticated USING (user_id = auth.uid());
    
    -- Add foreign key constraints with cascade delete for events
    ALTER TABLE event_people 
    DROP CONSTRAINT IF EXISTS event_people_event_id_fkey,
    ADD CONSTRAINT event_people_event_id_fkey 
      FOREIGN KEY (event_id) 
      REFERENCES events(id) 
      ON DELETE CASCADE;
    
    -- Add foreign key constraints without cascade for people
    ALTER TABLE event_people 
    DROP CONSTRAINT IF EXISTS event_people_person_id_fkey,
    ADD CONSTRAINT event_people_person_id_fkey 
      FOREIGN KEY (person_id) 
      REFERENCES people(id) 
      ON DELETE RESTRICT;
    ```
  - 🚧 Social Feed Posts table policies