--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.13 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: pg_net; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA public;


--
-- Name: EXTENSION pg_net; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_net IS 'Async HTTP';


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: pgsodium; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgsodium;


--
-- Name: pgsodium; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgsodium WITH SCHEMA pgsodium;


--
-- Name: EXTENSION pgsodium; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgsodium IS 'Pgsodium is a modern cryptography library for Postgres.';


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA supabase_migrations;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: pgjwt; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgjwt WITH SCHEMA extensions;


--
-- Name: EXTENSION pgjwt; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgjwt IS 'JSON Web Token API for Postgresql';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
begin
    raise debug 'PgBouncer auth request: %', p_usename;

    return query
    select 
        rolname::text, 
        case when rolvaliduntil < now() 
            then null 
            else rolpassword::text 
        end 
    from pg_authid 
    where rolname=$1 and rolcanlogin;
end;
$_$;


--
-- Name: check_app_settings_access(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_app_settings_access() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    request_device_id text;
    device_user_id uuid;
    log_id uuid;
BEGIN
    -- Для аутентифицированных пользователей всегда разрешаем
    IF auth.uid() IS NOT NULL THEN
        RETURN true;
    END IF;

    -- Получаем device_id из заголовков
    request_device_id := COALESCE(current_setting('request.headers', true)::jsonb->>'device-id', '');
    
    -- Логируем запрос
    INSERT INTO debug_logs (headers, device_id)
    VALUES (
        current_setting('request.headers', true)::jsonb,
        request_device_id
    )
    RETURNING id INTO log_id;

    -- Проверяем существование device_id в app_users
    SELECT id INTO device_user_id
    FROM app_users
    WHERE device_id = request_device_id;

    -- Обновляем лог с результатом
    IF device_user_id IS NOT NULL THEN
        UPDATE debug_logs 
        SET headers = jsonb_set(headers, '{found_user_id}', to_jsonb(device_user_id::text))
        WHERE id = log_id;
        RETURN true;
    ELSE
        UPDATE debug_logs 
        SET headers = jsonb_set(headers, '{error}', '"Device ID not found"'::jsonb)
        WHERE id = log_id;
        RETURN false;
    END IF;
END;
$$;


--
-- Name: check_device_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_device_id() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    request_device_id text;
    request_headers jsonb;
    request_claims jsonb;
    log_id uuid;
BEGIN
    -- Получаем заголовки и claims
    request_headers := NULLIF(current_setting('request.headers', true), '')::jsonb;
    request_claims := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb;
    request_device_id := COALESCE(request_headers->>'device-id', '');
    
    -- Логируем информацию о запросе
    INSERT INTO debug_logs (headers, jwt_claims, device_id)
    VALUES (
        request_headers,
        request_claims,
        request_device_id
    )
    RETURNING id INTO log_id;

    -- Проверяем существование device_id в app_users
    RETURN EXISTS (
        SELECT 1 
        FROM app_users 
        WHERE device_id = request_device_id
    );
END;
$$;


--
-- Name: check_device_id(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_device_id(check_id text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Логируем информацию
    INSERT INTO debug_logs (headers, jwt_claims, device_id)
    VALUES (
        current_setting('request.headers', true),
        current_setting('request.jwt.claims', true),
        check_id
    );
    
    -- Проверяем доступ
    RETURN EXISTS (
        SELECT 1 FROM app_users 
        WHERE device_id = check_id
    );
END;
$$;


--
-- Name: cleanup_inactive_tokens(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_inactive_tokens(days_threshold integer DEFAULT 30) RETURNS integer
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH inactive_tokens AS (
        DELETE FROM push_tokens
        WHERE last_used_at < NOW() - (days_threshold * INTERVAL '1 day')
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM inactive_tokens;
    
    RETURN deleted_count;
END;
$$;


--
-- Name: deactivate_old_token_for_device(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.deactivate_old_token_for_device() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    -- Деактивируем старые токены для того же устройства
    UPDATE push_tokens
    SET is_active = false
    WHERE user_id = NEW.user_id
    AND id != NEW.id
    AND is_active = true;
    
    RETURN NEW;
END;
$$;


--
-- Name: get_app_data_url(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_app_data_url() RETURNS text
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    RETURN 'https://iabwkgppahudnaouwaep.supabase.co/storage/v1/object/public/app-data/app-data.json';
END;
$$;


--
-- Name: get_changes_since_last_version(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_changes_since_last_version() RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$DECLARE
   last_version_time timestamp with time zone;
   changes jsonb;
BEGIN
   -- Get time of last version
   SELECT published_at INTO last_version_time
   FROM json_versions
   ORDER BY published_at DESC
   LIMIT 1;

   -- If no versions yet, use earliest possible date
   IF last_version_time IS NULL THEN
       last_version_time := '1970-01-01 00:00:00+00'::timestamp with time zone;
   END IF;

   -- Build result counting both changes in tables and deletions
   WITH changes_counts AS (
       SELECT 
           (SELECT COUNT(*) FROM (
               SELECT id FROM events WHERE created_at > last_version_time OR updated_at > last_version_time
               UNION
               SELECT record_id FROM deletions_log WHERE table_name = 'events' AND deleted_at > last_version_time
           ) e) as events_count,
           
           (SELECT COUNT(*) FROM (
               SELECT id FROM people WHERE created_at > last_version_time OR updated_at > last_version_time
               UNION
               SELECT record_id FROM deletions_log WHERE table_name = 'people' AND deleted_at > last_version_time
           ) p) as people_count,
           
           (SELECT COUNT(*) FROM (
               SELECT id FROM locations WHERE created_at > last_version_time OR updated_at > last_version_time
               UNION
               SELECT record_id FROM deletions_log WHERE table_name = 'locations' AND deleted_at > last_version_time
           ) l) as locations_count,
           
           (SELECT COUNT(*) FROM (
               SELECT id FROM sections WHERE created_at > last_version_time OR updated_at > last_version_time
               UNION
               SELECT record_id FROM deletions_log WHERE table_name = 'sections' AND deleted_at > last_version_time
           ) s) as sections_count,
           
           (SELECT COUNT(*) FROM (
               SELECT id FROM resources WHERE created_at > last_version_time OR updated_at > last_version_time
               UNION
               SELECT record_id FROM deletions_log WHERE table_name = 'resources' AND deleted_at > last_version_time
           ) r) as resources_count,
           
           (SELECT COUNT(*) FROM (
               SELECT id FROM social_feed_posts WHERE created_at > last_version_time OR updated_at > last_version_time
               UNION
               SELECT record_id FROM deletions_log WHERE table_name = 'social_feed_posts' AND deleted_at > last_version_time
           ) sp) as social_posts_count,
           
           (SELECT COUNT(*) FROM (
               SELECT id FROM announcements WHERE created_at > last_version_time OR published_at > last_version_time
               UNION
               SELECT record_id FROM deletions_log WHERE table_name = 'announcements' AND deleted_at > last_version_time
           ) a) as announcements_count,
           
           (SELECT COUNT(*) FROM (
               SELECT id FROM markdown_pages WHERE created_at > last_version_time OR updated_at > last_version_time
               UNION
               SELECT record_id FROM deletions_log WHERE table_name = 'markdown_pages' AND deleted_at > last_version_time
           ) mp) as markdown_pages_count
   )
   SELECT jsonb_build_object(
       'events', COALESCE(events_count, 0),
       'people', COALESCE(people_count, 0),
       'locations', COALESCE(locations_count, 0),
       'sections', COALESCE(sections_count, 0),
       'resources', COALESCE(resources_count, 0),
       'social_posts', COALESCE(social_posts_count, 0),
       'announcements', COALESCE(announcements_count, 0),
       'markdown_pages', COALESCE(markdown_pages_count, 0)
   ) INTO changes
   FROM changes_counts;

   RETURN changes;
END;$$;


--
-- Name: get_device_user_id(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_device_user_id(device_id text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    found_user_id uuid;
BEGIN
    SELECT id INTO found_user_id
    FROM app_users
    WHERE app_users.device_id = device_id;
    RETURN found_user_id;
END;
$$;


--
-- Name: get_events_with_related(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_events_with_related() RETURNS jsonb
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(event_data ORDER BY event_data.start_time)
        FROM (
            SELECT 
                e.id,
                e.title,
                e.description,
                e.start_time,
                e.end_time,
                e.date,
                e.duration,
                e.section,
                e.section_id,
                e.location_id,
                jsonb_build_object(
                    'id', l.id,
                    'name', l.name,
                    'link_map', l.link_map,
                    'link', l.link,
                    'link_address', l.link_address
                ) as location,
                (
                    SELECT jsonb_agg(ep_data)
                    FROM (
                        SELECT 
                            ep.role,
                            row_to_json(p)::jsonb as person
                        FROM event_people ep
                        JOIN people p ON p.id = ep.person_id
                        WHERE ep.event_id = e.id
                    ) ep_data
                ) as event_people
            FROM events e
            LEFT JOIN locations l ON l.id = e.location_id
        ) event_data
    );
END;
$$;


--
-- Name: get_full_json_data(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_full_json_data(version_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  version_record RECORD;
  full_json jsonb;
BEGIN
  -- Get version info
  SELECT * INTO version_record
  FROM json_versions
  WHERE id = version_id;
  
  IF version_record IS NULL THEN
    RAISE EXCEPTION 'Version not found: %', version_id;
  END IF;

  -- Generate full JSON with all data (similar to publish_new_version)
  WITH 
  ordered_people AS (
    SELECT row_to_json(p)::jsonb as data 
    FROM people p 
    ORDER BY p.name
  ),
  ordered_locations AS (
    SELECT row_to_json(l)::jsonb as data 
    FROM locations l 
    ORDER BY l.name
  ),
  ordered_sections AS (
    SELECT row_to_json(s)::jsonb as data 
    FROM sections s 
    ORDER BY s.date
  ),
  ordered_resources AS (
    SELECT row_to_json(r)::jsonb as data 
    FROM resources r 
    ORDER BY r.name
  ),
  ordered_announcements AS (
    SELECT row_to_json(a)::jsonb as data 
    FROM announcements a 
    ORDER BY a.published_at DESC 
    LIMIT 10
  ),
  ordered_social_posts AS (
    SELECT row_to_json(sp)::jsonb as data 
    FROM social_feed_posts sp 
    ORDER BY sp.timestamp DESC 
    LIMIT 20
  ),
  ordered_markdown_pages AS (
    SELECT row_to_json(mp)::jsonb as data 
    FROM markdown_pages mp 
    ORDER BY mp.updated_at DESC
  ),
  ordered_notifications AS (
    SELECT jsonb_build_object(
      'id', nh.id,
      'title', nh.title,
      'text', nh.body,
      'datetime', nh.sent_at,
      'data', nh.data,
      'target_type', nh.target_type,
      'target_users', nh.target_users,
      'tokens', (
        SELECT jsonb_agg(aus.push_token)
        FROM app_user_settings aus
        WHERE 
          CASE 
            WHEN nh.target_type = 'all' THEN true
            WHEN nh.target_type = 'specific_users' THEN aus.id = ANY(nh.target_users)
            ELSE false
          END
          AND aus.push_token IS NOT NULL
      )
    ) as data
    FROM notification_history nh
    ORDER BY nh.sent_at DESC
    LIMIT 50
  )
  SELECT jsonb_build_object(
    'metadata', jsonb_build_object(
      'version', version_record.version,
      'publishedAt', version_record.published_at,
      'changes', version_record.changes
    ),
    'data', jsonb_build_object(
      'events', get_events_with_related(),
      'people', (SELECT jsonb_agg(data) FROM ordered_people),
      'locations', (SELECT jsonb_agg(data) FROM ordered_locations),
      'sections', (SELECT jsonb_agg(data) FROM ordered_sections),
      'resources', (SELECT jsonb_agg(data) FROM ordered_resources),
      'announcements', (SELECT jsonb_agg(data) FROM ordered_announcements),
      'social_posts', (SELECT jsonb_agg(data) FROM ordered_social_posts),
      'markdown_pages', (SELECT jsonb_agg(data) FROM ordered_markdown_pages),
      'notifications', (SELECT jsonb_agg(data) FROM ordered_notifications)
    )
  ) INTO full_json;

  RETURN full_json;
END;
$$;


--
-- Name: get_push_statistics(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_push_statistics() RETURNS TABLE(total_users bigint, active_users bigint, total_tokens bigint, active_tokens bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::bigint as total_users,
        COUNT(CASE 
            WHEN (settings->>'last_active_at')::timestamp > NOW() - INTERVAL '30 days' 
            THEN 1 
        END)::bigint as active_users,
        COUNT(CASE 
            WHEN push_token IS NOT NULL 
            THEN 1 
        END)::bigint as total_tokens,
        COUNT(CASE 
            WHEN push_token IS NOT NULL 
            AND (settings->>'is_push_enabled')::boolean = true 
            THEN 1 
        END)::bigint as active_tokens
    FROM app_user_settings;
END;
$$;


--
-- Name: log_deletion(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_deletion() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
   INSERT INTO deletions_log (id, table_name, record_id, deleted_at)
   VALUES (
      gen_random_uuid(), -- генерируем UUID для id
      TG_TABLE_NAME,
      OLD.id,
      CURRENT_TIMESTAMP
   );
   RETURN OLD;
END;
$$;


--
-- Name: publish_new_version(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.publish_new_version() RETURNS jsonb
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
   next_version integer;
   changes jsonb;
   new_version_id uuid;
   full_json jsonb;
   file_url text;
BEGIN
   -- Get next version number
   SELECT COALESCE(MAX(CAST(version AS integer)), 0) + 1 INTO next_version
   FROM json_versions;

   -- Get file URL
   SELECT get_app_data_url() INTO file_url;

   -- Get changes
   SELECT get_changes_since_last_version()::jsonb INTO changes;

   -- Generate full JSON with all data
   WITH 
   ordered_people AS (
       SELECT row_to_json(p)::jsonb as data 
       FROM people p 
       ORDER BY p.name
   ),
   ordered_locations AS (
       SELECT row_to_json(l)::jsonb as data 
       FROM locations l 
       ORDER BY l.name
   ),
   ordered_sections AS (
       SELECT row_to_json(s)::jsonb as data 
       FROM sections s 
       ORDER BY s.date
   ),
   ordered_resources AS (
       SELECT row_to_json(r)::jsonb as data 
       FROM resources r 
       ORDER BY r.name
   ),
   ordered_announcements AS (
       SELECT row_to_json(a)::jsonb as data 
       FROM announcements a 
       ORDER BY a.published_at DESC 
       LIMIT 10
   ),
   ordered_social_posts AS (
       SELECT row_to_json(sp)::jsonb as data 
       FROM social_feed_posts sp 
       ORDER BY sp.timestamp DESC 
       LIMIT 20
   ),
   ordered_markdown_pages AS (
       SELECT row_to_json(mp)::jsonb as data 
       FROM markdown_pages mp 
       ORDER BY mp.updated_at DESC
   ),
   ordered_notifications AS (
       SELECT jsonb_build_object(
           'id', nh.id,
           'title', nh.title,
           'text', nh.body,
           'datetime', nh.sent_at,
           'data', nh.data,
           'target_type', nh.target_type,
           'target_users', nh.target_users,
           'tokens', (
               SELECT jsonb_agg(aus.push_token)
               FROM app_user_settings aus
               WHERE 
                 CASE 
                   WHEN nh.target_type = 'all' THEN true
                   WHEN nh.target_type = 'specific_users' THEN aus.id = ANY(nh.target_users)
                   ELSE false
                 END
                 AND aus.push_token IS NOT NULL
           )
       ) as data
       FROM notification_history nh
       ORDER BY nh.sent_at DESC
       LIMIT 50
   )
   SELECT jsonb_build_object(
       'metadata', jsonb_build_object(
           'version', next_version,
           'publishedAt', now(),
           'changes', changes
       ),
       'data', jsonb_build_object(
           'events', get_events_with_related(),
           'people', (SELECT jsonb_agg(data) FROM ordered_people),
           'locations', (SELECT jsonb_agg(data) FROM ordered_locations),
           'sections', (SELECT jsonb_agg(data) FROM ordered_sections),
           'resources', (SELECT jsonb_agg(data) FROM ordered_resources),
           'announcements', (SELECT jsonb_agg(data) FROM ordered_announcements),
           'social_posts', (SELECT jsonb_agg(data) FROM ordered_social_posts),
           'markdown_pages', (SELECT jsonb_agg(data) FROM ordered_markdown_pages),
           'notifications', (SELECT jsonb_agg(data) FROM ordered_notifications)
       )
   ) INTO full_json;

   -- Create version record with URL
   INSERT INTO json_versions (
       version,
       changes,
       file_path,
       file_url
   ) VALUES (
       next_version::text,
       changes,
       'app-data.json',
       file_url
   )
   RETURNING id INTO new_version_id;

   RETURN jsonb_build_object(
       'version', next_version,
       'id', new_version_id,
       'file_url', file_url,
       'changes', changes,
       'data', full_json
   );
END;
$$;


--
-- Name: publish_new_version_from(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.publish_new_version_from(source_version_id uuid) RETURNS jsonb
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
    source_version json_versions;
    new_version_id uuid;
BEGIN
    -- Get source version
    SELECT * INTO source_version
    FROM json_versions
    WHERE id = source_version_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Version not found';
    END IF;

    -- Create new version from source
    INSERT INTO json_versions (
        version,
        changes,
        file_path,
        file_url
    ) VALUES (
        (SELECT COALESCE(MAX(CAST(version AS integer)), 0) + 1 FROM json_versions)::text,
        source_version.changes,
        source_version.file_path,
        source_version.file_url
    )
    RETURNING id INTO new_version_id;

    RETURN jsonb_build_object(
        'id', new_version_id,
        'source_version', source_version.version
    );
END;
$$;


--
-- Name: send_push_notification(text, text, jsonb, text, uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.send_push_notification(p_title text, p_body text, p_data jsonb DEFAULT '{}'::jsonb, p_target_type text DEFAULT 'all'::text, p_target_users uuid[] DEFAULT '{}'::uuid[]) RETURNS bigint
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    notification_id BIGINT;
BEGIN
    -- Создаем запись в истории
    INSERT INTO notification_history 
        (title, body, data, target_type, target_users, sent_by)
    VALUES 
        (p_title, p_body, p_data, p_target_type, p_target_users, auth.uid())
    RETURNING id INTO notification_id;
    
    -- В будущем здесь будет интеграция с Expo Push API
    
    RETURN notification_id;
END;
$$;


--
-- Name: send_push_notifications(text, text, jsonb, text, text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.send_push_notifications(title text, body text, data jsonb DEFAULT '{}'::jsonb, target_type text DEFAULT 'all'::text, target_device_ids text[] DEFAULT NULL::text[]) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    sent_count integer := 0;
    failed_count integer := 0;
    result jsonb;
BEGIN
    -- Создаем временную таблицу для результатов
    CREATE TEMP TABLE push_results (
        device_id text,
        push_token text,
        success boolean,
        error text
    );

    -- Получаем все активные push токены
    FOR result IN 
        SELECT device_id, push_token, settings 
        FROM app_user_settings 
        WHERE push_token IS NOT NULL 
        AND (
            target_type = 'all' 
            OR (
                target_type = 'specific' 
                AND device_id = ANY(target_device_ids)
            )
        )
        AND (settings->>'announcements')::boolean = true
    LOOP
        BEGIN
            -- Здесь будет реальная отправка пуша
            -- PERFORM send_push(result.push_token, title, body, data);
            
            -- Записываем успешный результат
            INSERT INTO push_results (device_id, push_token, success)
            VALUES (result.device_id, result.push_token, true);
            
            sent_count := sent_count + 1;
        EXCEPTION WHEN OTHERS THEN
            -- Записываем ошибку
            INSERT INTO push_results (device_id, push_token, success, error)
            VALUES (result.device_id, result.push_token, false, SQLERRM);
            
            failed_count := failed_count + 1;
        END;
    END LOOP;

    -- Формируем результат
    SELECT jsonb_build_object(
        'sent_count', sent_count,
        'failed_count', failed_count,
        'results', jsonb_agg(
            jsonb_build_object(
                'device_id', device_id,
                'success', success,
                'error', error
            )
        )
    ) INTO result
    FROM push_results;

    -- Очищаем временную таблицу
    DROP TABLE push_results;

    -- Логируем отправку
    INSERT INTO notification_history (
        title,
        body,
        data,
        target_type,
        sent_by,
        success_count,
        failure_count,
        sent_at
    ) VALUES (
        title,
        body,
        data,
        target_type,
        auth.uid(),
        sent_count,
        failed_count,
        now()
    );

    RETURN result;
END;
$$;


--
-- Name: set_app_settings_user_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_app_settings_user_id() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    device_user_id uuid;
    request_device_id text;
BEGIN
    -- Если user_id уже установлен и валиден, не меняем его
    IF NEW.user_id IS NOT NULL THEN
        -- Проверяем, что user_id существует в app_users
        IF EXISTS (
            SELECT 1 FROM app_users WHERE id = NEW.user_id
        ) THEN
            RETURN NEW;
        END IF;
    END IF;

    -- Для аутентифицированных пользователей используем auth.uid()
    IF auth.uid() IS NOT NULL THEN
        NEW.user_id := auth.uid();
        RETURN NEW;
    END IF;

    -- Для анонимных пользователей берем user_id из app_users по device_id
    request_device_id := COALESCE(current_setting('request.headers', true)::jsonb->>'device-id', '');
    
    SELECT id INTO device_user_id
    FROM app_users
    WHERE device_id = request_device_id;

    IF device_user_id IS NOT NULL THEN
        NEW.user_id := device_user_id;
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Could not determine user_id';
END;
$$;


--
-- Name: set_device_id(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_device_id(device_id text) RETURNS void
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    PERFORM set_config('request.device_id', device_id, false);
END;
$$;


--
-- Name: set_event_user_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_event_user_id() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$;


--
-- Name: set_push_token_user_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_push_token_user_id() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$;


--
-- Name: set_sections_user_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_sections_user_id() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$;


--
-- Name: set_social_feed_post_user_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_social_feed_post_user_id() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Устанавливаем user_id только если он не был указан
    IF NEW.user_id IS NULL THEN
        NEW.user_id = auth.uid();
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: update_last_active_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_last_active_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    NEW.last_active_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_profile_by_id(bigint, text, text, text, text, boolean, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_profile_by_id(user_id bigint, user_bio text, user_email text, user_mobile text, user_photo_url text, user_hidden boolean DEFAULT NULL::boolean, user_title text DEFAULT NULL::text, user_company text DEFAULT NULL::text, user_country text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  person_record RECORD;
  result JSONB;
  publish_result JSONB;
  profile_editing_enabled BOOLEAN;
BEGIN
  -- Check feature flag
  SELECT value INTO profile_editing_enabled
  FROM admin_settings
  WHERE feature = 'profile_editing_enabled'
  ORDER BY created_at DESC
  LIMIT 1;

  IF profile_editing_enabled IS DISTINCT FROM TRUE THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Profile editing is currently disabled by the administrator.',
      'data', NULL
    );
  END IF;

  -- Find person by ID
  SELECT * INTO person_record FROM people WHERE id = user_id;

  -- Check if person exists
  IF person_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Person not found',
      'data', NULL
    );
  END IF;

  -- Update the record
  UPDATE people
  SET 
    bio = COALESCE(user_bio, bio),
    email = COALESCE(user_email, email),
    mobile = COALESCE(user_mobile, mobile),
    photo_url = COALESCE(user_photo_url, photo_url),
    hidden = COALESCE(user_hidden, hidden),
    title = COALESCE(user_title, title),
    company = COALESCE(user_company, company),
    country = COALESCE(user_country, country),
    updated_at = NOW()
  WHERE id = user_id
  RETURNING * INTO person_record;

  -- Generate new version and mark it as not uploaded yet
  SELECT publish_new_version() INTO publish_result;

  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Profile updated successfully',
    'data', to_jsonb(person_record)
  );
END;
$$;


--
-- Name: update_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  BEGIN
    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (payload, event, topic, private, extension)
    VALUES (payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      PERFORM pg_notify(
          'realtime:system',
          jsonb_build_object(
              'error', SQLERRM,
              'function', 'realtime.send',
              'event', event,
              'topic', topic,
              'private', private
          )::text
      );
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
  v_order_by text;
  v_sort_order text;
begin
  case
    when sortcolumn = 'name' then
      v_order_by = 'name';
    when sortcolumn = 'updated_at' then
      v_order_by = 'updated_at';
    when sortcolumn = 'created_at' then
      v_order_by = 'created_at';
    when sortcolumn = 'last_accessed_at' then
      v_order_by = 'last_accessed_at';
    else
      v_order_by = 'name';
  end case;

  case
    when sortorder = 'asc' then
      v_sort_order = 'asc';
    when sortorder = 'desc' then
      v_sort_order = 'desc';
    else
      v_sort_order = 'asc';
  end case;

  v_order_by = v_order_by || ' ' || v_sort_order;

  return query execute
    'with folders as (
       select path_tokens[$1] as folder
       from storage.objects
         where objects.name ilike $2 || $3 || ''%''
           and bucket_id = $4
           and array_length(objects.path_tokens, 1) <> $1
       group by folder
       order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


--
-- Name: secrets_encrypt_secret_secret(); Type: FUNCTION; Schema: vault; Owner: -
--

CREATE FUNCTION vault.secrets_encrypt_secret_secret() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
		BEGIN
		        new.secret = CASE WHEN new.secret IS NULL THEN NULL ELSE
			CASE WHEN new.key_id IS NULL THEN NULL ELSE pg_catalog.encode(
			  pgsodium.crypto_aead_det_encrypt(
				pg_catalog.convert_to(new.secret, 'utf8'),
				pg_catalog.convert_to((new.id::text || new.description::text || new.created_at::text || new.updated_at::text)::text, 'utf8'),
				new.key_id::uuid,
				new.nonce
			  ),
				'base64') END END;
		RETURN new;
		END;
		$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: admin_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_settings (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    feature text NOT NULL,
    value boolean DEFAULT true NOT NULL
);


--
-- Name: TABLE admin_settings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.admin_settings IS 'Stores global feature flags for admin panel and mobile app.';


--
-- Name: COLUMN admin_settings.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.admin_settings.id IS 'Primary key.';


--
-- Name: COLUMN admin_settings.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.admin_settings.created_at IS 'Record creation timestamp.';


--
-- Name: COLUMN admin_settings.feature; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.admin_settings.feature IS 'Feature flag name (unique).';


--
-- Name: COLUMN admin_settings.value; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.admin_settings.value IS 'Boolean value of the feature flag.';


--
-- Name: admin_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.admin_settings ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.admin_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcements (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    person_id bigint NOT NULL,
    published_at timestamp with time zone NOT NULL,
    content text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.announcements FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE announcements; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.announcements IS 'Stores announcements published by admins for users.';


--
-- Name: COLUMN announcements.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.announcements.id IS 'Primary key.';


--
-- Name: COLUMN announcements.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.announcements.created_at IS 'Record creation timestamp.';


--
-- Name: COLUMN announcements.person_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.announcements.person_id IS 'ID of the person who created the announcement.';


--
-- Name: COLUMN announcements.published_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.announcements.published_at IS 'Timestamp when the announcement was published.';


--
-- Name: COLUMN announcements.content; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.announcements.content IS 'Announcement content (markdown or plain text).';


--
-- Name: COLUMN announcements.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.announcements.updated_at IS 'Record last update timestamp.';


--
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.announcements ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.announcements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: app_user_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_user_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    device_id text NOT NULL,
    device_info jsonb DEFAULT '{}'::jsonb NOT NULL,
    push_token text,
    settings jsonb DEFAULT '{"social_feed": true, "announcements": true}'::jsonb NOT NULL,
    last_active_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE app_user_settings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.app_user_settings IS 'Stores per-device user settings and push tokens.';


--
-- Name: COLUMN app_user_settings.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.app_user_settings.id IS 'Primary key (UUID).';


--
-- Name: COLUMN app_user_settings.device_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.app_user_settings.device_id IS 'Unique device identifier.';


--
-- Name: COLUMN app_user_settings.device_info; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.app_user_settings.device_info IS 'Device information (JSON).';


--
-- Name: COLUMN app_user_settings.push_token; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.app_user_settings.push_token IS 'Push notification token (nullable).';


--
-- Name: COLUMN app_user_settings.settings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.app_user_settings.settings IS 'User settings (JSON).';


--
-- Name: COLUMN app_user_settings.last_active_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.app_user_settings.last_active_at IS 'Last activity timestamp.';


--
-- Name: debug_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.debug_logs (
    id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    headers text,
    jwt_claims text,
    device_id text
);


--
-- Name: TABLE debug_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.debug_logs IS 'Stores debug logs for API requests and troubleshooting.';


--
-- Name: COLUMN debug_logs.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.debug_logs.id IS 'Primary key.';


--
-- Name: COLUMN debug_logs.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.debug_logs.created_at IS 'Log creation timestamp.';


--
-- Name: COLUMN debug_logs.headers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.debug_logs.headers IS 'Request headers (raw or JSON).';


--
-- Name: COLUMN debug_logs.jwt_claims; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.debug_logs.jwt_claims IS 'JWT claims (raw or JSON).';


--
-- Name: COLUMN debug_logs.device_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.debug_logs.device_id IS 'Device identifier (if available).';


--
-- Name: debug_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.debug_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: debug_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.debug_logs_id_seq OWNED BY public.debug_logs.id;


--
-- Name: deletions_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deletions_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    table_name text NOT NULL,
    record_id bigint NOT NULL,
    deleted_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE deletions_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.deletions_log IS 'Stores information about deleted records for audit.';


--
-- Name: COLUMN deletions_log.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.deletions_log.id IS 'Primary key (UUID).';


--
-- Name: COLUMN deletions_log.table_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.deletions_log.table_name IS 'Name of the table where the record was deleted.';


--
-- Name: COLUMN deletions_log.record_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.deletions_log.record_id IS 'ID of the deleted record.';


--
-- Name: COLUMN deletions_log.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.deletions_log.deleted_at IS 'Timestamp when the record was deleted.';


--
-- Name: event_people; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_people (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    event_id bigint NOT NULL,
    person_id bigint NOT NULL,
    role text DEFAULT 'speaker'::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.event_people FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE event_people; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.event_people IS 'Links people to events with specific roles (e.g., speaker).';


--
-- Name: COLUMN event_people.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_people.id IS 'Primary key.';


--
-- Name: COLUMN event_people.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_people.created_at IS 'Record creation timestamp.';


--
-- Name: COLUMN event_people.event_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_people.event_id IS 'Linked event ID.';


--
-- Name: COLUMN event_people.person_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_people.person_id IS 'Linked person ID.';


--
-- Name: COLUMN event_people.role; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_people.role IS 'Role of the person in the event (e.g., speaker).';


--
-- Name: COLUMN event_people.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.event_people.updated_at IS 'Record last update timestamp.';


--
-- Name: event_people_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.event_people ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.event_people_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    section text DEFAULT ''::text NOT NULL,
    date date NOT NULL,
    title text NOT NULL,
    description text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    duration text,
    location_id bigint,
    section_id bigint,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.events FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE events; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.events IS 'Stores events (talks, sessions, etc.) for the summit.';


--
-- Name: COLUMN events.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.events.id IS 'Primary key.';


--
-- Name: COLUMN events.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.events.created_at IS 'Record creation timestamp.';


--
-- Name: COLUMN events.section; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.events.section IS 'Section name (legacy, use section_id if possible).';


--
-- Name: COLUMN events.date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.events.date IS 'Event date.';


--
-- Name: COLUMN events.title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.events.title IS 'Event title.';


--
-- Name: COLUMN events.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.events.description IS 'Event description (nullable).';


--
-- Name: COLUMN events.start_time; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.events.start_time IS 'Event start timestamp.';


--
-- Name: COLUMN events.end_time; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.events.end_time IS 'Event end timestamp.';


--
-- Name: COLUMN events.duration; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.events.duration IS 'Event duration (nullable, text format).';


--
-- Name: COLUMN events.location_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.events.location_id IS 'Location ID (nullable).';


--
-- Name: COLUMN events.section_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.events.section_id IS 'Section ID (nullable, foreign key).';


--
-- Name: COLUMN events.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.events.updated_at IS 'Record last update timestamp.';


--
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.events ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: json_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.json_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    version character varying NOT NULL,
    published_at timestamp with time zone DEFAULT now(),
    published_by uuid,
    file_path text NOT NULL,
    changes jsonb NOT NULL,
    file_url text NOT NULL,
    uploaded_to_storage boolean DEFAULT false
);


--
-- Name: TABLE json_versions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.json_versions IS 'Stores versions of exported/imported JSON data.';


--
-- Name: COLUMN json_versions.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.json_versions.id IS 'Primary key (UUID).';


--
-- Name: COLUMN json_versions.version; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.json_versions.version IS 'Version string.';


--
-- Name: COLUMN json_versions.published_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.json_versions.published_at IS 'Timestamp when version was published.';


--
-- Name: COLUMN json_versions.published_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.json_versions.published_by IS 'User who published the version (UUID).';


--
-- Name: COLUMN json_versions.file_path; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.json_versions.file_path IS 'Path to the JSON file in storage.';


--
-- Name: COLUMN json_versions.changes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.json_versions.changes IS 'Description of changes (JSON).';


--
-- Name: COLUMN json_versions.file_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.json_versions.file_url IS 'Public URL to the JSON file.';


--
-- Name: COLUMN json_versions.uploaded_to_storage; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.json_versions.uploaded_to_storage IS 'Whether file is uploaded to storage.';


--
-- Name: locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.locations (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    link_map text,
    link text,
    link_address text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE locations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.locations IS 'Stores locations (rooms, venues) for events.';


--
-- Name: COLUMN locations.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.id IS 'Primary key.';


--
-- Name: COLUMN locations.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.created_at IS 'Record creation timestamp.';


--
-- Name: COLUMN locations.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.name IS 'Location name.';


--
-- Name: COLUMN locations.link_map; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.link_map IS 'Link to map (nullable).';


--
-- Name: COLUMN locations.link; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.link IS 'External link (nullable).';


--
-- Name: COLUMN locations.link_address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.link_address IS 'Address link (nullable).';


--
-- Name: COLUMN locations.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.locations.updated_at IS 'Record last update timestamp.';


--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.locations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.locations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: markdown_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.markdown_pages (
    id bigint NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    published boolean DEFAULT false NOT NULL
);


--
-- Name: TABLE markdown_pages; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.markdown_pages IS 'Stores static pages in markdown format.';


--
-- Name: COLUMN markdown_pages.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.markdown_pages.id IS 'Primary key.';


--
-- Name: COLUMN markdown_pages.slug; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.markdown_pages.slug IS 'Unique page slug.';


--
-- Name: COLUMN markdown_pages.title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.markdown_pages.title IS 'Page title.';


--
-- Name: COLUMN markdown_pages.content; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.markdown_pages.content IS 'Page content (markdown).';


--
-- Name: COLUMN markdown_pages.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.markdown_pages.created_at IS 'Record creation timestamp.';


--
-- Name: COLUMN markdown_pages.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.markdown_pages.updated_at IS 'Record last update timestamp.';


--
-- Name: COLUMN markdown_pages.published; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.markdown_pages.published IS 'Whether the page is published.';


--
-- Name: markdown_pages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.markdown_pages ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.markdown_pages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: notification_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_history (
    id bigint NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    sent_at timestamp with time zone DEFAULT now(),
    sent_by uuid,
    target_type text NOT NULL,
    target_users uuid[] DEFAULT '{}'::uuid[],
    success_count integer DEFAULT 0,
    failure_count integer DEFAULT 0,
    CONSTRAINT notification_history_target_type_check CHECK ((target_type = ANY (ARRAY['all'::text, 'specific_users'::text])))
);


--
-- Name: TABLE notification_history; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.notification_history IS 'Stores history of sent push notifications.';


--
-- Name: COLUMN notification_history.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notification_history.id IS 'Primary key.';


--
-- Name: COLUMN notification_history.title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notification_history.title IS 'Notification title.';


--
-- Name: COLUMN notification_history.body; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notification_history.body IS 'Notification body.';


--
-- Name: COLUMN notification_history.data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notification_history.data IS 'Notification payload (JSON).';


--
-- Name: COLUMN notification_history.sent_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notification_history.sent_at IS 'Timestamp when notification was sent.';


--
-- Name: COLUMN notification_history.sent_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notification_history.sent_by IS 'User who sent the notification (UUID).';


--
-- Name: COLUMN notification_history.target_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notification_history.target_type IS 'Target type (e.g., user, group).';


--
-- Name: COLUMN notification_history.target_users; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notification_history.target_users IS 'Array of target user UUIDs.';


--
-- Name: COLUMN notification_history.success_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notification_history.success_count IS 'Number of successful deliveries.';


--
-- Name: COLUMN notification_history.failure_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notification_history.failure_count IS 'Number of failed deliveries.';


--
-- Name: notification_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.notification_history ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.notification_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: people; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.people (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    title text,
    company text,
    bio text,
    photo_url text,
    country text,
    role text DEFAULT '''attendee''::text'::text NOT NULL,
    email text,
    mobile text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    hidden boolean DEFAULT false
);


--
-- Name: TABLE people; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.people IS 'Stores user and speaker profiles for the summit.';


--
-- Name: COLUMN people.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.people.id IS 'Primary key.';


--
-- Name: COLUMN people.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.people.created_at IS 'Record creation timestamp.';


--
-- Name: COLUMN people.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.people.name IS 'Person name.';


--
-- Name: COLUMN people.title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.people.title IS 'Person title (nullable).';


--
-- Name: COLUMN people.company; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.people.company IS 'Company name (nullable).';


--
-- Name: COLUMN people.bio; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.people.bio IS 'Short biography (nullable).';


--
-- Name: COLUMN people.photo_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.people.photo_url IS 'Photo URL (nullable).';


--
-- Name: COLUMN people.country; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.people.country IS 'Country (nullable).';


--
-- Name: COLUMN people.role; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.people.role IS 'Role (e.g., attendee, speaker).';


--
-- Name: COLUMN people.email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.people.email IS 'Email address (nullable).';


--
-- Name: COLUMN people.mobile; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.people.mobile IS 'Mobile phone (nullable).';


--
-- Name: COLUMN people.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.people.updated_at IS 'Record last update timestamp.';


--
-- Name: COLUMN people.hidden; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.people.hidden IS 'Whether the profile is hidden.';


--
-- Name: people_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.people ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.people_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resources (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    link text NOT NULL,
    description text DEFAULT ''::text,
    is_route boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE resources; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.resources IS 'Stores additional resources (links, files) for users.';


--
-- Name: COLUMN resources.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.resources.id IS 'Primary key.';


--
-- Name: COLUMN resources.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.resources.created_at IS 'Record creation timestamp.';


--
-- Name: COLUMN resources.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.resources.name IS 'Resource name.';


--
-- Name: COLUMN resources.link; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.resources.link IS 'Resource link (URL).';


--
-- Name: COLUMN resources.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.resources.description IS 'Resource description (nullable).';


--
-- Name: COLUMN resources.is_route; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.resources.is_route IS 'Whether the resource is a route.';


--
-- Name: COLUMN resources.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.resources.updated_at IS 'Record last update timestamp.';


--
-- Name: resources_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.resources ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.resources_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sections (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    date text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE sections; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.sections IS 'Stores sections (tracks, streams) for events.';


--
-- Name: COLUMN sections.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sections.id IS 'Primary key.';


--
-- Name: COLUMN sections.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sections.created_at IS 'Record creation timestamp.';


--
-- Name: COLUMN sections.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sections.name IS 'Section name.';


--
-- Name: COLUMN sections.date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sections.date IS 'Section date.';


--
-- Name: COLUMN sections.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sections.updated_at IS 'Record last update timestamp.';


--
-- Name: sections_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.sections ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.sections_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: social_feed_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_feed_posts (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    author_id bigint NOT NULL,
    content text NOT NULL,
    "timestamp" timestamp with time zone NOT NULL,
    image_urls text[] NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid
);


--
-- Name: TABLE social_feed_posts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.social_feed_posts IS 'Stores posts for the social feed in the app.';


--
-- Name: COLUMN social_feed_posts.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.social_feed_posts.id IS 'Primary key.';


--
-- Name: COLUMN social_feed_posts.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.social_feed_posts.created_at IS 'Record creation timestamp.';


--
-- Name: COLUMN social_feed_posts.author_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.social_feed_posts.author_id IS 'Author person ID.';


--
-- Name: COLUMN social_feed_posts.content; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.social_feed_posts.content IS 'Post content.';


--
-- Name: COLUMN social_feed_posts."timestamp"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.social_feed_posts."timestamp" IS 'Post timestamp.';


--
-- Name: COLUMN social_feed_posts.image_urls; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.social_feed_posts.image_urls IS 'Array of image URLs.';


--
-- Name: COLUMN social_feed_posts.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.social_feed_posts.updated_at IS 'Record last update timestamp.';


--
-- Name: COLUMN social_feed_posts.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.social_feed_posts.user_id IS 'User UUID (nullable, for linking to auth).';


--
-- Name: social_feed_posts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.social_feed_posts ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.social_feed_posts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text
);


--
-- Name: seed_files; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.seed_files (
    path text NOT NULL,
    hash text NOT NULL
);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: debug_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debug_logs ALTER COLUMN id SET DEFAULT nextval('public.debug_logs_id_seq'::regclass);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: admin_settings admin_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: app_user_settings app_user_settings_device_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_user_settings
    ADD CONSTRAINT app_user_settings_device_id_key UNIQUE (device_id);


--
-- Name: app_user_settings app_user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_user_settings
    ADD CONSTRAINT app_user_settings_pkey PRIMARY KEY (id);


--
-- Name: debug_logs debug_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debug_logs
    ADD CONSTRAINT debug_logs_pkey PRIMARY KEY (id);


--
-- Name: deletions_log deletions_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deletions_log
    ADD CONSTRAINT deletions_log_pkey PRIMARY KEY (id);


--
-- Name: event_people event_people_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_people
    ADD CONSTRAINT event_people_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: json_versions json_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.json_versions
    ADD CONSTRAINT json_versions_pkey PRIMARY KEY (id);


--
-- Name: locations locations_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_name_key UNIQUE (name);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: markdown_pages markdown_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markdown_pages
    ADD CONSTRAINT markdown_pages_pkey PRIMARY KEY (id);


--
-- Name: markdown_pages markdown_pages_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markdown_pages
    ADD CONSTRAINT markdown_pages_slug_key UNIQUE (slug);


--
-- Name: notification_history notification_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_history
    ADD CONSTRAINT notification_history_pkey PRIMARY KEY (id);


--
-- Name: people people_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.people
    ADD CONSTRAINT people_pkey PRIMARY KEY (id);


--
-- Name: resources resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (id);


--
-- Name: sections sections_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_name_key UNIQUE (name);


--
-- Name: sections sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_pkey PRIMARY KEY (id);


--
-- Name: social_feed_posts social_feed_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_feed_posts
    ADD CONSTRAINT social_feed_posts_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: seed_files seed_files_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.seed_files
    ADD CONSTRAINT seed_files_pkey PRIMARY KEY (path);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: idx_app_user_settings_device_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_app_user_settings_device_id ON public.app_user_settings USING btree (device_id);


--
-- Name: idx_app_user_settings_push_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_app_user_settings_push_token ON public.app_user_settings USING btree (push_token) WHERE (push_token IS NOT NULL);


--
-- Name: idx_json_versions_published_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_json_versions_published_at ON public.json_versions USING btree (published_at DESC);


--
-- Name: idx_notification_history_sent_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_history_sent_at ON public.notification_history USING btree (sent_at DESC);


--
-- Name: idx_people_hidden; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_people_hidden ON public.people USING btree (hidden);


--
-- Name: idx_social_feed_posts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_social_feed_posts_user_id ON public.social_feed_posts USING btree (user_id);


--
-- Name: markdown_pages_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX markdown_pages_slug_idx ON public.markdown_pages USING btree (slug);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: announcements log_announcements_deletion; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER log_announcements_deletion BEFORE DELETE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.log_deletion();


--
-- Name: events log_events_deletion; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER log_events_deletion BEFORE DELETE ON public.events FOR EACH ROW EXECUTE FUNCTION public.log_deletion();


--
-- Name: locations log_locations_deletion; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER log_locations_deletion BEFORE DELETE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.log_deletion();


--
-- Name: markdown_pages log_markdown_pages_deletion; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER log_markdown_pages_deletion BEFORE DELETE ON public.markdown_pages FOR EACH ROW EXECUTE FUNCTION public.log_deletion();


--
-- Name: people log_people_deletion; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER log_people_deletion BEFORE DELETE ON public.people FOR EACH ROW EXECUTE FUNCTION public.log_deletion();


--
-- Name: resources log_resources_deletion; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER log_resources_deletion BEFORE DELETE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.log_deletion();


--
-- Name: sections log_sections_deletion; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER log_sections_deletion BEFORE DELETE ON public.sections FOR EACH ROW EXECUTE FUNCTION public.log_deletion();


--
-- Name: social_feed_posts log_social_feed_posts_deletion; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER log_social_feed_posts_deletion BEFORE DELETE ON public.social_feed_posts FOR EACH ROW EXECUTE FUNCTION public.log_deletion();


--
-- Name: social_feed_posts set_social_feed_post_user_id; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_social_feed_post_user_id BEFORE INSERT ON public.social_feed_posts FOR EACH ROW EXECUTE FUNCTION public.set_social_feed_post_user_id();


--
-- Name: social_feed_posts set_social_feed_posts_user_id; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_social_feed_posts_user_id BEFORE INSERT ON public.social_feed_posts FOR EACH ROW EXECUTE FUNCTION public.set_social_feed_post_user_id();


--
-- Name: markdown_pages update_markdown_pages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_markdown_pages_updated_at BEFORE UPDATE ON public.markdown_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: announcements update_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_timestamp BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: event_people update_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_timestamp BEFORE UPDATE ON public.event_people FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: events update_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_timestamp BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: locations update_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_timestamp BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: markdown_pages update_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_timestamp BEFORE UPDATE ON public.markdown_pages FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: people update_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_timestamp BEFORE UPDATE ON public.people FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: resources update_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_timestamp BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: sections update_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_timestamp BEFORE UPDATE ON public.sections FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: social_feed_posts update_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_timestamp BEFORE UPDATE ON public.social_feed_posts FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: announcements announcements_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.people(id);


--
-- Name: event_people event_people_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_people
    ADD CONSTRAINT event_people_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_people event_people_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_people
    ADD CONSTRAINT event_people_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.people(id);


--
-- Name: events events_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: events events_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id);


--
-- Name: social_feed_posts fk_social_feed_posts_author; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_feed_posts
    ADD CONSTRAINT fk_social_feed_posts_author FOREIGN KEY (author_id) REFERENCES public.people(id) ON DELETE RESTRICT;


--
-- Name: json_versions json_versions_published_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.json_versions
    ADD CONSTRAINT json_versions_published_by_fkey FOREIGN KEY (published_by) REFERENCES auth.users(id);


--
-- Name: notification_history notification_history_sent_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_history
    ADD CONSTRAINT notification_history_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES auth.users(id);


--
-- Name: social_feed_posts social_feed_posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_feed_posts
    ADD CONSTRAINT social_feed_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: deletions_log Allow anonymous inserts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow anonymous inserts" ON public.deletions_log FOR INSERT TO anon WITH CHECK (true);


--
-- Name: deletions_log Allow anonymous read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow anonymous read" ON public.deletions_log FOR SELECT USING (true);


--
-- Name: admin_settings Allow delete for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete for authenticated" ON public.admin_settings FOR DELETE TO authenticated USING (true);


--
-- Name: admin_settings Allow insert for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for authenticated" ON public.admin_settings FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: admin_settings Allow select for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select for authenticated" ON public.admin_settings FOR SELECT TO authenticated USING (true);


--
-- Name: admin_settings Allow update for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update for authenticated" ON public.admin_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: admin_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: json_versions allow_anon_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_anon_access ON public.json_versions TO anon USING (true) WITH CHECK (true);


--
-- Name: announcements allow_auth_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_auth_access ON public.announcements TO authenticated USING (true);


--
-- Name: event_people allow_auth_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_auth_access ON public.event_people TO authenticated USING (true);


--
-- Name: events allow_auth_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_auth_access ON public.events TO authenticated USING (true);


--
-- Name: json_versions allow_auth_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_auth_access ON public.json_versions TO authenticated USING (true);


--
-- Name: locations allow_auth_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_auth_access ON public.locations TO authenticated USING (true) WITH CHECK (true);


--
-- Name: markdown_pages allow_auth_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_auth_access ON public.markdown_pages TO authenticated USING (true) WITH CHECK (true);


--
-- Name: notification_history allow_auth_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_auth_access ON public.notification_history TO authenticated USING (true);


--
-- Name: people allow_auth_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_auth_access ON public.people TO authenticated USING (true) WITH CHECK (true);


--
-- Name: resources allow_auth_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_auth_access ON public.resources TO authenticated USING (true) WITH CHECK (true);


--
-- Name: sections allow_auth_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_auth_access ON public.sections TO authenticated USING (true);


--
-- Name: social_feed_posts allow_auth_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_auth_delete ON public.social_feed_posts FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: social_feed_posts allow_auth_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_auth_insert ON public.social_feed_posts FOR INSERT TO authenticated WITH CHECK (((user_id IS NULL) OR (auth.uid() = user_id)));


--
-- Name: social_feed_posts allow_auth_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_auth_select ON public.social_feed_posts FOR SELECT TO authenticated USING (true);


--
-- Name: social_feed_posts allow_auth_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_auth_update ON public.social_feed_posts FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: announcements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

--
-- Name: app_user_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.app_user_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: app_user_settings app_user_settings_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY app_user_settings_policy ON public.app_user_settings USING (true) WITH CHECK (true);


--
-- Name: debug_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.debug_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: debug_logs debug_logs_auth_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY debug_logs_auth_policy ON public.debug_logs TO authenticated USING (true) WITH CHECK (true);


--
-- Name: deletions_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deletions_log ENABLE ROW LEVEL SECURITY;

--
-- Name: announcements deny_anon_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY deny_anon_access ON public.announcements TO anon USING (false);


--
-- Name: event_people deny_anon_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY deny_anon_access ON public.event_people TO anon USING (false);


--
-- Name: events deny_anon_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY deny_anon_access ON public.events TO anon USING (false);


--
-- Name: json_versions deny_anon_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY deny_anon_access ON public.json_versions TO anon USING (false);


--
-- Name: locations deny_anon_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY deny_anon_access ON public.locations TO anon USING (false);


--
-- Name: markdown_pages deny_anon_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY deny_anon_access ON public.markdown_pages TO anon USING (false);


--
-- Name: notification_history deny_anon_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY deny_anon_access ON public.notification_history TO anon USING (false);


--
-- Name: people deny_anon_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY deny_anon_access ON public.people TO anon USING (false);


--
-- Name: resources deny_anon_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY deny_anon_access ON public.resources TO anon USING (false);


--
-- Name: sections deny_anon_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY deny_anon_access ON public.sections TO anon USING (false);


--
-- Name: social_feed_posts deny_anon_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY deny_anon_access ON public.social_feed_posts TO anon USING (false);


--
-- Name: event_people; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_people ENABLE ROW LEVEL SECURITY;

--
-- Name: events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

--
-- Name: locations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

--
-- Name: markdown_pages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.markdown_pages ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

--
-- Name: resources; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

--
-- Name: sections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

--
-- Name: social_feed_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.social_feed_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Allow authenticated uploads; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Allow authenticated uploads" ON storage.objects TO authenticated USING (true) WITH CHECK (true);


--
-- Name: objects Allow public select; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Allow public select" ON storage.objects FOR SELECT USING (true);


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

