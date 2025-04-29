-- SQL para crear la tabla 'empresas' en Supabase
CREATE TABLE IF NOT EXISTS public.empresas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    ruc_dni TEXT NOT NULL,
    cuenta_abonada TEXT,
    fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentarios para la tabla y columnas
COMMENT ON TABLE public.empresas IS 'Tabla para almacenar información de empresas para egresos';
COMMENT ON COLUMN public.empresas.id IS 'Identificador único de la empresa';
COMMENT ON COLUMN public.empresas.nombre IS 'Nombre de la empresa';
COMMENT ON COLUMN public.empresas.ruc_dni IS 'RUC o DNI de la empresa';
COMMENT ON COLUMN public.empresas.cuenta_abonada IS 'Cuenta bancaria para abonos a la empresa';
COMMENT ON COLUMN public.empresas.fecha_creacion IS 'Fecha de creación del registro de la empresa';

-- RLS (Row Level Security)
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- Política para permitir a usuarios autenticados ver todas las empresas
CREATE POLICY "Los usuarios autenticados pueden ver las empresas" ON public.empresas
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Política para permitir a usuarios autenticados insertar empresas
CREATE POLICY "Los usuarios autenticados pueden insertar empresas" ON public.empresas
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir a usuarios autenticados actualizar empresas
CREATE POLICY "Los usuarios autenticados pueden actualizar empresas" ON public.empresas
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Política para permitir a usuarios autenticados eliminar empresas
CREATE POLICY "Los usuarios autenticados pueden eliminar empresas" ON public.empresas
    FOR DELETE
    USING (auth.role() = 'authenticated'); 