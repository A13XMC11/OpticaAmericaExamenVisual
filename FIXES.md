# FIXES — Óptica América

> Generado: 2026-05-27  
> Basado en code review completo del estado actual del proyecto.  
> Ordenado por prioridad: CRÍTICO → ALTO → MEDIO → BAJO

---

## Leyenda

| Símbolo | Significado |
|---------|-------------|
| 🔴 | CRÍTICO — bloquea producción |
| 🟠 | ALTO — corregir antes de primer deploy |
| 🟡 | MEDIO — corregir en siguiente iteración |
| ⚪ | BAJO — calidad / convenciones |
| ✅ | Completado |

---

## 🔴 CRÍTICOS

### C1 — Elevación de privilegios via `user_metadata`
- **Archivo**: `src/modules/auth/rbac.ts`
- **Problema**: Los roles se leen de `user_metadata`, que **cualquier usuario autenticado puede modificar** llamando `supabase.auth.updateUser({ data: { role: 'ADMIN' } })`. Esto da acceso ADMIN a cualquier cuenta.
- **Fix**: Leer de `app_metadata` (solo modificable con service-role key en el servidor).
- **Impacto**: Afecta TODOS los guards RBAC del sistema (`puedeEliminarPaciente`, `puedeCrearFicha`, `puedeGestionarPacientes`, `esAdmin`).

```typescript
// ANTES (vulnerable)
return (user.user_metadata?.role as Rol) ?? null;

// DESPUÉS (seguro)
return (user.app_metadata?.role as Rol) ?? null;
```

> ⚠️ También requiere un endpoint de administración (solo service-role) para asignar roles via `supabase.auth.admin.updateUserById()` con `app_metadata`.

---

### C2 — Página `/nueva-contrasena` accesible sin recovery token
- **Archivo**: `src/app/(auth)/nueva-contrasena/page.tsx`
- **Problema**: No verifica que la sesión venga de un password-recovery token. Cualquier usuario logueado puede navegar a `/nueva-contrasena` y cambiar su contraseña sin haber pedido el reset.
- **Fix**: Escuchar `onAuthStateChange` y redirigir si el evento no es `PASSWORD_RECOVERY`.

```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event !== "PASSWORD_RECOVERY") router.replace("/");
  });
  return () => subscription.unsubscribe();
}, []);
```

---

### C3 — Errores internos de DB expuestos al cliente
- **Archivos**: `src/modules/shared/errors.ts`, `src/modules/pacientes/paciente.repository.ts`, `src/modules/fichas/ficha.repository.ts`
- **Problema**: `assertNoError` relanza el mensaje raw de Supabase (nombres de tablas, constraints, esquemas) que termina en la respuesta HTTP.
- **Fix**: Loguear internamente, retornar mensaje genérico al cliente.

```typescript
// ANTES
function assertNoError(error: { message: string } | null) {
  if (error) throw new Error(error.message); // expone detalles internos
}

// DESPUÉS
function assertNoError(error: { message: string; code?: string } | null) {
  if (error) {
    console.error("[db]", error.code, error.message);
    throw new AppError("Error de base de datos", "DB_ERROR", 500);
  }
}
```

---

## 🟠 ALTOS

### A1 — Query/path params sin validación UUID en rutas API
- **Archivos**:
  - `src/app/api/fichas/route.ts` — `pacienteId` (query param)
  - `src/app/api/pacientes/route.ts` — `tagId` (query param)
  - `src/app/api/pacientes/[id]/route.ts` — `id` (path param)
  - `src/app/api/fichas/[id]/route.ts` — `id` (path param)
- **Fix**: Validar con `z.string().uuid().safeParse(value)` antes de pasar a repositorios.

```typescript
const parsed = z.string().uuid().safeParse(id);
if (!parsed.success) {
  return NextResponse.json(fail("ID inválido"), { status: 400 });
}
```

---

### A2 — Sin rate limiting en endpoints críticos
- **Archivos**: Login, todas las rutas API
- **Problema**: Permite brute-force de credenciales y scraping masivo de pacientes.
- **Fix**: Implementar rate limiting en middleware (`src/proxy.ts`) usando `@upstash/ratelimit` + `@upstash/redis`.
- **Prioridad rutas**: `/login`, `/api/pacientes/buscar`, `/api/pacientes`, `/api/fichas`.

---

### A3 — Dual ORM: Prisma declarado pero nunca usado
- **Archivos**: `prisma/schema.prisma`, todos los repositorios
- **Problema**: El schema de Prisma está definido pero los repos usan Supabase con tipos manuales duplicados. Dos fuentes de verdad. El datasource no tiene `url`.
- **Decisión requerida**: Elegir uno.
  - **Opción A**: Eliminar Prisma, generar tipos desde Supabase (`supabase gen types`), usar `Database` type en todos los repos.
  - **Opción B**: Usar Prisma Client para queries, eliminar interfaces `PacienteDb`/`FichaDb` manuales.
