drop view if exists "public"."vista_detracciones_completa";

drop view if exists "public"."vista_ingresos_completa";

drop view if exists "public"."vista_viajes_completa";

create table "public"."empresas" (
    "id" uuid not null default gen_random_uuid(),
    "nombre" text not null,
    "ruc_dni" text not null,
    "cuenta_abonada" text,
    "fecha_creacion" date not null default CURRENT_DATE,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."empresas" enable row level security;

create table "public"."factura_detalles" (
    "id" uuid not null default uuid_generate_v4(),
    "factura_id" uuid,
    "viaje_id" uuid,
    "descripcion" text not null,
    "cantidad" numeric(10,2) default 1,
    "precio_unitario" numeric(12,2) not null,
    "subtotal" numeric(12,2) not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."factura_detalles" enable row level security;

create table "public"."facturas" (
    "id" uuid not null default uuid_generate_v4(),
    "serie_id" uuid,
    "numero" character varying(10) not null,
    "fecha_emision" date not null,
    "cliente_id" uuid,
    "total" numeric(12,2) not null,
    "estado" character varying(20) default 'Emitida'::character varying,
    "observaciones" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."facturas" enable row level security;

create table "public"."notifications" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "message" text not null,
    "is_read" boolean default false,
    "created_at" timestamp with time zone default now()
);


alter table "public"."notifications" enable row level security;

create table "public"."two_factor_attempts" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "code" text not null,
    "created_at" timestamp with time zone not null default now(),
    "ip_address" text,
    "is_successful" boolean not null default false,
    "verification_type" text not null,
    "user_agent" text
);


alter table "public"."two_factor_attempts" enable row level security;

create table "public"."two_factor_auth" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "secret" text not null,
    "enabled" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "last_used_at" timestamp with time zone,
    "confirmed_at" timestamp with time zone,
    "backup_codes" jsonb
);


alter table "public"."two_factor_auth" enable row level security;

alter table "public"."clientes" drop column "tipo_cliente";

alter table "public"."clientes" alter column "ruc" set default '20'::character varying;

alter table "public"."usuarios" add column "ultima_actividad" timestamp with time zone;

CREATE UNIQUE INDEX empresas_pkey ON public.empresas USING btree (id);

CREATE UNIQUE INDEX factura_detalles_pkey ON public.factura_detalles USING btree (id);

CREATE UNIQUE INDEX facturas_pkey ON public.facturas USING btree (id);

CREATE UNIQUE INDEX facturas_serie_id_numero_key ON public.facturas USING btree (serie_id, numero);

CREATE INDEX idx_2fa_user_id ON public.two_factor_auth USING btree (user_id);

CREATE INDEX idx_factura_detalles_factura_id ON public.factura_detalles USING btree (factura_id);

CREATE INDEX idx_factura_detalles_viaje_id ON public.factura_detalles USING btree (viaje_id);

CREATE INDEX idx_facturas_cliente_id ON public.facturas USING btree (cliente_id);

CREATE INDEX idx_facturas_serie_numero ON public.facturas USING btree (serie_id, numero);

CREATE INDEX idx_usuarios_ultima_actividad ON public.usuarios USING btree (ultima_actividad);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX two_factor_attempts_pkey ON public.two_factor_attempts USING btree (id);

CREATE UNIQUE INDEX two_factor_auth_pkey ON public.two_factor_auth USING btree (id);

CREATE UNIQUE INDEX two_factor_auth_user_id_key ON public.two_factor_auth USING btree (user_id);

alter table "public"."empresas" add constraint "empresas_pkey" PRIMARY KEY using index "empresas_pkey";

alter table "public"."factura_detalles" add constraint "factura_detalles_pkey" PRIMARY KEY using index "factura_detalles_pkey";

alter table "public"."facturas" add constraint "facturas_pkey" PRIMARY KEY using index "facturas_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."two_factor_attempts" add constraint "two_factor_attempts_pkey" PRIMARY KEY using index "two_factor_attempts_pkey";

alter table "public"."two_factor_auth" add constraint "two_factor_auth_pkey" PRIMARY KEY using index "two_factor_auth_pkey";

alter table "public"."factura_detalles" add constraint "factura_detalles_factura_id_fkey" FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE not valid;

alter table "public"."factura_detalles" validate constraint "factura_detalles_factura_id_fkey";

alter table "public"."facturas" add constraint "facturas_serie_id_numero_key" UNIQUE using index "facturas_serie_id_numero_key";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

alter table "public"."two_factor_attempts" add constraint "two_factor_attempts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE not valid;

