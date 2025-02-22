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
- ✅ RLS policy verification
  - Общие требования:
    - ✅ Каждая таблица должна иметь колонку user_id типа UUID со ссылкой на auth.users(id)
    - ✅ Для каждой таблицы должен быть создан триггер для автозаполнения user_id
    - ✅ RLS должен быть включен для каждой таблицы
    - ✅ Анонимные пользователи не должны иметь доступа к данным
    - ✅ Аутентифицированные пользователи должны иметь доступ только к своим записям (кроме чтения)
    - ✅ Все изменения должны быть покрыты тестами
    - ✅ SQL скрипты должны быть идемпотентными (безопасными для повторного выполнения)
  - ✅ People table policies
    - ✅ Anonymous access restrictions
    - ✅ Authenticated user permissions
    - ✅ Role-based access control
    - ✅ Required Schema Changes:
      ```sql
      -- Enable RLS
      ALTER TABLE people ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies
      DROP POLICY IF EXISTS "deny_anon_access" ON people;
      DROP POLICY IF EXISTS "allow_auth_access" ON people;
      
      -- Create new policies following standard pattern
      CREATE POLICY "deny_anon_access" ON people FOR ALL TO anon USING (false);
      CREATE POLICY "allow_auth_access" ON people FOR ALL TO authenticated USING (true);
      ```
  - ✅ Events table policies
    - ✅ Anonymous access restrictions
    - ✅ Authenticated user permissions
    - ✅ Required Schema Changes:
      ```sql
      -- Enable RLS
      ALTER TABLE events ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies
      DROP POLICY IF EXISTS "deny_anon_access" ON events;
      DROP POLICY IF EXISTS "allow_auth_access" ON events;
      
      -- Create new policies following standard pattern
      CREATE POLICY "deny_anon_access" ON events FOR ALL TO anon USING (false);
      CREATE POLICY "allow_auth_access" ON events FOR ALL TO authenticated USING (true);
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
      - Аутентифицированные пользователи имеют полный доступ ко всем записям
    - Required Schema Changes:
      ```sql
      -- Enable RLS
      ALTER TABLE event_people ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies
      DROP POLICY IF EXISTS "deny_anon_access" ON event_people;
      DROP POLICY IF EXISTS "allow_auth_access" ON event_people;
      
      -- Create new policies following standard pattern
      CREATE POLICY "deny_anon_access" ON event_people FOR ALL TO anon USING (false);
      CREATE POLICY "allow_auth_access" ON event_people FOR ALL TO authenticated USING (true);
      
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
      - Anonymous users cannot access records
      - Authenticated users have full access to all records
    - Required schema changes:
      ```sql
      -- Enable RLS
      ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies
      DROP POLICY IF EXISTS "deny_anon_access" ON sections;
      DROP POLICY IF EXISTS "allow_auth_access" ON sections;
      
      -- Create new policies following standard pattern
      CREATE POLICY "deny_anon_access" ON sections FOR ALL TO anon USING (false);
      CREATE POLICY "allow_auth_access" ON sections FOR ALL TO authenticated USING (true);
      ```
  - ✅ Markdown Pages table policies
    - ✅ Тесты написаны
    - ✅ SQL скрипт выполнен
    - ✅ Тесты пройдены успешно
    - Required Schema Changes:
      ```sql
      -- Enable RLS
      ALTER TABLE markdown_pages ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies
      DROP POLICY IF EXISTS "deny_anon_access" ON markdown_pages;
      DROP POLICY IF EXISTS "allow_auth_access" ON markdown_pages;
      
      -- Create new policies following standard pattern
      CREATE POLICY "deny_anon_access" ON markdown_pages FOR ALL TO anon USING (false);
      CREATE POLICY "allow_auth_access" ON markdown_pages FOR ALL TO authenticated USING (true);
      ```
    - RLS Policies:
      ```sql
      -- Enable RLS
      ALTER TABLE markdown_pages ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies
      DROP POLICY IF EXISTS "deny_anon_access" ON markdown_pages;
      DROP POLICY IF EXISTS "allow_auth_access" ON markdown_pages;
      
      -- Create new policies following standard pattern
      CREATE POLICY "deny_anon_access" ON markdown_pages FOR ALL TO anon USING (false);
      CREATE POLICY "allow_auth_access" ON markdown_pages FOR ALL TO authenticated USING (true);
      ```
  - ✅ Social Feed Posts table policies
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
      -- Add user_id column if not exists
      ALTER TABLE social_feed_posts 
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
      
      -- Create trigger function for auto-filling user_id
      CREATE OR REPLACE FUNCTION public.set_social_feed_post_user_id()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.user_id = auth.uid();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      DROP TRIGGER IF EXISTS set_social_feed_posts_user_id ON social_feed_posts;
      CREATE TRIGGER set_social_feed_posts_user_id
        BEFORE INSERT ON social_feed_posts
        FOR EACH ROW
        EXECUTE FUNCTION public.set_social_feed_post_user_id();
      ```
    - RLS Policies:
      ```sql
      -- Enable RLS
      ALTER TABLE social_feed_posts ENABLE ROW LEVEL SECURITY;
      
      -- Create policies
      CREATE POLICY "deny_anon_access" ON public.social_feed_posts
      FOR ALL TO anon
      USING (false);
      
      CREATE POLICY "allow_auth_select" ON public.social_feed_posts
      FOR SELECT TO authenticated
      USING (true);
      
      CREATE POLICY "allow_auth_insert" ON public.social_feed_posts
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "allow_auth_update" ON public.social_feed_posts
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "allow_auth_delete" ON public.social_feed_posts
      FOR DELETE TO authenticated
      USING (auth.uid() = user_id);
      ```
  - ✅ Push Tokens table policies
    - ✅ Тесты написаны
    - ✅ SQL скрипт выполнен
    - ✅ Тесты пройдены успешно
    - ✅ Проверено:
      - Анонимные пользователи не могут читать/создавать/обновлять/удалять записи
      - Аутентифицированные пользователи могут читать все записи
      - Аутентифицированные пользователи могут создавать новые записи
      - Аутентифицированные пользователи могут обновлять/удалять только свои записи
      - Поле user_id заполняется автоматически при создании записи
      - Каскадное удаление при удалении app_user работает
    - Required Schema Changes:
      ```sql
      -- Add required columns
      ALTER TABLE push_tokens 
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
      ADD COLUMN IF NOT EXISTS app_user_id UUID;
      
      -- Create trigger function for auto-filling user_id
      CREATE OR REPLACE FUNCTION public.set_push_token_user_id()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.user_id = auth.uid();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      DROP TRIGGER IF EXISTS set_push_tokens_user_id ON push_tokens;
      CREATE TRIGGER set_push_tokens_user_id
        BEFORE INSERT ON push_tokens
        FOR EACH ROW
        EXECUTE FUNCTION public.set_push_token_user_id();
      ```
    - RLS Policies:
      ```sql
      -- Enable RLS
      ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies
      DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.push_tokens;
      DROP POLICY IF EXISTS "Enable insert access for authenticated users only" ON public.push_tokens;
      DROP POLICY IF EXISTS "Enable update access for users based on user_id" ON public.push_tokens;
      DROP POLICY IF EXISTS "Enable delete access for users based on user_id" ON public.push_tokens;
      DROP POLICY IF EXISTS "Deny access for anonymous users" ON public.push_tokens;
      
      -- Create policies
      CREATE POLICY "Enable read access for authenticated users" ON public.push_tokens
      FOR SELECT TO authenticated USING (true);
      
      CREATE POLICY "Enable insert access for authenticated users only" ON public.push_tokens
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Enable update access for users based on user_id" ON public.push_tokens
      FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Enable delete access for users based on user_id" ON public.push_tokens
      FOR DELETE TO authenticated USING (auth.uid() = user_id);
      
      -- Deny access for anonymous users
      CREATE POLICY "Deny access for anonymous users" ON public.push_tokens
      FOR ALL TO anon USING (false);
      
      -- Add foreign key constraint to app_users
      ALTER TABLE push_tokens 
      DROP CONSTRAINT IF EXISTS push_tokens_app_user_id_fkey,
      ADD CONSTRAINT push_tokens_app_user_id_fkey 
        FOREIGN KEY (app_user_id) 
        REFERENCES app_users(id) 
        ON DELETE CASCADE;
      ```
  - ✅ Notification History table policies
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
      ALTER TABLE notification_history 
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
      
      -- Create trigger function for auto-filling user_id
      CREATE OR REPLACE FUNCTION public.set_notification_history_user_id()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.user_id = auth.uid();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      DROP TRIGGER IF EXISTS set_notification_history_user_id ON notification_history;
      CREATE TRIGGER set_notification_history_user_id
        BEFORE INSERT ON notification_history
        FOR EACH ROW
        EXECUTE FUNCTION public.set_notification_history_user_id();
      ```
    - RLS Policies:
      ```sql
      -- Enable RLS
      ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies
      DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.notification_history;
      DROP POLICY IF EXISTS "Enable insert access for authenticated users only" ON public.notification_history;
      DROP POLICY IF EXISTS "Enable update access for users based on user_id" ON public.notification_history;
      DROP POLICY IF EXISTS "Enable delete access for users based on user_id" ON public.notification_history;
      DROP POLICY IF EXISTS "Deny access for anonymous users" ON public.notification_history;
      
      -- Create policies
      CREATE POLICY "Enable read access for authenticated users" ON public.notification_history
      FOR SELECT TO authenticated USING (true);
      
      CREATE POLICY "Enable insert access for authenticated users only" ON public.notification_history
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Enable update access for users based on user_id" ON public.notification_history
      FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Enable delete access for users based on user_id" ON public.notification_history
      FOR DELETE TO authenticated USING (auth.uid() = user_id);
      
      -- Deny access for anonymous users
      CREATE POLICY "Deny access for anonymous users" ON public.notification_history
      FOR ALL TO anon USING (false);
      ```
  - ✅ App Users table policies
    - ✅ Тесты написаны
    - ✅ SQL скрипт выполнен
    - ✅ Тесты пройдены успешно
    - ✅ Проверено:
      - Анонимные пользователи не могут читать/создавать/обновлять/удалять записи
      - Аутентифицированные пользователи могут читать все записи
      - Аутентифицированные пользователи могут создавать новые записи
      - Аутентифицированные пользователи могут обновлять/удалять только свои записи
      - Поле user_id заполняется автоматически при создании записи
      - Связь с auth.users работает корректно
    - Required Schema Changes:
      ```sql
      -- Add user_id column
      ALTER TABLE app_users 
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
      
      -- Create trigger function for auto-filling user_id
      CREATE OR REPLACE FUNCTION public.set_app_user_user_id()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.user_id = auth.uid();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      DROP TRIGGER IF EXISTS set_app_users_user_id ON app_users;
      CREATE TRIGGER set_app_users_user_id
        BEFORE INSERT ON app_users
        FOR EACH ROW
        EXECUTE FUNCTION public.set_app_user_user_id();
      ```
    - RLS Policies:
      ```sql
      -- Enable RLS
      ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies
      DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.app_users;
      DROP POLICY IF EXISTS "Enable insert access for authenticated users only" ON public.app_users;
      DROP POLICY IF EXISTS "Enable update access for users based on user_id" ON public.app_users;
      DROP POLICY IF EXISTS "Enable delete access for users based on user_id" ON public.app_users;
      DROP POLICY IF EXISTS "Deny access for anonymous users" ON public.app_users;
      
      -- Create policies
      CREATE POLICY "Enable read access for authenticated users" ON public.app_users
      FOR SELECT TO authenticated USING (true);
      
      CREATE POLICY "Enable insert access for authenticated users only" ON public.app_users
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Enable update access for users based on user_id" ON public.app_users
      FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Enable delete access for users based on user_id" ON public.app_users
      FOR DELETE TO authenticated USING (auth.uid() = user_id);
      
      -- Deny access for anonymous users
      CREATE POLICY "Deny access for anonymous users" ON public.app_users
      FOR ALL TO anon USING (false);
      ```
  - ✅ JSON Versions table policies
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
      -- Включаем RLS
      ALTER TABLE public.json_versions ENABLE ROW LEVEL SECURITY;

      -- Удаляем существующие политики
      DROP POLICY IF EXISTS "Allow auth insert" ON public.json_versions;
      DROP POLICY IF EXISTS "Allow public read access" ON public.json_versions;
      DROP POLICY IF EXISTS "Deny access for anonymous users" ON public.json_versions;
      DROP POLICY IF EXISTS "Enable delete access for users based on user_id" ON public.json_versions;
      DROP POLICY IF EXISTS "Enable insert access for authenticated users only" ON public.json_versions;
      DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.json_versions;
      DROP POLICY IF EXISTS "Enable update access for users based on user_id" ON public.json_versions;

      -- Создаем новые политики
      -- Запрещаем доступ для анонимных пользователей
      CREATE POLICY "deny_anon_access" ON public.json_versions
      FOR ALL TO anon
      USING (false);

      -- Разрешаем чтение для аутентифицированных пользователей
      CREATE POLICY "allow_auth_select" ON public.json_versions
      FOR SELECT TO authenticated
      USING (true);

      -- Разрешаем создание записей аутентифицированным пользователям
      CREATE POLICY "allow_auth_insert" ON public.json_versions
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);

      -- Разрешаем обновление своих записей
      CREATE POLICY "allow_auth_update" ON public.json_versions
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

      -- Разрешаем удаление своих записей
      CREATE POLICY "allow_auth_delete" ON public.json_versions
      FOR DELETE TO authenticated
      USING (auth.uid() = user_id);

      -- Создаем триггер для автозаполнения user_id
      CREATE OR REPLACE FUNCTION public.set_json_version_user_id()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.user_id = auth.uid();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Создаем триггер
      DROP TRIGGER IF EXISTS set_json_versions_user_id ON json_versions;
      CREATE TRIGGER set_json_versions_user_id
        BEFORE INSERT ON json_versions
        FOR EACH ROW
        EXECUTE FUNCTION public.set_json_version_user_id();
      ```
  - ✅ Locations table policies
    - ✅ Тесты написаны
    - ✅ SQL скрипт выполнен
    - ✅ Тесты пройдены успешно
    - Required Schema Changes:
      ```sql
      -- Enable RLS
      ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies
      DROP POLICY IF EXISTS "deny_anon_access" ON locations;
      DROP POLICY IF EXISTS "allow_auth_access" ON locations;
      
      -- Create new policies following standard pattern
      CREATE POLICY "deny_anon_access" ON locations FOR ALL TO anon USING (false);
      CREATE POLICY "allow_auth_access" ON locations FOR ALL TO authenticated USING (true);
      ```
    - RLS Policies:
      ```sql
      -- Enable RLS
      ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies
      DROP POLICY IF EXISTS "deny_anon_access" ON locations;
      DROP POLICY IF EXISTS "allow_auth_access" ON locations;
      
      -- Create new policies following standard pattern
      CREATE POLICY "deny_anon_access" ON locations FOR ALL TO anon USING (false);
      CREATE POLICY "allow_auth_access" ON locations FOR ALL TO authenticated USING (true);
      ```
  - ✅ Resources table policies
    - ✅ Тесты написаны
    - ✅ SQL скрипт выполнен
    - ✅ Тесты пройдены успешно
    - Required Schema Changes:
      ```sql
      -- Enable RLS
      ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies
      DROP POLICY IF EXISTS "deny_anon_access" ON resources;
      DROP POLICY IF EXISTS "allow_auth_access" ON resources;
      
      -- Create new policies following standard pattern
      CREATE POLICY "deny_anon_access" ON resources FOR ALL TO anon USING (false);
      CREATE POLICY "allow_auth_access" ON resources FOR ALL TO authenticated USING (true);
      ```
    - RLS Policies:
      ```sql
      -- Enable RLS
      ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies
      DROP POLICY IF EXISTS "deny_anon_access" ON resources;
      DROP POLICY IF EXISTS "allow_auth_access" ON resources;
      
      -- Create new policies following standard pattern
      CREATE POLICY "deny_anon_access" ON resources FOR ALL TO anon USING (false);
      CREATE POLICY "allow_auth_access" ON resources FOR ALL TO authenticated USING (true);
      ```
  - ✅ Special Cases RLS Policies
    - ✅ app_user_settings table policies
      - Single policy allowing all operations for all users (public)
      ```sql
      -- Enable RLS
      ALTER TABLE app_user_settings ENABLE ROW LEVEL SECURITY;
      
      -- Create public access policy
      CREATE POLICY "app_user_settings_policy" ON app_user_settings
      FOR ALL TO public USING (true);
      ```
    
    - ✅ debug_logs table policies
      - Single policy allowing all operations for authenticated users
      ```sql
      -- Enable RLS
      ALTER TABLE debug_logs ENABLE ROW LEVEL SECURITY;
      
      -- Create authenticated access policy
      CREATE POLICY "debug_logs_auth_policy" ON debug_logs
      FOR ALL TO authenticated USING (true);
      ```
    
    - ✅ deletions_log table policies
      - Allows anonymous inserts
      - Allows public read access
      ```sql
      -- Enable RLS
      ALTER TABLE deletions_log ENABLE ROW LEVEL SECURITY;
      
      -- Create public read policy
      CREATE POLICY "allow_public_read" ON deletions_log
      FOR SELECT TO public USING (true);
      
      -- Create anonymous insert policy
      CREATE POLICY "allow_anon_insert" ON deletions_log
      FOR INSERT TO anon WITH CHECK (true);
      ```

## Отложенные тесты для будущей реализации

### Таблица social_feed_posts
- ⏳ Тесты на проверку доступа для разных ролей пользователей
- ⏳ Тесты на проверку ограничений доступа к записям других пользователей
- ⏳ Тесты на проверку автоматического заполнения user_id
- ⏳ Тесты на каскадное удаление связанных записей

### Таблица announcements
- ⏳ Тесты на проверку доступа для разных ролей пользователей
- ⏳ Тесты на проверку связей с таблицей people
- ⏳ Тесты на проверку валидации данных
- ⏳ Тесты на проверку каскадного удаления

### Таблица event_people
- ⏳ Тесты на проверку создания связей между событиями и людьми
- ⏳ Тесты на проверку каскадного удаления при удалении события
- ⏳ Тесты на проверку ограничения удаления людей с активными событиями
- ⏳ Тесты на проверку валидации данных и внешних ключей
- ⏳ Тесты на проверку уникальности комбинации event_id и person_id
- ⏳ Тесты на проверку корректности роли (speaker)

### Таблица people
- ⏳ Тесты на проверку ограничений удаления при наличии связанных событий
- ⏳ Тесты на проверку каскадного удаления связанных данных
- ⏳ Тесты на проверку валидации полей (email, mobile, role)
- ⏳ Тесты на проверку уникальности имени в рамках роли

### Общие задачи по тестированию
- ⏳ Реализация тестов для проверки конкурентного доступа
- ⏳ Тесты производительности для больших наборов данных
- ⏳ Тесты на проверку индексов и оптимизацию запросов
- ⏳ Тесты на проверку миграций и обновлений схемы