- **Fix mínimo inmediato**: Agregar `url = env("DATABASE_URL")` al datasource para que `prisma generate` funcione.

---

### A4 — `createClient()` instanciado múltiples veces por request
- **Archivo**: `src/modules/pacientes/paciente.repository.ts`
- **Problema**: `hydratePacientes` crea un segundo cliente Supabase (línea 61). `findPacienteById` hace una tercera instancia. Cada función de repositorio que llama a otra función recrea el cliente.
- **Fix**: Refactorizar repositorios para recibir el cliente como parámetro, o crear una función factory que retorne siempre la misma instancia por request (patrón request-scoped singleton).

---

### A5 — Mensaje de error de cédula duplicada hace string matching frágil
- **Archivo**: `src/app/api/pacientes/route.ts:48-50`
- **Problema**: `msg.includes("Unique constraint") || msg.includes("cedula")` es frágil y expone vocabulario ORM.
- **Fix**: Crear clase `DuplicateCedulaError extends AppError` y lanzarla desde el repositorio cuando se detecte el error de unique constraint (código Postgres `23505`).

---

### A6 — Non-null assertion `user!` en dashboard
- **Archivo**: `src/app/(dashboard)/pacientes/page.tsx:20`
- **Fix**: Usar guard explícito.

```typescript
// ANTES
const rol = getRol(user!);

// DESPUÉS
if (!user) redirect("/login");
const rol = getRol(user);
```

---

## 🟡 MEDIOS

### M1 — 6 upserts secuenciales en `updateFicha`
- **Archivo**: `src/modules/fichas/ficha.repository.ts:229-234`
- **Fix**: Bulk upsert en una sola llamada.

```typescript
// ANTES
for (const medicion of mediciones) {
  await supabase.from("Medicion").upsert(medicion, { onConflict: "fichaId,seccion,ojo" });
}

// DESPUÉS
if (mediciones.length > 0) {
  const { error } = await supabase
    .from("Medicion")
    .upsert(mediciones, { onConflict: "fichaId,seccion,ojo" });
  assertNoError(error);
}
```

---

### M2 — Mutación con `delete` en `fichaPayload`
- **Archivo**: `src/modules/fichas/ficha.repository.ts:97-104`
- **Problema**: Viola la convención de inmutabilidad del proyecto.
- **Fix**: Usar destructuring para omitir campos.

```typescript
// ANTES
const payload = stripUndefined({ ...data });
delete payload.lentesUsoOD;
delete payload.lentesUsoOI;
// ...

// DESPUÉS
const { lentesUsoOD, lentesUsoOI, retinoscopiaOD, retinoscopiaOI,
        recetaFinalOD, recetaFinalOI, ...rest } = data;
const payload = stripUndefined({ ...rest, realizadoById, pacienteId });
```

---

### M3 — GET `/api/tags` hace writes (auto-seed)
- **Archivo**: `src/app/api/tags/route.ts:31-39`
- **Problema**: Un GET que escribe viola HTTP idempotency. En multi-instancia puede causar conflictos de unique constraint.
- **Fix**: Mover el seed a una migración SQL (`prisma/init.sql`) o a un endpoint `POST /api/admin/seed` protegido por rol ADMIN. El GET solo debe leer.

---

### M4 — IDs fallback inválidos en `TagSelector`
- **Archivo**: `src/components/pacientes/TagSelector.tsx:20-25`
- **Problema**: `"new-1"`, `"new-2"` etc. no son UUIDs válidos. Si el usuario selecciona un tag fallback, el form enviará IDs inválidos que fallarán validación Zod silenciosamente.
- **Fix**: Eliminar los tags hardcodeados o usar UUIDs reales de la DB. Mostrar estado de error si la carga de tags falla.

---

### M5 — `CheckBox` definido dentro del render de `FichaForm`
- **Archivo**: `src/components/fichas/FichaForm.tsx:73-83`
- **Problema**: React crea un nuevo tipo de componente en cada render → unmount/remount de todos los checkboxes en cada keystroke.
- **Fix**: Mover `CheckBox` fuera de `FichaForm`, al nivel del módulo o a `src/components/ui/`.

---

### M6 — Replace de tags no es atómico en `updatePaciente`
- **Archivo**: `src/modules/pacientes/paciente.repository.ts:253-261`
- **Problema**: Delete + insert separados tienen una ventana de race condition. Si el proceso muere entre ambas operaciones, el paciente queda sin tags.
- **Fix (corto plazo)**: Documentar la limitación. **Fix (largo plazo)**: Implementar via Supabase RPC function que ejecute ambas operaciones en una transacción PostgreSQL.

