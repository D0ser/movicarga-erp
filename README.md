This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Desarrollo con Supabase

### Migraciones de Base de Datos

Este proyecto utiliza Supabase CLI para gestionar las migraciones de la base de datos. En lugar de ejecutar manualmente scripts SQL, se utilizan archivos de migración que se aplican secuencialmente.

#### Instalación de Supabase CLI

```bash
# Instalar como dependencia de desarrollo
npm install supabase --save-dev

# Verificar instalación
npx supabase -v
```

#### Estructura de migraciones

Las migraciones se encuentran en el directorio `supabase/migrations/` y siguen un formato de nomenclatura que incluye timestamp y descripción:

```
supabase/migrations/
  ├── 20240424220500_initial_schema.sql
  ├── 20240424220600_seguridad.sql
  └── 20240424220700_fix_function.sql
```

#### Comandos útiles

```bash
# Inicializar Supabase (ya realizado en este proyecto)
npx supabase init

# Iniciar servicios locales de Supabase
npx supabase start

# Generar una nueva migración
npx supabase migration new nombre_descriptivo

# Aplicar migraciones pendientes
npx supabase db push

# Aplicar seed data
npx supabase db reset
```

#### Flujo de trabajo recomendado

1. Crear una nueva migración para cada cambio en el esquema
2. Probar localmente
3. Hacer commit de los cambios
4. En producción, aplicar las migraciones con `supabase db push`

Para obtener más información sobre Supabase CLI, consulte la [documentación oficial](https://supabase.com/docs/guides/cli).
