   -- Copia el contenido del archivo empresas_table.sql que ya creamos
   CREATE TABLE IF NOT EXISTS public.empresas (
       id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
       nombre TEXT NOT NULL,
       ruc_dni TEXT NOT NULL,
       cuenta_abonada TEXT,
       fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Los usuarios autenticados pueden ver las empresas" ON public.empresas
       FOR SELECT
       USING (auth.role() = 'authenticated');

   CREATE POLICY "Los usuarios autenticados pueden insertar empresas" ON public.empresas
       FOR INSERT
       WITH CHECK (auth.role() = 'authenticated');

   CREATE POLICY "Los usuarios autenticados pueden actualizar empresas" ON public.empresas
       FOR UPDATE
       USING (auth.role() = 'authenticated');

   CREATE POLICY "Los usuarios autenticados pueden eliminar empresas" ON public.empresas
       FOR DELETE
       USING (auth.role() = 'authenticated');