---

## ⚪ BAJOS

### B1 — `"use client"` innecesario en hook
- **Archivo**: `src/hooks/useDebounce.ts:1`
- **Fix**: Eliminar la directiva. Los hooks de React son implícitamente client-only cuando son importados por Client Components.

---

### B2 — `proxy.ts` no redirige todas las rutas auth para usuarios logueados
- **Archivo**: `src/proxy.ts:43-47`
- **Problema**: Solo redirige `/login`, no `/recuperar-contrasena` ni `/nueva-contrasena`.
- **Fix**: Ampliar el check a todas las rutas de auth.

```typescript
const AUTH_ROUTES = ["/login", "/recuperar-contrasena", "/nueva-contrasena"];
if (user && AUTH_ROUTES.includes(pathname)) {
  return NextResponse.redirect(new URL("/", request.url));
}
```

---

### B3 — `fetch` sin check de `res.ok` en componentes de búsqueda
- **Archivos**: `src/components/layout/GlobalSearch.tsx:25-29`, `src/components/pacientes/CedulaAutocomplete.tsx:22-25`
- **Fix**: Verificar `res.ok` antes de parsear JSON para que TanStack Query capture errores correctamente.

```typescript
const res = await fetch(`/api/pacientes/buscar?q=${q}`);
if (!res.ok) throw new Error(`Error ${res.status}`);
const json = await res.json();
return json.data ?? [];
```

---

### B4 — `createClient()` en cada render de `Topbar`
- **Archivo**: `src/components/layout/Topbar.tsx:23`
- **Fix**: Mover la instancia dentro del callback `handleLogout` o usar `useRef`.

```typescript
const supabaseRef = useRef(createClient());
// usar supabaseRef.current en handleLogout
```

---

### B5 — Campos de medición sin validación de formato numérico
- **Archivo**: `src/modules/fichas/ficha.schema.ts:4-13`
- **Problema**: `esfera`, `cilindro`, `eje` etc. son `z.string().optional()` sin restricción de formato.
- **Fix sugerido**:

```typescript
const medidaOptica = z.string().regex(/^[+-]?\d+(\.\d{1,2})?$/, "Formato inválido").optional().or(z.literal(""));
const ejeSchema = z.coerce.number().int().min(0).max(180).optional();
```

---

### B6 — `realizadoById` en ficha schema no valida UUID
- **Archivo**: `src/modules/fichas/ficha.schema.ts:20`
- **Fix**: `realizadoById: z.string().uuid()`.

---

### B7 — `AuditLog` declarado pero nunca implementado
- **Archivos**: `prisma/schema.prisma:142-158`, `src/modules/shared/` (falta `audit.ts`)
- **Problema**: CLAUDE.md lo lista como parte de la arquitectura pero no existe la implementación.
- **Fix**: Crear `src/modules/shared/audit.ts` con función `logAudit()` y llamarla en operaciones críticas (create/update/delete de pacientes y fichas).

---

### B8 — Comentarios estructurales en JSX (convención)
- **Archivos**: `src/components/fichas/FichaForm.tsx` (múltiples líneas)
- **Problema**: Comentarios como `{/* Datos generales */}`, `{/* Motivo de consulta */}` describen el QUÉ, no el POR QUÉ.
- **Fix**: Eliminarlos. Las secciones ya se comunican por la estructura del JSX y los headings visibles.

---

### B9 — `cedula` de searchParam sin sanitizar como defaultValue
- **Archivo**: `src/app/(dashboard)/pacientes/nuevo/page.tsx:10,22`
- **Fix**: Validar contra el schema antes de pasar al formulario.

```typescript
const rawCedula = (await searchParams).cedula;
const cedula = typeof rawCedula === "string" && /^\d{6,12}$/.test(rawCedula)
  ? rawCedula
  : undefined;
```

---

## Resumen de trabajo pendiente

```
🔴 CRÍTICOS  (3)  →  C1, C2, C3
🟠 ALTOS     (6)  →  A1, A2, A3, A4, A5, A6
🟡 MEDIOS    (6)  →  M1, M2, M3, M4, M5, M6
⚪ BAJOS     (9)  →  B1–B9
```

**Orden de ejecución recomendado:**

1. `C1` → seguridad crítica (RBAC)
2. `C3` → filtrar errores DB
3. `C2` → flujo de recovery
4. `A1` → validación UUID en rutas
5. `A3` → resolver dual ORM (decisión de arquitectura)
6. `A4` + `M1` → performance repositorios
7. `M3` + `M4` + `M5` → bugs de comportamiento
8. `A2` → rate limiting (requiere Upstash)
9. `B1–B9` → calidad y convenciones
