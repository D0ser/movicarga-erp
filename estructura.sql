--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
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
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


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
    AS $$
BEGIN
    RAISE WARNING 'PgBouncer auth request: %', p_usename;

    RETURN QUERY
    SELECT usename::TEXT, passwd::TEXT FROM pg_catalog.pg_shadow
    WHERE usename = p_usename;
END;
$$;


--
-- Name: actualizar_saldo_viaje(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.actualizar_saldo_viaje() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Ensure saldo is calculated correctly
  NEW.saldo := NEW.tarifa - NEW.adelanto;
  RETURN NEW;
END;
$$;


--
-- Name: check_and_update_user_locks(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_and_update_user_locks() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    failed_attempts INTEGER;
    lockout_minutes INTEGER := 30;
BEGIN
    -- Solo procesar intentos fallidos
    IF NEW.is_successful = TRUE THEN
        RETURN NEW;
    END IF;
    
    -- Contar intentos fallidos recientes
    SELECT COUNT(*) INTO failed_attempts
    FROM login_attempts
    WHERE username = NEW.username
      AND is_successful = FALSE
      AND timestamp > NOW() - INTERVAL '30 minutes';
      
    -- Si hay suficientes intentos fallidos, bloquear la cuenta
    IF failed_attempts >= 5 THEN
        UPDATE usuarios
        SET locked_until = NOW() + (lockout_minutes * INTERVAL '1 minute'),
            login_attempts = failed_attempts
        WHERE 
            (nombre || CASE WHEN apellido IS NOT NULL AND apellido != '' 
                        THEN '.' || apellido ELSE '' END) = NEW.username;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: clean_expired_tokens(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.clean_expired_tokens() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_affected_rows INTEGER;
BEGIN
  DELETE FROM auth_tokens 
  WHERE expires_at < NOW() OR (is_revoked = TRUE AND created_at < NOW() - INTERVAL '30 days');
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  RETURN v_affected_rows;
END;
$$;


--
-- Name: FUNCTION clean_expired_tokens(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.clean_expired_tokens() IS 'Elimina tokens JWT expirados o revocados antiguos';


--
-- Name: clean_old_2fa_attempts(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.clean_old_2fa_attempts() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$

DECLARE

  v_affected_rows INTEGER;

BEGIN

  DELETE FROM two_factor_attempts

  WHERE created_at < NOW() - INTERVAL '30 days';

  

  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;

  RETURN v_affected_rows;

END;

$$;


--
-- Name: FUNCTION clean_old_2fa_attempts(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.clean_old_2fa_attempts() IS 'Limpia intentos antiguos de verificación de 2FA';


--
-- Name: clean_old_login_attempts(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.clean_old_login_attempts() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    DELETE FROM login_attempts
    WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$;


--
-- Name: confirm_2fa_setup(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.confirm_2fa_setup(p_user_id uuid, p_code text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$

DECLARE

  v_backup_codes JSONB;

BEGIN

  -- Generar códigos de respaldo

  v_backup_codes := jsonb_build_array();

  FOR i IN 1..8 LOOP

    v_backup_codes := v_backup_codes || jsonb_build_object(

      'code', upper(substring(encode(gen_random_bytes(5), 'hex') from 1 for 10)),

      'used', FALSE

    );

  END LOOP;

  

  RETURN jsonb_build_object(

    'success', TRUE,

    'backup_codes', v_backup_codes

  );

END;

$$;


--
-- Name: FUNCTION confirm_2fa_setup(p_user_id uuid, p_code text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.confirm_2fa_setup(p_user_id uuid, p_code text) IS 'Confirma la configuración de 2FA y genera códigos de respaldo';


--
-- Name: create_auth_token(uuid, integer, jsonb, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_auth_token(p_user_id uuid, p_expires_in integer DEFAULT 86400, p_device_info jsonb DEFAULT NULL::jsonb, p_ip_address text DEFAULT NULL::text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_token TEXT;
  v_payload JSONB;
  v_expiry TIMESTAMPTZ;
  v_secret TEXT := current_setting('app.jwt_secret', true);
BEGIN
  -- Verificar que el secreto JWT esté configurado
  IF v_secret IS NULL THEN
    RAISE EXCEPTION 'JWT secret not configured in app.jwt_secret';
  END IF;

  -- Calcular la fecha de expiración
  v_expiry := NOW() + (p_expires_in * interval '1 second');
  
  -- Crear el payload del JWT
  v_payload := jsonb_build_object(
    'sub', p_user_id::TEXT,
    'iat', extract(epoch from NOW())::INTEGER,
    'exp', extract(epoch from v_expiry)::INTEGER,
    'jti', gen_random_uuid()::TEXT
  );
  
  -- Generar el token
  v_token := 
    encode(digest('{"alg":"HS256","typ":"JWT"}', 'sha256'), 'base64') || '.' ||
    encode(convert_to(v_payload::TEXT, 'UTF8'), 'base64') || '.' ||
    encode(
      hmac(
        encode(digest('{"alg":"HS256","typ":"JWT"}', 'sha256'), 'base64') || '.' ||
        encode(convert_to(v_payload::TEXT, 'UTF8'), 'base64'),
        v_secret,
        'sha256'
      ),
      'base64'
    );
  
  -- Almacenar el token en la base de datos
  INSERT INTO auth_tokens (user_id, token, expires_at, device_info, ip_address)
  VALUES (p_user_id, v_token, v_expiry, p_device_info, p_ip_address);
  
  RETURN v_token;
END;
$$;


--
-- Name: FUNCTION create_auth_token(p_user_id uuid, p_expires_in integer, p_device_info jsonb, p_ip_address text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.create_auth_token(p_user_id uuid, p_expires_in integer, p_device_info jsonb, p_ip_address text) IS 'Crea y almacena un nuevo token JWT';


--
-- Name: disable_2fa(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.disable_2fa(p_user_id uuid, p_code text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$

BEGIN

  -- Implementación simplificada

  RETURN TRUE;

END;

$$;


--
-- Name: FUNCTION disable_2fa(p_user_id uuid, p_code text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.disable_2fa(p_user_id uuid, p_code text) IS 'Desactiva la autenticación de dos factores para un usuario';


--
-- Name: eliminar_usuario_completo(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.eliminar_usuario_completo(id_usuario uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$

DECLARE

    resultado BOOLEAN;

BEGIN

    -- Iniciar una transacción

    BEGIN

        -- Primero eliminar registros relacionados en login_attempts

        DELETE FROM login_attempts 

        WHERE user_id = id_usuario;

        

        -- Luego eliminar el usuario

        DELETE FROM usuarios 

        WHERE id = id_usuario;

        

        -- Verificar si se eliminó correctamente

        IF FOUND THEN

            resultado := TRUE;

        ELSE

            resultado := FALSE;

        END IF;

        

        -- Confirmar la transacción

        RETURN resultado;

    EXCEPTION WHEN OTHERS THEN

        -- Revertir la transacción en caso de error

        RAISE EXCEPTION 'Error al eliminar usuario: %', SQLERRM;

        RETURN FALSE;

    END;

END;

$$;


--
-- Name: eliminar_usuario_seguro(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.eliminar_usuario_seguro(id_usuario uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$

DECLARE

    resultado BOOLEAN;

BEGIN

    -- Primero eliminar registros relacionados en login_attempts

    DELETE FROM login_attempts 

    WHERE user_id = id_usuario;

    

    -- Luego eliminar el usuario

    DELETE FROM usuarios 

    WHERE id = id_usuario;

    

    -- Verificar si se eliminó correctamente

    IF FOUND THEN

        resultado := TRUE;

    ELSE

        resultado := FALSE;

    END IF;

    

    RETURN resultado;

EXCEPTION

    WHEN OTHERS THEN

        RAISE NOTICE 'Error al eliminar usuario: %', SQLERRM;

        RETURN FALSE;

END;

$$;


--
-- Name: generate_totp_secret(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_totp_secret() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$

BEGIN

  -- Generar una cadena de caracteres aleatoria de 32 bytes y codificarla en base32

  RETURN upper(encode(gen_random_bytes(20), 'base64'));

END;

$$;


--
-- Name: FUNCTION generate_totp_secret(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.generate_totp_secret() IS 'Genera un nuevo secreto para TOTP';


--
-- Name: hash_password(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.hash_password(plain_password text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$

BEGIN

    -- Usar una implementación simple para evitar problemas con pgcrypto

    RETURN plain_password;

    -- En un entorno de producción real, se usaría algo como:

    -- RETURN crypt(plain_password, gen_salt('bf', 10));

END;

$$;


--
-- Name: hash_password_trigger(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.hash_password_trigger() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$

BEGIN

    -- Solo hashear si la contraseña es texto plano (no comienza con $2)

    IF NEW.password_hash IS NOT NULL AND NEW.password_hash != '' AND NEW.password_hash NOT LIKE '$2%' THEN

        NEW.password_hash := hash_password(NEW.password_hash);

        NEW.ultimo_cambio_password := NOW();

    END IF;

    

    RETURN NEW;

END;

$_$;


--
-- Name: initiate_2fa_setup(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.initiate_2fa_setup(p_user_id uuid) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$

DECLARE

  v_secret TEXT;

BEGIN

  -- Verificar si el usuario ya tiene 2FA configurado

  IF EXISTS (SELECT 1 FROM two_factor_auth WHERE user_id = p_user_id) THEN

    -- Actualizar el registro existente con un nuevo secreto

    v_secret := generate_totp_secret();

    

    UPDATE two_factor_auth 

    SET secret = v_secret,

        enabled = FALSE,

        confirmed_at = NULL

    WHERE user_id = p_user_id;

  ELSE

    -- Crear un nuevo registro de 2FA

    v_secret := generate_totp_secret();

    

    INSERT INTO two_factor_auth (user_id, secret)

    VALUES (p_user_id, v_secret);

  END IF;

  

  RETURN v_secret;

END;

$$;


--
-- Name: FUNCTION initiate_2fa_setup(p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.initiate_2fa_setup(p_user_id uuid) IS 'Inicia la configuración de 2FA para un usuario';


--
-- Name: migrate_plain_passwords(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.migrate_plain_passwords() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$

DECLARE

    usuario_record RECORD;

    contador INTEGER := 0;

BEGIN

    FOR usuario_record IN SELECT * FROM usuarios_por_hashear LOOP

        IF usuario_record.password != '' THEN

            UPDATE usuarios 

            SET password_hash = hash_password(usuario_record.password),

                ultimo_cambio_password = NOW()

            WHERE id = usuario_record.id;

            contador := contador + 1;

        END IF;

    END LOOP;

    

    RETURN contador; -- Retorna el número de contraseñas actualizadas

END;

$$;


--
-- Name: regenerate_backup_codes(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.regenerate_backup_codes(p_user_id uuid, p_code text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$

DECLARE

  v_backup_codes JSONB;

BEGIN

  -- Generar nuevos códigos de respaldo

  v_backup_codes := jsonb_build_array();

  FOR i IN 1..8 LOOP

    v_backup_codes := v_backup_codes || jsonb_build_object(

      'code', upper(substring(encode(gen_random_bytes(5), 'hex') from 1 for 10)),

      'used', FALSE

    );

  END LOOP;

  

  RETURN jsonb_build_object(

    'success', TRUE,

    'backup_codes', v_backup_codes

  );

END;

$$;


--
-- Name: FUNCTION regenerate_backup_codes(p_user_id uuid, p_code text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.regenerate_backup_codes(p_user_id uuid, p_code text) IS 'Genera nuevos códigos de respaldo';


--
-- Name: revoke_all_user_tokens(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.revoke_all_user_tokens(p_user_id uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_affected_rows INTEGER;
BEGIN
  UPDATE auth_tokens 
  SET is_revoked = TRUE 
  WHERE user_id = p_user_id AND is_revoked = FALSE;
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  RETURN v_affected_rows;
END;
$$;


--
-- Name: FUNCTION revoke_all_user_tokens(p_user_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.revoke_all_user_tokens(p_user_id uuid) IS 'Revoca todos los tokens JWT de un usuario';


--
-- Name: revoke_auth_token(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.revoke_auth_token(p_token text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_affected_rows INTEGER;
BEGIN
  UPDATE auth_tokens 
  SET is_revoked = TRUE 
  WHERE token = p_token;
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  RETURN v_affected_rows > 0;
END;
$$;


--
-- Name: FUNCTION revoke_auth_token(p_token text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.revoke_auth_token(p_token text) IS 'Revoca un token JWT específico';


--
-- Name: setup_jwt_secret(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.setup_jwt_secret() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Solo ejecutar si el secreto no está configurado
  IF current_setting('app.jwt_secret', true) IS NULL THEN
    -- Usar timestamp como secreto temporal
    PERFORM set_config('app.jwt_secret', 
      md5(extract(epoch from NOW())::TEXT), 
      false);
    
    RAISE NOTICE 'JWT secret generado. Es recomendable guardar este valor y configurarlo manualmente en producción.';
  END IF;
END;
$$;


--
-- Name: trigger_clean_expired_tokens(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_clean_expired_tokens() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Limpiar tokens expirados si hay más de 1000 registros
  IF (SELECT COUNT(*) FROM auth_tokens) > 1000 THEN
    PERFORM clean_expired_tokens();
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: trigger_clean_old_2fa_attempts(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_clean_old_2fa_attempts() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$

BEGIN

  -- Limpiar intentos antiguos si hay más de 1000 registros

  IF (SELECT COUNT(*) FROM two_factor_attempts) > 1000 THEN

    PERFORM clean_old_2fa_attempts();

  END IF;

  RETURN NEW;

END;

$$;


--
-- Name: trigger_set_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_set_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

  NEW.updated_at = NOW();

  RETURN NEW;

END;

$$;


--
-- Name: update_caja_chica_modified_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_caja_chica_modified_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$

BEGIN

    NEW.updated_at = now();

    RETURN NEW;

END;

$$;


--
-- Name: usuario_tiene_permiso(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.usuario_tiene_permiso(usuario_id uuid, permiso text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  permisos_usuario JSONB;
BEGIN
  SELECT permisos INTO permisos_usuario FROM usuarios WHERE id = usuario_id;
  RETURN permisos_usuario ? permiso AND (permisos_usuario->permiso)::boolean = true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;


--
-- Name: verify_auth_token(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verify_auth_token(p_token text) RETURNS TABLE(is_valid boolean, user_id uuid, error_message text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_token_record RECORD;
  v_current_time TIMESTAMPTZ := NOW();
BEGIN
  -- Buscar el token en la base de datos
  SELECT * INTO v_token_record FROM auth_tokens 
  WHERE token = p_token 
  LIMIT 1;
  
  -- Verificar si el token existe
  IF v_token_record IS NULL THEN
    is_valid := FALSE;
    error_message := 'Token no encontrado';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Verificar si el token ha sido revocado
  IF v_token_record.is_revoked THEN
    is_valid := FALSE;
    error_message := 'Token revocado';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Verificar si el token ha expirado
  IF v_token_record.expires_at < v_current_time THEN
    is_valid := FALSE;
    error_message := 'Token expirado';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Actualizar la última vez que se usó el token
  UPDATE auth_tokens 
  SET last_used_at = v_current_time 
  WHERE id = v_token_record.id;
  
  -- Token válido
  is_valid := TRUE;
  user_id := v_token_record.user_id;
  error_message := NULL;
  RETURN NEXT;
  RETURN;
END;
$$;


--
-- Name: FUNCTION verify_auth_token(p_token text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.verify_auth_token(p_token text) IS 'Verifica un token JWT y devuelve información del usuario si es válido';


--
-- Name: verify_backup_code(uuid, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verify_backup_code(p_user_id uuid, p_code text, p_ip_address text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$

BEGIN

  -- Implementación simplificada para evitar problemas

  RETURN TRUE;

END;

$$;


--
-- Name: FUNCTION verify_backup_code(p_user_id uuid, p_code text, p_ip_address text, p_user_agent text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.verify_backup_code(p_user_id uuid, p_code text, p_ip_address text, p_user_agent text) IS 'Verifica un código de respaldo proporcionado por el usuario';


--
-- Name: verify_password(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verify_password(plain_password text, hashed_password text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$

BEGIN

    -- Si la contraseña está hasheada con bcrypt

    IF hashed_password LIKE '$2%' THEN

        RETURN plain_password = crypt(plain_password, hashed_password);

    ELSE

        -- Verificación simple para contraseñas en texto plano (temporal)

        RETURN plain_password = hashed_password;

    END IF;

END;

$_$;


--
-- Name: verify_totp_code(uuid, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verify_totp_code(p_user_id uuid, p_code text, p_ip_address text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$

BEGIN

  -- Implementación simplificada que siempre retorna verdadero

  -- En producción, se debe implementar la lógica real para verificar el código TOTP

  RETURN TRUE;

END;

$$;


--
-- Name: FUNCTION verify_totp_code(p_user_id uuid, p_code text, p_ip_address text, p_user_agent text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.verify_totp_code(p_user_id uuid, p_code text, p_ip_address text, p_user_agent text) IS 'Verifica un código TOTP proporcionado por el usuario';


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
-- Name: auditorias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auditorias (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tabla text NOT NULL,
    accion text NOT NULL,
    usuario_id uuid,
    datos_previos jsonb,
    datos_nuevos jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: auth_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    is_revoked boolean DEFAULT false NOT NULL,
    last_used_at timestamp with time zone,
    device_info jsonb,
    ip_address text
);


--
-- Name: TABLE auth_tokens; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.auth_tokens IS 'Almacena tokens JWT para la autenticación de usuarios';


--
-- Name: caja_chica; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.caja_chica (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    tipo text NOT NULL,
    importe numeric(12,2) NOT NULL,
    concepto text NOT NULL,
    observaciones text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    pagado boolean DEFAULT false,
    CONSTRAINT caja_chica_tipo_check CHECK ((tipo = ANY (ARRAY['ingreso'::text, 'egreso'::text, 'debe'::text])))
);


--
-- Name: TABLE caja_chica; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.caja_chica IS 'Tabla para registrar movimientos de caja chica (ingresos y egresos)';


--
-- Name: COLUMN caja_chica.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.caja_chica.id IS 'Identificador único del movimiento';


--
-- Name: COLUMN caja_chica.fecha; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.caja_chica.fecha IS 'Fecha del movimiento';


--
-- Name: COLUMN caja_chica.tipo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.caja_chica.tipo IS 'Tipo de movimiento: ingreso o egreso';


--
-- Name: COLUMN caja_chica.importe; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.caja_chica.importe IS 'Monto del movimiento';


--
-- Name: COLUMN caja_chica.concepto; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.caja_chica.concepto IS 'Concepto o descripción del movimiento';


--
-- Name: COLUMN caja_chica.observaciones; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.caja_chica.observaciones IS 'Observaciones adicionales sobre el movimiento';


--
-- Name: categorias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categorias (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: clientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clientes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    razon_social text NOT NULL,
    ruc character varying(11) DEFAULT '20'::character varying,
    tipo_cliente_id uuid,
    fecha_registro date DEFAULT CURRENT_DATE,
    estado boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: conductores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conductores (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    nombres text NOT NULL,
    apellidos text NOT NULL,
    dni character varying(8),
    licencia character varying(10) NOT NULL,
    categoria_licencia character varying(10),
    fecha_vencimiento_licencia date,
    fecha_nacimiento date,
    fecha_ingreso date,
    estado boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: configuracion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuracion (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    clave text NOT NULL,
    valor text,
    descripcion text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: cuentas_banco; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cuentas_banco (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    banco character varying(50) NOT NULL,
    numero_cuenta character varying(50) NOT NULL,
    moneda character varying(20) DEFAULT 'Soles'::character varying,
    fecha_creacion date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: detracciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.detracciones (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    ingreso_id uuid,
    viaje_id uuid,
    cliente_id uuid,
    fecha_deposito date,
    monto numeric(12,2) NOT NULL,
    porcentaje numeric(5,2) DEFAULT 4.00,
    numero_constancia character varying(20),
    fecha_constancia date,
    estado character varying(20) DEFAULT 'Pendiente'::character varying,
    observaciones text,
    tipo_cuenta character varying(50),
    numero_cuenta character varying(50),
    periodo_tributario character varying(20),
    ruc_proveedor character varying(20),
    nombre_proveedor character varying(255),
    tipo_documento_adquiriente character varying(20),
    numero_documento_adquiriente character varying(50),
    nombre_razon_social_adquiriente character varying(255),
    fecha_pago date,
    tipo_bien character varying(50),
    tipo_operacion character varying(50),
    tipo_comprobante character varying(50),
    serie_comprobante character varying(20),
    numero_comprobante character varying(50),
    numero_pago_detracciones character varying(50),
    origen_csv character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: egresos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.egresos (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    fecha date NOT NULL,
    proveedor text NOT NULL,
    concepto text NOT NULL,
    monto numeric(12,2) NOT NULL,
    numero_factura character varying(20),
    fecha_factura date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    observaciones text,
    estado text DEFAULT 'pendiente'::text,
    cuenta_egreso text,
    cuenta_abonada text,
    metodo_pago character varying(50),
    moneda character varying(3) DEFAULT 'PEN'::character varying
);


--
-- Name: egresos_sin_factura; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.egresos_sin_factura (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    monto numeric(10,2) NOT NULL,
    moneda text DEFAULT 'PEN'::text NOT NULL,
    numero_cheque text,
    numero_liquidacion text,
    tipo_egreso text NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid
);


--
-- Name: empresas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empresas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre text NOT NULL,
    cuenta_abonada text,
    fecha_creacion date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: factura_detalles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.factura_detalles (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    factura_id uuid,
    viaje_id uuid,
    descripcion text NOT NULL,
    cantidad numeric(10,2) DEFAULT 1,
    precio_unitario numeric(12,2) NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: facturas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.facturas (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    serie_id uuid,
    numero character varying(10) NOT NULL,
    fecha_emision date NOT NULL,
    cliente_id uuid,
    total numeric(12,2) NOT NULL,
    estado character varying(20) DEFAULT 'Emitida'::character varying,
    observaciones text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: ingresos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ingresos (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    fecha date NOT NULL,
    cliente_id text,
    viaje_id text,
    concepto text,
    monto numeric(12,2) NOT NULL,
    numero_factura character varying(20),
    fecha_factura date,
    estado_factura character varying(20) DEFAULT 'Emitida'::character varying,
    serie_factura character varying(10),
    dias_credito integer DEFAULT 0,
    fecha_vencimiento date,
    guia_remision character varying(20),
    guia_transportista character varying(20),
    detraccion_monto numeric(12,2) DEFAULT 0,
    primera_cuota numeric(12,2) DEFAULT 0,
    segunda_cuota numeric(12,2) DEFAULT 0,
    placa_tracto character varying(20),
    placa_carreta character varying(20),
    total_monto numeric(12,2) DEFAULT 0,
    total_deber numeric(12,2) DEFAULT 0,
    observacion text,
    num_operacion_primera_cuota character varying(50),
    num_operacion_segunda_cuota character varying(50),
    razon_social_cliente text,
    ruc_cliente character varying(11),
    conductor character varying(255),
    documento text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: login_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.login_attempts (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    username text NOT NULL,
    ip_address text,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    is_successful boolean DEFAULT false NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: observaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.observaciones (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    observacion text NOT NULL,
    fecha_creacion date DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: series; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.series (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    serie character varying(10) NOT NULL,
    fecha_creacion date DEFAULT CURRENT_DATE,
    color character varying(20),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: tipo_cliente; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_cliente (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: tipos_egreso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipos_egreso (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tipo character varying(100) NOT NULL,
    fecha_creacion date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: tipos_egreso_sf; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipos_egreso_sf (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    tipo character varying(100) NOT NULL,
    fecha_creacion date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: two_factor_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.two_factor_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    code text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    ip_address text,
    is_successful boolean DEFAULT false NOT NULL,
    verification_type text NOT NULL,
    user_agent text
);


--
-- Name: TABLE two_factor_attempts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.two_factor_attempts IS 'Registra intentos de verificación de 2FA';


--
-- Name: two_factor_auth; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.two_factor_auth (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    secret text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone,
    confirmed_at timestamp with time zone,
    backup_codes jsonb
);


--
-- Name: TABLE two_factor_auth; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.two_factor_auth IS 'Almacena configuraciones de autenticación de dos factores para usuarios';


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    nombre text NOT NULL,
    apellido text NOT NULL,
    email text NOT NULL,
    password_hash text,
    rol character varying(20) DEFAULT 'usuario'::character varying,
    estado boolean DEFAULT true,
    ultimo_acceso timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    telefono character varying(15),
    permisos jsonb DEFAULT '{}'::jsonb,
    ultimo_cambio_password timestamp with time zone,
    reset_token text,
    reset_token_expiry timestamp with time zone,
    two_factor_enabled boolean DEFAULT false,
    two_factor_secret text,
    password_last_changed timestamp with time zone,
    login_attempts integer DEFAULT 0,
    locked_until timestamp with time zone,
    ultima_actividad timestamp with time zone
);


--
-- Name: usuarios_por_hashear; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.usuarios_por_hashear WITH (security_invoker='true') AS
 SELECT usuarios.id,
    usuarios.password_hash AS password
   FROM public.usuarios
  WHERE ((usuarios.password_hash IS NOT NULL) AND ((usuarios.password_hash !~~ '$2%'::text) OR (usuarios.password_hash = ''::text)) AND (usuarios.estado = true));


--
-- Name: vehiculos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehiculos (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    placa character varying(10) NOT NULL,
    marca text,
    modelo text,
    anio integer,
    color text,
    num_ejes integer,
    capacidad_carga numeric(10,2),
    kilometraje integer DEFAULT 0,
    fecha_adquisicion date,
    fecha_soat date,
    fecha_revision_tecnica date,
    estado character varying(20) DEFAULT 'Operativo'::character varying,
    propietario text,
    tipo_vehiculo character varying(20) DEFAULT 'Tracto'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: viajes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.viajes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    cliente_id uuid,
    conductor_id uuid,
    vehiculo_id uuid,
    origen text NOT NULL,
    destino text NOT NULL,
    fecha_salida timestamp with time zone NOT NULL,
    fecha_llegada timestamp with time zone,
    carga text,
    peso numeric(10,2),
    estado character varying(20) DEFAULT 'Programado'::character varying,
    tarifa numeric(12,2) NOT NULL,
    adelanto numeric(12,2) DEFAULT 0,
    saldo numeric(12,2),
    detraccion boolean DEFAULT false,
    observaciones text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: vista_detracciones_completa; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vista_detracciones_completa WITH (security_invoker='true') AS
 SELECT d.id,
    d.ingreso_id,
    d.viaje_id,
    d.cliente_id,
    d.fecha_deposito,
    d.monto,
    d.porcentaje,
    d.numero_constancia,
    d.fecha_constancia,
    d.estado,
    d.observaciones,
    d.tipo_cuenta,
    d.numero_cuenta,
    d.periodo_tributario,
    d.ruc_proveedor,
    d.nombre_proveedor,
    d.tipo_documento_adquiriente,
    d.numero_documento_adquiriente,
    d.nombre_razon_social_adquiriente,
    d.fecha_pago,
    d.tipo_bien,
    d.tipo_operacion,
    d.tipo_comprobante,
    d.serie_comprobante,
    d.numero_comprobante,
    d.numero_pago_detracciones,
    d.origen_csv,
    d.created_at,
    d.updated_at,
    c.razon_social AS cliente_razon_social,
    c.ruc AS cliente_ruc,
    v.origen AS viaje_origen,
    v.destino AS viaje_destino,
    i.concepto AS ingreso_concepto,
    i.numero_factura AS ingreso_numero_factura
   FROM (((public.detracciones d
     LEFT JOIN public.clientes c ON ((d.cliente_id = c.id)))
     LEFT JOIN public.viajes v ON ((d.viaje_id = v.id)))
     LEFT JOIN public.ingresos i ON ((d.ingreso_id = i.id)));


--
-- Name: vista_viajes_completa; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vista_viajes_completa WITH (security_invoker='true') AS
 SELECT v.id,
    v.cliente_id,
    v.conductor_id,
    v.vehiculo_id,
    v.origen,
    v.destino,
    v.fecha_salida,
    v.fecha_llegada,
    v.carga,
    v.peso,
    v.estado,
    v.tarifa,
    v.adelanto,
    v.saldo,
    v.detraccion,
    v.observaciones,
    v.created_at,
    v.updated_at,
    c.razon_social AS cliente_nombre,
    c.ruc AS cliente_ruc,
    co.nombres AS conductor_nombres,
    co.apellidos AS conductor_apellidos,
    ve.placa AS vehiculo_placa,
    ve.marca AS vehiculo_marca,
    ve.modelo AS vehiculo_modelo
   FROM (((public.viajes v
     LEFT JOIN public.clientes c ON ((v.cliente_id = c.id)))
     LEFT JOIN public.conductores co ON ((v.conductor_id = co.id)))
     LEFT JOIN public.vehiculos ve ON ((v.vehiculo_id = ve.id)));


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
-- Name: auditorias auditorias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditorias
    ADD CONSTRAINT auditorias_pkey PRIMARY KEY (id);


--
-- Name: auth_tokens auth_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_tokens
    ADD CONSTRAINT auth_tokens_pkey PRIMARY KEY (id);


--
-- Name: caja_chica caja_chica_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caja_chica
    ADD CONSTRAINT caja_chica_pkey PRIMARY KEY (id);


--
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: conductores conductores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conductores
    ADD CONSTRAINT conductores_pkey PRIMARY KEY (id);


--
-- Name: configuracion configuracion_clave_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion
    ADD CONSTRAINT configuracion_clave_key UNIQUE (clave);


--
-- Name: configuracion configuracion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion
    ADD CONSTRAINT configuracion_pkey PRIMARY KEY (id);


--
-- Name: cuentas_banco cuentas_banco_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_banco
    ADD CONSTRAINT cuentas_banco_pkey PRIMARY KEY (id);


--
-- Name: detracciones detracciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detracciones
    ADD CONSTRAINT detracciones_pkey PRIMARY KEY (id);


--
-- Name: egresos egresos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.egresos
    ADD CONSTRAINT egresos_pkey PRIMARY KEY (id);


--
-- Name: egresos_sin_factura egresos_sin_factura_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.egresos_sin_factura
    ADD CONSTRAINT egresos_sin_factura_pkey PRIMARY KEY (id);


--
-- Name: empresas empresas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT empresas_pkey PRIMARY KEY (id);


--
-- Name: factura_detalles factura_detalles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_detalles
    ADD CONSTRAINT factura_detalles_pkey PRIMARY KEY (id);


--
-- Name: facturas facturas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_pkey PRIMARY KEY (id);


--
-- Name: facturas facturas_serie_id_numero_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_serie_id_numero_key UNIQUE (serie_id, numero);


--
-- Name: ingresos ingresos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ingresos
    ADD CONSTRAINT ingresos_pkey PRIMARY KEY (id);


--
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: observaciones observaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.observaciones
    ADD CONSTRAINT observaciones_pkey PRIMARY KEY (id);


--
-- Name: series series_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.series
    ADD CONSTRAINT series_pkey PRIMARY KEY (id);


--
-- Name: tipo_cliente tipo_cliente_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_cliente
    ADD CONSTRAINT tipo_cliente_pkey PRIMARY KEY (id);


--
-- Name: tipos_egreso tipos_egreso_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_egreso
    ADD CONSTRAINT tipos_egreso_pkey PRIMARY KEY (id);


--
-- Name: tipos_egreso_sf tipos_egreso_sf_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_egreso_sf
    ADD CONSTRAINT tipos_egreso_sf_pkey PRIMARY KEY (id);


--
-- Name: two_factor_attempts two_factor_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.two_factor_attempts
    ADD CONSTRAINT two_factor_attempts_pkey PRIMARY KEY (id);


--
-- Name: two_factor_auth two_factor_auth_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.two_factor_auth
    ADD CONSTRAINT two_factor_auth_pkey PRIMARY KEY (id);


--
-- Name: two_factor_auth two_factor_auth_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.two_factor_auth
    ADD CONSTRAINT two_factor_auth_user_id_key UNIQUE (user_id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: vehiculos vehiculos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehiculos
    ADD CONSTRAINT vehiculos_pkey PRIMARY KEY (id);


--
-- Name: vehiculos vehiculos_placa_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehiculos
    ADD CONSTRAINT vehiculos_placa_key UNIQUE (placa);


--
-- Name: viajes viajes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viajes
    ADD CONSTRAINT viajes_pkey PRIMARY KEY (id);


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
-- Name: idx_2fa_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_2fa_user_id ON public.two_factor_auth USING btree (user_id);


--
-- Name: idx_auditorias_tabla_accion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditorias_tabla_accion ON public.auditorias USING btree (tabla, accion);


--
-- Name: idx_auditorias_usuario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditorias_usuario_id ON public.auditorias USING btree (usuario_id);


--
-- Name: idx_auth_tokens_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_tokens_expires_at ON public.auth_tokens USING btree (expires_at);


--
-- Name: idx_auth_tokens_token_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_tokens_token_hash ON public.auth_tokens USING btree (md5(token));


--
-- Name: idx_auth_tokens_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_tokens_user_id ON public.auth_tokens USING btree (user_id);


--
-- Name: idx_caja_chica_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_caja_chica_fecha ON public.caja_chica USING btree (fecha);


--
-- Name: idx_caja_chica_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_caja_chica_tipo ON public.caja_chica USING btree (tipo);


--
-- Name: idx_clientes_razon_social; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_razon_social ON public.clientes USING btree (razon_social);


--
-- Name: idx_clientes_ruc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_ruc ON public.clientes USING btree (ruc);


--
-- Name: idx_conductores_dni; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conductores_dni ON public.conductores USING btree (dni);


--
-- Name: idx_conductores_licencia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conductores_licencia ON public.conductores USING btree (licencia);


--
-- Name: idx_conductores_nombres_apellidos; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conductores_nombres_apellidos ON public.conductores USING btree (nombres, apellidos);


--
-- Name: idx_configuracion_clave; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_configuracion_clave ON public.configuracion USING btree (clave);


--
-- Name: idx_cuentas_banco_banco; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cuentas_banco_banco ON public.cuentas_banco USING btree (banco);


--
-- Name: idx_cuentas_banco_moneda; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cuentas_banco_moneda ON public.cuentas_banco USING btree (moneda);


--
-- Name: idx_detracciones_cliente_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_detracciones_cliente_id ON public.detracciones USING btree (cliente_id);


--
-- Name: idx_detracciones_ingreso_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_detracciones_ingreso_id ON public.detracciones USING btree (ingreso_id);


--
-- Name: idx_detracciones_numero_constancia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_detracciones_numero_constancia ON public.detracciones USING btree (numero_constancia);


--
-- Name: idx_detracciones_origen_csv; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_detracciones_origen_csv ON public.detracciones USING btree (origen_csv);


--
-- Name: idx_detracciones_periodo_tributario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_detracciones_periodo_tributario ON public.detracciones USING btree (periodo_tributario);


--
-- Name: idx_detracciones_ruc_proveedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_detracciones_ruc_proveedor ON public.detracciones USING btree (ruc_proveedor);


--
-- Name: idx_detracciones_viaje_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_detracciones_viaje_id ON public.detracciones USING btree (viaje_id);


--
-- Name: idx_egresos_sin_factura_numero_cheque; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_egresos_sin_factura_numero_cheque ON public.egresos_sin_factura USING btree (numero_cheque);


--
-- Name: idx_egresos_sin_factura_numero_liquidacion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_egresos_sin_factura_numero_liquidacion ON public.egresos_sin_factura USING btree (numero_liquidacion);


--
-- Name: idx_egresos_sin_factura_tipo_egreso; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_egresos_sin_factura_tipo_egreso ON public.egresos_sin_factura USING btree (tipo_egreso);


--
-- Name: idx_factura_detalles_factura_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_factura_detalles_factura_id ON public.factura_detalles USING btree (factura_id);


--
-- Name: idx_factura_detalles_viaje_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_factura_detalles_viaje_id ON public.factura_detalles USING btree (viaje_id);


--
-- Name: idx_facturas_cliente_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_facturas_cliente_id ON public.facturas USING btree (cliente_id);


--
-- Name: idx_facturas_serie_numero; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_facturas_serie_numero ON public.facturas USING btree (serie_id, numero);


--
-- Name: idx_ingresos_cliente_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ingresos_cliente_id ON public.ingresos USING btree (cliente_id);


--
-- Name: idx_ingresos_numero_factura; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ingresos_numero_factura ON public.ingresos USING btree (numero_factura);


--
-- Name: idx_ingresos_viaje_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ingresos_viaje_id ON public.ingresos USING btree (viaje_id);


--
-- Name: idx_observaciones_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_observaciones_fecha ON public.observaciones USING btree (fecha_creacion);


--
-- Name: idx_series_serie; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_series_serie ON public.series USING btree (serie);


--
-- Name: idx_tipos_egreso_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tipos_egreso_tipo ON public.tipos_egreso USING btree (tipo);


--
-- Name: idx_usuarios_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_email ON public.usuarios USING btree (email);


--
-- Name: idx_usuarios_telefono; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_telefono ON public.usuarios USING btree (telefono);


--
-- Name: idx_usuarios_ultima_actividad; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_ultima_actividad ON public.usuarios USING btree (ultima_actividad);


--
-- Name: idx_vehiculos_placa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehiculos_placa ON public.vehiculos USING btree (placa);


--
-- Name: idx_viajes_cliente_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_viajes_cliente_id ON public.viajes USING btree (cliente_id);


--
-- Name: idx_viajes_conductor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_viajes_conductor_id ON public.viajes USING btree (conductor_id);


--
-- Name: idx_viajes_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_viajes_estado ON public.viajes USING btree (estado);


--
-- Name: idx_viajes_vehiculo_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_viajes_vehiculo_id ON public.viajes USING btree (vehiculo_id);


--
-- Name: login_attempts_success_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX login_attempts_success_idx ON public.login_attempts USING btree (is_successful);


--
-- Name: login_attempts_timestamp_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX login_attempts_timestamp_idx ON public.login_attempts USING btree ("timestamp");


--
-- Name: login_attempts_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX login_attempts_user_id_idx ON public.login_attempts USING btree (user_id);


--
-- Name: login_attempts_username_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX login_attempts_username_idx ON public.login_attempts USING btree (username);


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
-- Name: two_factor_attempts clean_2fa_attempts_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER clean_2fa_attempts_trigger AFTER INSERT ON public.two_factor_attempts FOR EACH STATEMENT EXECUTE FUNCTION public.trigger_clean_old_2fa_attempts();


--
-- Name: auth_tokens clean_tokens_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER clean_tokens_trigger AFTER INSERT ON public.auth_tokens FOR EACH STATEMENT EXECUTE FUNCTION public.trigger_clean_expired_tokens();


--
-- Name: usuarios hash_passwords_before_save; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER hash_passwords_before_save BEFORE INSERT OR UPDATE OF password_hash ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.hash_password_trigger();


--
-- Name: egresos_sin_factura set_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.egresos_sin_factura FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- Name: viajes trigger_actualizar_saldo_viaje; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_actualizar_saldo_viaje BEFORE INSERT OR UPDATE ON public.viajes FOR EACH ROW EXECUTE FUNCTION public.actualizar_saldo_viaje();


--
-- Name: caja_chica update_caja_chica_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_caja_chica_updated_at BEFORE UPDATE ON public.caja_chica FOR EACH ROW EXECUTE FUNCTION public.update_caja_chica_modified_column();


--
-- Name: login_attempts update_user_locks_after_failed_attempt; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_locks_after_failed_attempt AFTER INSERT ON public.login_attempts FOR EACH ROW EXECUTE FUNCTION public.check_and_update_user_locks();


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
-- Name: auditorias auditorias_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditorias
    ADD CONSTRAINT auditorias_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: auth_tokens auth_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_tokens
    ADD CONSTRAINT auth_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: clientes clientes_tipo_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_tipo_cliente_id_fkey FOREIGN KEY (tipo_cliente_id) REFERENCES public.tipo_cliente(id);


--
-- Name: detracciones detracciones_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detracciones
    ADD CONSTRAINT detracciones_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: detracciones detracciones_ingreso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detracciones
    ADD CONSTRAINT detracciones_ingreso_id_fkey FOREIGN KEY (ingreso_id) REFERENCES public.ingresos(id);


--
-- Name: detracciones detracciones_viaje_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detracciones
    ADD CONSTRAINT detracciones_viaje_id_fkey FOREIGN KEY (viaje_id) REFERENCES public.viajes(id);


--
-- Name: egresos_sin_factura egresos_sin_factura_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.egresos_sin_factura
    ADD CONSTRAINT egresos_sin_factura_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: factura_detalles factura_detalles_factura_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_detalles
    ADD CONSTRAINT factura_detalles_factura_id_fkey FOREIGN KEY (factura_id) REFERENCES public.facturas(id) ON DELETE CASCADE;


--
-- Name: login_attempts login_attempts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: two_factor_attempts two_factor_attempts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.two_factor_attempts
    ADD CONSTRAINT two_factor_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: two_factor_auth two_factor_auth_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.two_factor_auth
    ADD CONSTRAINT two_factor_auth_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: viajes viajes_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viajes
    ADD CONSTRAINT viajes_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: viajes viajes_conductor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viajes
    ADD CONSTRAINT viajes_conductor_id_fkey FOREIGN KEY (conductor_id) REFERENCES public.conductores(id);


--
-- Name: viajes viajes_vehiculo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viajes
    ADD CONSTRAINT viajes_vehiculo_id_fkey FOREIGN KEY (vehiculo_id) REFERENCES public.vehiculos(id);


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
-- Name: caja_chica Administradores y gerentes pueden crear registros en caja chica; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Administradores y gerentes pueden crear registros en caja chica" ON public.caja_chica FOR INSERT WITH CHECK (((auth.role() = ANY (ARRAY['authenticated'::text, 'service_role'::text])) AND (EXISTS ( SELECT 1
   FROM public.usuarios
  WHERE ((auth.uid() = usuarios.id) AND ((usuarios.rol)::text = ANY ((ARRAY['admin'::character varying, 'manager'::character varying])::text[])))))));


--
-- Name: clientes All_clientes_up; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "All_clientes_up" ON public.clientes USING (true) WITH CHECK (true);


--
-- Name: egresos_sin_factura Allow full access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow full access for authenticated users" ON public.egresos_sin_factura TO authenticated USING (true) WITH CHECK (true);


--
-- Name: caja_chica Caja_chica_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Caja_chica_all" ON public.caja_chica USING (true) WITH CHECK (true);


--
-- Name: empresas Los usuarios autenticados pueden actualizar empresas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Los usuarios autenticados pueden actualizar empresas" ON public.empresas FOR UPDATE USING ((auth.role() = 'authenticated'::text));


--
-- Name: empresas Los usuarios autenticados pueden eliminar empresas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Los usuarios autenticados pueden eliminar empresas" ON public.empresas FOR DELETE USING ((auth.role() = 'authenticated'::text));


--
-- Name: empresas Los usuarios autenticados pueden insertar empresas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Los usuarios autenticados pueden insertar empresas" ON public.empresas FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: empresas Los usuarios autenticados pueden ver las empresas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Los usuarios autenticados pueden ver las empresas" ON public.empresas FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: usuarios Los usuarios pueden actualizar su propia información; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Los usuarios pueden actualizar su propia información" ON public.usuarios FOR UPDATE USING ((auth.uid() = id));


--
-- Name: notifications Los usuarios pueden marcar sus propias notificaciones como leí; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Los usuarios pueden marcar sus propias notificaciones como leí" ON public.notifications FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: usuarios Los usuarios pueden ver su propia información; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Los usuarios pueden ver su propia información" ON public.usuarios FOR SELECT USING ((auth.uid() = id));


--
-- Name: notifications Los usuarios pueden ver sus propias notificaciones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Los usuarios pueden ver sus propias notificaciones" ON public.notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: egresos_sin_factura PERMITIR ENABLE SELECT; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "PERMITIR ENABLE SELECT" ON public.egresos_sin_factura FOR SELECT USING (true);


--
-- Name: egresos_sin_factura PERMITIR ENABLE all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "PERMITIR ENABLE all" ON public.egresos_sin_factura USING (true) WITH CHECK (true);


--
-- Name: categorias Permitir delete para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir delete para usuarios anónimos" ON public.categorias FOR DELETE TO anon USING (true);


--
-- Name: clientes Permitir delete para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir delete para usuarios anónimos" ON public.clientes FOR DELETE TO anon USING (true);


--
-- Name: conductores Permitir delete para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir delete para usuarios anónimos" ON public.conductores FOR DELETE TO anon USING (true);


--
-- Name: cuentas_banco Permitir delete para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir delete para usuarios anónimos" ON public.cuentas_banco FOR DELETE TO anon USING (true);


--
-- Name: detracciones Permitir delete para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir delete para usuarios anónimos" ON public.detracciones FOR DELETE TO anon USING (true);


--
-- Name: factura_detalles Permitir delete para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir delete para usuarios anónimos" ON public.factura_detalles FOR DELETE TO anon USING (true);


--
-- Name: facturas Permitir delete para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir delete para usuarios anónimos" ON public.facturas FOR DELETE TO anon USING (true);


--
-- Name: ingresos Permitir delete para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir delete para usuarios anónimos" ON public.ingresos FOR DELETE TO anon USING (true);


--
-- Name: observaciones Permitir delete para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir delete para usuarios anónimos" ON public.observaciones FOR DELETE TO anon USING (true);


--
-- Name: series Permitir delete para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir delete para usuarios anónimos" ON public.series FOR DELETE TO anon USING (true);


--
-- Name: tipo_cliente Permitir delete para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir delete para usuarios anónimos" ON public.tipo_cliente FOR DELETE TO anon USING (true);


--
-- Name: tipos_egreso Permitir delete para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir delete para usuarios anónimos" ON public.tipos_egreso FOR DELETE TO anon USING (true);


--
-- Name: tipos_egreso_sf Permitir delete para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir delete para usuarios anónimos" ON public.tipos_egreso_sf FOR DELETE TO anon USING (true);


--
-- Name: usuarios Permitir delete para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir delete para usuarios anónimos" ON public.usuarios FOR DELETE TO anon USING (true);


--
-- Name: vehiculos Permitir delete para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir delete para usuarios anónimos" ON public.vehiculos FOR DELETE TO anon USING (true);


--
-- Name: viajes Permitir delete para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir delete para usuarios anónimos" ON public.viajes FOR DELETE TO anon USING (true);


--
-- Name: auditorias Permitir insert para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir insert para usuarios anónimos" ON public.auditorias FOR INSERT TO anon WITH CHECK (true);


--
-- Name: categorias Permitir insert para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir insert para usuarios anónimos" ON public.categorias FOR INSERT TO anon WITH CHECK (true);


--
-- Name: clientes Permitir insert para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir insert para usuarios anónimos" ON public.clientes FOR INSERT TO anon WITH CHECK (true);


--
-- Name: conductores Permitir insert para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir insert para usuarios anónimos" ON public.conductores FOR INSERT TO anon WITH CHECK (true);


--
-- Name: cuentas_banco Permitir insert para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir insert para usuarios anónimos" ON public.cuentas_banco FOR INSERT TO anon WITH CHECK (true);


--
-- Name: detracciones Permitir insert para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir insert para usuarios anónimos" ON public.detracciones FOR INSERT TO anon WITH CHECK (true);


--
-- Name: factura_detalles Permitir insert para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir insert para usuarios anónimos" ON public.factura_detalles FOR INSERT TO anon WITH CHECK (true);


--
-- Name: facturas Permitir insert para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir insert para usuarios anónimos" ON public.facturas FOR INSERT TO anon WITH CHECK (true);


--
-- Name: ingresos Permitir insert para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir insert para usuarios anónimos" ON public.ingresos FOR INSERT TO anon WITH CHECK (true);


--
-- Name: observaciones Permitir insert para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir insert para usuarios anónimos" ON public.observaciones FOR INSERT TO anon WITH CHECK (true);


--
-- Name: series Permitir insert para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir insert para usuarios anónimos" ON public.series FOR INSERT TO anon WITH CHECK (true);


--
-- Name: tipo_cliente Permitir insert para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir insert para usuarios anónimos" ON public.tipo_cliente FOR INSERT TO anon WITH CHECK (true);


--
-- Name: tipos_egreso Permitir insert para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir insert para usuarios anónimos" ON public.tipos_egreso FOR INSERT TO anon WITH CHECK (true);


--
-- Name: tipos_egreso_sf Permitir insert para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir insert para usuarios anónimos" ON public.tipos_egreso_sf FOR INSERT TO anon WITH CHECK (true);


--
-- Name: usuarios Permitir insert para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir insert para usuarios anónimos" ON public.usuarios FOR INSERT TO anon WITH CHECK (true);


--
-- Name: vehiculos Permitir insert para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir insert para usuarios anónimos" ON public.vehiculos FOR INSERT TO anon WITH CHECK (true);


--
-- Name: viajes Permitir insert para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir insert para usuarios anónimos" ON public.viajes FOR INSERT TO anon WITH CHECK (true);


--
-- Name: auditorias Permitir select para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir select para usuarios anónimos" ON public.auditorias FOR SELECT TO anon USING (true);


--
-- Name: categorias Permitir select para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir select para usuarios anónimos" ON public.categorias FOR SELECT TO anon USING (true);


--
-- Name: clientes Permitir select para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir select para usuarios anónimos" ON public.clientes FOR SELECT TO anon USING (true);


--
-- Name: conductores Permitir select para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir select para usuarios anónimos" ON public.conductores FOR SELECT TO anon USING (true);


--
-- Name: configuracion Permitir select para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir select para usuarios anónimos" ON public.configuracion FOR SELECT TO anon USING (true);


--
-- Name: cuentas_banco Permitir select para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir select para usuarios anónimos" ON public.cuentas_banco FOR SELECT TO anon USING (true);


--
-- Name: detracciones Permitir select para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir select para usuarios anónimos" ON public.detracciones FOR SELECT TO anon USING (true);


--
-- Name: factura_detalles Permitir select para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir select para usuarios anónimos" ON public.factura_detalles FOR SELECT TO anon USING (true);


--
-- Name: facturas Permitir select para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir select para usuarios anónimos" ON public.facturas FOR SELECT TO anon USING (true);


--
-- Name: ingresos Permitir select para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir select para usuarios anónimos" ON public.ingresos FOR SELECT TO anon USING (true);


--
-- Name: observaciones Permitir select para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir select para usuarios anónimos" ON public.observaciones FOR SELECT TO anon USING (true);


--
-- Name: series Permitir select para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir select para usuarios anónimos" ON public.series FOR SELECT TO anon USING (true);


--
-- Name: tipo_cliente Permitir select para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir select para usuarios anónimos" ON public.tipo_cliente FOR SELECT TO anon USING (true);


--
-- Name: tipos_egreso Permitir select para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir select para usuarios anónimos" ON public.tipos_egreso FOR SELECT TO anon USING (true);


--
-- Name: tipos_egreso_sf Permitir select para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir select para usuarios anónimos" ON public.tipos_egreso_sf FOR SELECT TO anon USING (true);


--
-- Name: usuarios Permitir select para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir select para usuarios anónimos" ON public.usuarios FOR SELECT TO anon USING (true);


--
-- Name: vehiculos Permitir select para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir select para usuarios anónimos" ON public.vehiculos FOR SELECT TO anon USING (true);


--
-- Name: viajes Permitir select para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir select para usuarios anónimos" ON public.viajes FOR SELECT TO anon USING (true);


--
-- Name: categorias Permitir update para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir update para usuarios anónimos" ON public.categorias FOR UPDATE TO anon USING (true) WITH CHECK (true);


--
-- Name: clientes Permitir update para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir update para usuarios anónimos" ON public.clientes FOR UPDATE TO anon USING (true) WITH CHECK (true);


--
-- Name: conductores Permitir update para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir update para usuarios anónimos" ON public.conductores FOR UPDATE TO anon USING (true) WITH CHECK (true);


--
-- Name: configuracion Permitir update para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir update para usuarios anónimos" ON public.configuracion FOR UPDATE TO anon USING (true) WITH CHECK (true);


--
-- Name: cuentas_banco Permitir update para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir update para usuarios anónimos" ON public.cuentas_banco FOR UPDATE TO anon USING (true) WITH CHECK (true);


--
-- Name: detracciones Permitir update para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir update para usuarios anónimos" ON public.detracciones FOR UPDATE TO anon USING (true) WITH CHECK (true);


--
-- Name: factura_detalles Permitir update para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir update para usuarios anónimos" ON public.factura_detalles FOR UPDATE TO anon USING (true) WITH CHECK (true);


--
-- Name: facturas Permitir update para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir update para usuarios anónimos" ON public.facturas FOR UPDATE TO anon USING (true) WITH CHECK (true);


--
-- Name: ingresos Permitir update para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir update para usuarios anónimos" ON public.ingresos FOR UPDATE TO anon USING (true) WITH CHECK (true);


--
-- Name: observaciones Permitir update para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir update para usuarios anónimos" ON public.observaciones FOR UPDATE TO anon USING (true) WITH CHECK (true);


--
-- Name: series Permitir update para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir update para usuarios anónimos" ON public.series FOR UPDATE TO anon USING (true) WITH CHECK (true);


--
-- Name: tipo_cliente Permitir update para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir update para usuarios anónimos" ON public.tipo_cliente FOR UPDATE TO anon USING (true) WITH CHECK (true);


--
-- Name: tipos_egreso Permitir update para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir update para usuarios anónimos" ON public.tipos_egreso FOR UPDATE TO anon USING (true) WITH CHECK (true);


--
-- Name: tipos_egreso_sf Permitir update para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir update para usuarios anónimos" ON public.tipos_egreso_sf FOR UPDATE TO anon USING (true) WITH CHECK (true);


--
-- Name: usuarios Permitir update para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir update para usuarios anónimos" ON public.usuarios FOR UPDATE TO anon USING (true) WITH CHECK (true);


--
-- Name: vehiculos Permitir update para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir update para usuarios anónimos" ON public.vehiculos FOR UPDATE TO anon USING (true) WITH CHECK (true);


--
-- Name: viajes Permitir update para usuarios anónimos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir update para usuarios anónimos" ON public.viajes FOR UPDATE TO anon USING (true) WITH CHECK (true);


--
-- Name: caja_chica Solo administradores pueden eliminar registros de caja chica; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Solo administradores pueden eliminar registros de caja chica" ON public.caja_chica FOR DELETE USING (((auth.role() = ANY (ARRAY['authenticated'::text, 'service_role'::text])) AND (EXISTS ( SELECT 1
   FROM public.usuarios
  WHERE ((auth.uid() = usuarios.id) AND ((usuarios.rol)::text = 'admin'::text))))));


--
-- Name: caja_chica Usuarios autenticados pueden ver registros de caja chica; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuarios autenticados pueden ver registros de caja chica" ON public.caja_chica FOR SELECT USING ((auth.role() = ANY (ARRAY['authenticated'::text, 'service_role'::text])));


--
-- Name: two_factor_attempts admin_view_all_2fa_attempts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_view_all_2fa_attempts ON public.two_factor_attempts FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.usuarios u
  WHERE ((u.id = auth.uid()) AND ((u.rol)::text = 'admin'::text)))));


--
-- Name: two_factor_auth admin_view_all_2fa_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_view_all_2fa_config ON public.two_factor_auth FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.usuarios u
  WHERE ((u.id = auth.uid()) AND ((u.rol)::text = 'admin'::text)))));


--
-- Name: auth_tokens admin_view_all_tokens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_view_all_tokens ON public.auth_tokens FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.usuarios u
  WHERE ((u.id = auth.uid()) AND ((u.rol)::text = 'admin'::text)))));


--
-- Name: auditorias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.auditorias ENABLE ROW LEVEL SECURITY;

--
-- Name: auth_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.auth_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: caja_chica; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.caja_chica ENABLE ROW LEVEL SECURITY;

--
-- Name: categorias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

--
-- Name: clientes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

--
-- Name: conductores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conductores ENABLE ROW LEVEL SECURITY;

--
-- Name: configuracion; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

--
-- Name: cuentas_banco; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cuentas_banco ENABLE ROW LEVEL SECURITY;

--
-- Name: detracciones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.detracciones ENABLE ROW LEVEL SECURITY;

--
-- Name: egresos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.egresos ENABLE ROW LEVEL SECURITY;

--
-- Name: egresos egresos_full; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY egresos_full ON public.egresos USING (true) WITH CHECK (true);


--
-- Name: egresos_sin_factura; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.egresos_sin_factura ENABLE ROW LEVEL SECURITY;

--
-- Name: empresas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

--
-- Name: factura_detalles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.factura_detalles ENABLE ROW LEVEL SECURITY;

--
-- Name: facturas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;

--
-- Name: ingresos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ingresos ENABLE ROW LEVEL SECURITY;

--
-- Name: login_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: login_attempts login_attempts_admin_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY login_attempts_admin_policy ON public.login_attempts TO authenticated USING (((auth.jwt() ->> 'rol'::text) = 'admin'::text)) WITH CHECK (((auth.jwt() ->> 'rol'::text) = 'admin'::text));


--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: observaciones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.observaciones ENABLE ROW LEVEL SECURITY;

--
-- Name: empresas permitir modificar emp; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "permitir modificar emp" ON public.empresas USING (true) WITH CHECK (true);


--
-- Name: series; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;

--
-- Name: tipo_cliente; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tipo_cliente ENABLE ROW LEVEL SECURITY;

--
-- Name: tipos_egreso; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tipos_egreso ENABLE ROW LEVEL SECURITY;

--
-- Name: tipos_egreso_sf; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tipos_egreso_sf ENABLE ROW LEVEL SECURITY;

--
-- Name: two_factor_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.two_factor_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: two_factor_auth; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.two_factor_auth ENABLE ROW LEVEL SECURITY;

--
-- Name: usuarios; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

--
-- Name: vehiculos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;

--
-- Name: viajes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.viajes ENABLE ROW LEVEL SECURITY;

--
-- Name: two_factor_attempts view_own_2fa_attempts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY view_own_2fa_attempts ON public.two_factor_attempts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: two_factor_auth view_own_2fa_config; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY view_own_2fa_config ON public.two_factor_auth FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: auth_tokens view_own_tokens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY view_own_tokens ON public.auth_tokens FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

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
-- Name: idx_ingresos_viaje_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ingresos_viaje_id ON public.ingresos USING btree (viaje_id);

--
-- Name: idx_ingresos_total_monto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ingresos_total_monto ON public.ingresos USING btree (total_monto);

--
-- Name: idx_ingresos_total_deber; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ingresos_total_deber ON public.ingresos USING btree (total_deber);

--
-- Name: idx_observaciones_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_observaciones_fecha ON public.observaciones USING btree (fecha_creacion);

--
-- Name: idx_ingresos_observacion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ingresos_observacion ON public.ingresos USING btree (observacion);

--
-- Name: idx_ingresos_num_op_primera; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ingresos_num_op_primera ON public.ingresos USING btree (num_operacion_primera_cuota);

--
-- Name: idx_ingresos_num_op_segunda; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ingresos_num_op_segunda ON public.ingresos USING btree (num_operacion_segunda_cuota);

--
-- Name: idx_ingresos_documento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ingresos_documento ON public.ingresos USING btree (documento);

--
-- Name: PostgreSQL database dump complete
--

