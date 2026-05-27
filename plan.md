# Plan de Implementación — Óptica América

## Módulos del sistema
1. **Auth** — Login, recuperación de contraseña, roles (Admin/Optometrista/Recepcionista)
2. **Pacientes** — CRUD, búsqueda por cédula (autocomplete), tags, importar CSV
3. **Fichas de Examen** — Múltiples por paciente, export PDF, impresión una o varias
4. **Dashboard** — Métricas del día, controles pendientes, accesos rápidos
5. **Búsqueda Global** — Cmd+K por cédula, nombre o apellido
6. **Comparación de Fichas** — Lado a lado con diferencias resaltadas
7. **Compartir Receta** — WhatsApp / email / copiar texto

## Fases

### Fase 0 — Fundaciones ✅
- [x] CLAUDE.md y plan.md
- [ ] Scaffold Next.js 15
- [ ] Dependencias instaladas
- [ ] Prisma schema completo
- [ ] Variables de entorno configuradas

### Fase 1 — Auth con Supabase
- [ ] `src/lib/supabase/` — cliente server y browser
- [ ] `src/middleware.ts` — protección de rutas
- [ ] `/login` — formulario email/password
- [ ] `/recuperar-contrasena` — solicitar reset
- [ ] `/nueva-contrasena` — establecer nueva contraseña
- [ ] `modules/auth/rbac.ts` — verificación de roles
- [ ] `(dashboard)/layout.tsx` — Sidebar + Topbar

### Fase 2 — Pacientes
- [ ] `modules/pacientes/` — schema, repository, service, actions
- [ ] API routes: GET/POST /pacientes, GET /pacientes/buscar, GET/PATCH/DELETE /pacientes/:id
- [ ] `CedulaAutocomplete` — debounce + TanStack Query
- [ ] `PacienteForm`, `PacienteCard`, `PacientesList`
- [ ] `TagSelector` — multi-select con creación inline
- [ ] Páginas: listado, nuevo, detalle, editar
- [ ] `/pacientes/importar` — CSV/Excel con drag & drop

### Fase 3 — Fichas de Examen
- [ ] `modules/fichas/` — schema, repository, service, actions
- [ ] API routes: GET/POST /fichas, GET/PATCH /fichas/:id
- [ ] `FichaForm` con fieldsets (Motivo, Examen Externo, Antecedentes)
- [ ] `PrescriptionTable` — reutilizable para 3 secciones
- [ ] `FichaTimeline` — selección múltiple (checkboxes)
- [ ] `FichaPrintView` — @media print, una o varias fichas
- [ ] `FichaExportPDF` — @react-pdf/renderer, multi-ficha
- [ ] `FichaComparator` — comparación lado a lado

### Fase 4 — Valor adicional
- [ ] Dashboard con `StatsCard`
- [ ] `GlobalSearch` (Cmd+K) con cmdk
- [ ] `ShareRecetaModal` — WhatsApp / email / copiar
- [ ] Recordatorios de seguimiento en dashboard
- [ ] `AuditLog`
- [ ] Gestión de usuarios (admin)

## Estructura de DB

| Tabla | Propósito |
|-------|-----------|
| Paciente | Datos del paciente + soft-delete |
| FichaExamen | Examen visual completo |
| Medicion | Prescripciones (LENTES_USO/RETINOSCOPIA/RECETA_FINAL × OD/OI) |
| Tag | Etiquetas de colores |
| PacienteTag | Pivote paciente↔tag |
| AuditLog | Trazabilidad de cambios |

## Variables de entorno (configurar antes de desarrollar)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres.xxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xxxx:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```