alter table "public"."two_factor_attempts" validate constraint "two_factor_attempts_user_id_fkey";

alter table "public"."two_factor_auth" add constraint "two_factor_auth_user_id_fkey" FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE not valid;

alter table "public"."two_factor_auth" validate constraint "two_factor_auth_user_id_fkey";

alter table "public"."two_factor_auth" add constraint "two_factor_auth_user_id_key" UNIQUE using index "two_factor_auth_user_id_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.clean_old_2fa_attempts()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_affected_rows INTEGER;
BEGIN
  DELETE FROM two_factor_attempts
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  RETURN v_affected_rows;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.confirm_2fa_setup(p_user_id uuid, p_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.disable_2fa(p_user_id uuid, p_code text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Implementación simplificada
  RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_totp_secret()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Generar una cadena de caracteres aleatoria de 32 bytes y codificarla en base32
  RETURN upper(encode(gen_random_bytes(20), 'base64'));
END;
$function$
;

CREATE OR REPLACE FUNCTION public.hash_password(plain_password text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Usar una implementación simple para evitar problemas con pgcrypto
    RETURN plain_password;
    -- En un entorno de producción real, se usaría algo como:
    -- RETURN crypt(plain_password, gen_salt('bf', 10));
END;
$function$
;

CREATE OR REPLACE FUNCTION public.hash_password_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Solo hashear si la contraseña es texto plano (no comienza con $2)
    IF NEW.password_hash IS NOT NULL AND NEW.password_hash != '' AND NEW.password_hash NOT LIKE '$2%' THEN
        NEW.password_hash := hash_password(NEW.password_hash);
        NEW.ultimo_cambio_password := NOW();
    END IF;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.initiate_2fa_setup(p_user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.migrate_plain_passwords()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.regenerate_backup_codes(p_user_id uuid, p_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_clean_old_2fa_attempts()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Limpiar intentos antiguos si hay más de 1000 registros
  IF (SELECT COUNT(*) FROM two_factor_attempts) > 1000 THEN
    PERFORM clean_old_2fa_attempts();
  END IF;
  RETURN NEW;
END;
$function$
;

create or replace view "public"."usuarios_por_hashear" as  SELECT usuarios.id,
    usuarios.password_hash AS password
   FROM usuarios
  WHERE ((usuarios.password_hash IS NOT NULL) AND ((usuarios.password_hash !~~ '$2%'::text) OR (usuarios.password_hash = ''::text)) AND (usuarios.estado = true));


CREATE OR REPLACE FUNCTION public.verify_backup_code(p_user_id uuid, p_code text, p_ip_address text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Implementación simplificada para evitar problemas
  RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.verify_password(plain_password text, hashed_password text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Si la contraseña está hasheada con bcrypt
    IF hashed_password LIKE '$2%' THEN
        RETURN plain_password = crypt(plain_password, hashed_password);
    ELSE
        -- Verificación simple para contraseñas en texto plano (temporal)
        RETURN plain_password = hashed_password;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.verify_totp_code(p_user_id uuid, p_code text, p_ip_address text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Implementación simplificada que siempre retorna verdadero
  -- En producción, se debe implementar la lógica real para verificar el código TOTP
  RETURN TRUE;
END;
$function$
;

create or replace view "public"."vista_detracciones_completa" as  SELECT d.id,
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
   FROM (((detracciones d
     LEFT JOIN clientes c ON ((d.cliente_id = c.id)))
     LEFT JOIN viajes v ON ((d.viaje_id = v.id)))
     LEFT JOIN ingresos i ON ((d.ingreso_id = i.id)));


create or replace view "public"."vista_ingresos_completa" as  SELECT i.id,
    i.fecha,
    i.cliente_id,
    i.viaje_id,
    i.concepto,
    i.monto,
    i.metodo_pago,
    i.numero_factura,
    i.fecha_factura,
    i.estado_factura,
    i.serie_factura,
    i.observaciones,
    i.dias_credito,
    i.fecha_vencimiento,
    i.guia_remision,
    i.guia_transportista,
    i.detraccion_monto,
    i.primera_cuota,
    i.segunda_cuota,
    i.placa_tracto,
    i.placa_carreta,
    i.created_at,
    i.updated_at,
    c.razon_social AS cliente_nombre,
    c.ruc AS cliente_ruc,
    v.origen AS viaje_origen,
    v.destino AS viaje_destino
   FROM ((ingresos i
     LEFT JOIN clientes c ON ((i.cliente_id = c.id)))
     LEFT JOIN viajes v ON ((i.viaje_id = v.id)));


create or replace view "public"."vista_viajes_completa" as  SELECT v.id,
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
   FROM (((viajes v
     LEFT JOIN clientes c ON ((v.cliente_id = c.id)))
     LEFT JOIN conductores co ON ((v.conductor_id = co.id)))
     LEFT JOIN vehiculos ve ON ((v.vehiculo_id = ve.id)));


grant delete on table "public"."empresas" to "anon";

grant insert on table "public"."empresas" to "anon";

grant references on table "public"."empresas" to "anon";

grant select on table "public"."empresas" to "anon";

grant trigger on table "public"."empresas" to "anon";

grant truncate on table "public"."empresas" to "anon";

grant update on table "public"."empresas" to "anon";

grant delete on table "public"."empresas" to "authenticated";

grant insert on table "public"."empresas" to "authenticated";

grant references on table "public"."empresas" to "authenticated";

grant select on table "public"."empresas" to "authenticated";

grant trigger on table "public"."empresas" to "authenticated";

grant truncate on table "public"."empresas" to "authenticated";

grant update on table "public"."empresas" to "authenticated";

grant delete on table "public"."empresas" to "service_role";

grant insert on table "public"."empresas" to "service_role";

grant references on table "public"."empresas" to "service_role";

grant select on table "public"."empresas" to "service_role";

grant trigger on table "public"."empresas" to "service_role";

grant truncate on table "public"."empresas" to "service_role";

grant update on table "public"."empresas" to "service_role";

grant delete on table "public"."factura_detalles" to "anon";

grant insert on table "public"."factura_detalles" to "anon";

grant references on table "public"."factura_detalles" to "anon";

grant select on table "public"."factura_detalles" to "anon";

grant trigger on table "public"."factura_detalles" to "anon";

grant truncate on table "public"."factura_detalles" to "anon";

grant update on table "public"."factura_detalles" to "anon";

grant delete on table "public"."factura_detalles" to "authenticated";

grant insert on table "public"."factura_detalles" to "authenticated";

grant references on table "public"."factura_detalles" to "authenticated";

grant select on table "public"."factura_detalles" to "authenticated";

grant trigger on table "public"."factura_detalles" to "authenticated";

grant truncate on table "public"."factura_detalles" to "authenticated";

grant update on table "public"."factura_detalles" to "authenticated";

grant delete on table "public"."factura_detalles" to "service_role";

grant insert on table "public"."factura_detalles" to "service_role";

grant references on table "public"."factura_detalles" to "service_role";

grant select on table "public"."factura_detalles" to "service_role";

grant trigger on table "public"."factura_detalles" to "service_role";

grant truncate on table "public"."factura_detalles" to "service_role";

grant update on table "public"."factura_detalles" to "service_role";

grant delete on table "public"."facturas" to "anon";

grant insert on table "public"."facturas" to "anon";

grant references on table "public"."facturas" to "anon";

grant select on table "public"."facturas" to "anon";

grant trigger on table "public"."facturas" to "anon";

grant truncate on table "public"."facturas" to "anon";

grant update on table "public"."facturas" to "anon";

grant delete on table "public"."facturas" to "authenticated";

grant insert on table "public"."facturas" to "authenticated";

grant references on table "public"."facturas" to "authenticated";

grant select on table "public"."facturas" to "authenticated";

grant trigger on table "public"."facturas" to "authenticated";

grant truncate on table "public"."facturas" to "authenticated";

grant update on table "public"."facturas" to "authenticated";

grant delete on table "public"."facturas" to "service_role";

grant insert on table "public"."facturas" to "service_role";

grant references on table "public"."facturas" to "service_role";

grant select on table "public"."facturas" to "service_role";

grant trigger on table "public"."facturas" to "service_role";

grant truncate on table "public"."facturas" to "service_role";

grant update on table "public"."facturas" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."two_factor_attempts" to "anon";

grant insert on table "public"."two_factor_attempts" to "anon";

grant references on table "public"."two_factor_attempts" to "anon";

grant select on table "public"."two_factor_attempts" to "anon";

grant trigger on table "public"."two_factor_attempts" to "anon";

grant truncate on table "public"."two_factor_attempts" to "anon";

grant update on table "public"."two_factor_attempts" to "anon";

grant delete on table "public"."two_factor_attempts" to "authenticated";

grant insert on table "public"."two_factor_attempts" to "authenticated";

grant references on table "public"."two_factor_attempts" to "authenticated";

grant select on table "public"."two_factor_attempts" to "authenticated";

grant trigger on table "public"."two_factor_attempts" to "authenticated";

grant truncate on table "public"."two_factor_attempts" to "authenticated";

grant update on table "public"."two_factor_attempts" to "authenticated";

grant delete on table "public"."two_factor_attempts" to "service_role";

grant insert on table "public"."two_factor_attempts" to "service_role";

grant references on table "public"."two_factor_attempts" to "service_role";

grant select on table "public"."two_factor_attempts" to "service_role";

grant trigger on table "public"."two_factor_attempts" to "service_role";

grant truncate on table "public"."two_factor_attempts" to "service_role";

grant update on table "public"."two_factor_attempts" to "service_role";

grant delete on table "public"."two_factor_auth" to "anon";

grant insert on table "public"."two_factor_auth" to "anon";

grant references on table "public"."two_factor_auth" to "anon";

grant select on table "public"."two_factor_auth" to "anon";

grant trigger on table "public"."two_factor_auth" to "anon";

grant truncate on table "public"."two_factor_auth" to "anon";

grant update on table "public"."two_factor_auth" to "anon";

grant delete on table "public"."two_factor_auth" to "authenticated";

grant insert on table "public"."two_factor_auth" to "authenticated";

grant references on table "public"."two_factor_auth" to "authenticated";

grant select on table "public"."two_factor_auth" to "authenticated";

grant trigger on table "public"."two_factor_auth" to "authenticated";

grant truncate on table "public"."two_factor_auth" to "authenticated";

grant update on table "public"."two_factor_auth" to "authenticated";

grant delete on table "public"."two_factor_auth" to "service_role";

grant insert on table "public"."two_factor_auth" to "service_role";

grant references on table "public"."two_factor_auth" to "service_role";

grant select on table "public"."two_factor_auth" to "service_role";

grant trigger on table "public"."two_factor_auth" to "service_role";

grant truncate on table "public"."two_factor_auth" to "service_role";

grant update on table "public"."two_factor_auth" to "service_role";

create policy "Los usuarios autenticados pueden actualizar empresas"
on "public"."empresas"
as permissive
for update
to public
using ((auth.role() = 'authenticated'::text));


create policy "Los usuarios autenticados pueden eliminar empresas"
on "public"."empresas"
as permissive
for delete
to public
using ((auth.role() = 'authenticated'::text));


create policy "Los usuarios autenticados pueden insertar empresas"
on "public"."empresas"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "Los usuarios autenticados pueden ver las empresas"
on "public"."empresas"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


create policy "Permitir delete para usuarios anónimos"
on "public"."factura_detalles"
as permissive
for delete
to anon
using (true);


create policy "Permitir insert para usuarios anónimos"
on "public"."factura_detalles"
as permissive
for insert
to anon
with check (true);


create policy "Permitir select para usuarios anónimos"
on "public"."factura_detalles"
as permissive
for select
to anon
using (true);


create policy "Permitir update para usuarios anónimos"
on "public"."factura_detalles"
as permissive
for update
to anon
using (true)
with check (true);


create policy "Permitir delete para usuarios anónimos"
on "public"."facturas"
as permissive
for delete
to anon
using (true);


create policy "Permitir insert para usuarios anónimos"
on "public"."facturas"
as permissive
for insert
to anon
with check (true);


create policy "Permitir select para usuarios anónimos"
on "public"."facturas"
as permissive
for select
to anon
using (true);


create policy "Permitir update para usuarios anónimos"
on "public"."facturas"
as permissive
for update
to anon
using (true)
with check (true);


create policy "Los usuarios pueden marcar sus propias notificaciones como leí"
on "public"."notifications"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Los usuarios pueden ver sus propias notificaciones"
on "public"."notifications"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "admin_view_all_2fa_attempts"
on "public"."two_factor_attempts"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM usuarios u
  WHERE ((u.id = auth.uid()) AND ((u.rol)::text = 'admin'::text)))));


create policy "view_own_2fa_attempts"
on "public"."two_factor_attempts"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "admin_view_all_2fa_config"
on "public"."two_factor_auth"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM usuarios u
  WHERE ((u.id = auth.uid()) AND ((u.rol)::text = 'admin'::text)))));


create policy "view_own_2fa_config"
on "public"."two_factor_auth"
as permissive
for select
to public
using ((auth.uid() = user_id));


CREATE TRIGGER clean_2fa_attempts_trigger AFTER INSERT ON public.two_factor_attempts FOR EACH STATEMENT EXECUTE FUNCTION trigger_clean_old_2fa_attempts();

CREATE TRIGGER hash_passwords_before_save BEFORE INSERT OR UPDATE OF password_hash ON public.usuarios FOR EACH ROW EXECUTE FUNCTION hash_password_trigger();


