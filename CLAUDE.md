# Óptica América — Sistema de Gestión

## Stack
- **Framework**: Next.js App Router + TypeScript strict
- **Auth**: Supabase Auth (`@supabase/ssr`) — email/password + recuperación por email
- **DB**: PostgreSQL via Supabase (`@supabase/ssr`)
- **Validación**: Zod (compartida cliente/servidor)
- **Forms**: react-hook-form + @hookform/resolvers/zod
- **Cache**: TanStack Query v5
- **UI**: Tailwind CSS + shadcn/ui
- **PDF/Print**: @react-pdf/renderer + react-to-print
- **Deploy**: Vercel

## Estructura de módulos
```
src/modules/
  auth/          → rbac.ts (roles en user_metadata de Supabase)
  pacientes/     → schema.ts, repository.ts, service.ts, actions.ts
  fichas/        → schema.ts, repository.ts, service.ts, actions.ts
  shared/        → api-response.ts, errors.ts, audit.ts
```

## Variables de entorno requeridas
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Roles
- `ADMIN` — acceso total + gestión de usuarios + importar CSV
- `OPTOMETRISTA` — crear/editar fichas + ver pacientes
- `RECEPCIONISTA` — crear/editar pacientes, solo ver fichas
Roles almacenados en `user_metadata.role` de Supabase Auth.

## Convenciones
- Respuesta API estándar: `{ success, data, error, meta? }`
- Soft-delete en pacientes: campo `deletedAt`
- Inmutabilidad: nunca mutar objetos, siempre retornar nuevas copias
- Archivos < 400 líneas, funciones < 50 líneas
- Sin comentarios obvios — solo comentar WHY no WHAT

## Comandos útiles
```bash
npm run dev          # desarrollo
npm run build        # build de producción
```

## Flujo de autenticación
1. `/login` → Supabase Auth Credentials
2. Middleware (`src/middleware.ts`) verifica sesión con `createServerClient`
3. Rutas `/(dashboard)/*` requieren sesión activa
4. Cada Server Action/handler verifica rol adicional (defensa en profundidad)
5. Recuperación: `/recuperar-contrasena` → email → `/nueva-contrasena` (callback Supabase)
