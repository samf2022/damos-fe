# damos-fe

Sistema web para que un consejo comunal emita constancias en PDF: residencia, residencia y buena conducta, y buena conducta.

- Los ciudadanos llenan un formulario público y envían su solicitud.
- Un administrador la revisa y la aprueba o rechaza.
- Al aprobarla se genera el PDF, que se imprime o se envía por WhatsApp.
- Todo queda registrado en un historial.

**Stack:** SvelteKit 3 + TypeScript (strict) + Tailwind CSS 4, desplegado en Cloudflare Pages, con Cloudflare D1 (base de datos) y R2 (PDFs y logo). Todo en la capa gratuita.

## Requisitos

- Node.js **22.18** o superior (el script `create-admin` usa TypeScript nativo de Node).
- pnpm **12** o superior.
- Una cuenta de Cloudflare (solo para desplegar; el desarrollo local no la necesita).

## Instalación

```bash
pnpm install
cp .dev.vars.example .dev.vars   # variables locales; nunca subas .dev.vars
```

## Desarrollo local (D1 y R2 locales)

Wrangler emula D1 y R2 en `.wrangler/state/`, así que no hace falta cuenta ni conexión.

```bash
pnpm db:migrate:local                       # crea las tablas y carga los datos de ejemplo
pnpm create-admin --username admin --name "Administrador"
pnpm dev                                    # http://localhost:5173
```

- Panel administrativo: <http://localhost:5173/admin>.
- Para empezar de cero: `pnpm db:reset:local` (borra el D1 local y vuelve a migrar).
- Para probar la build real dentro de workerd: `pnpm preview` (<http://localhost:4173>).
- Para consultar el D1 local: `pnpm exec wrangler d1 execute damos-fe-db --local --command "SELECT * FROM signers"`.

### Calidad

```bash
pnpm test     # pruebas unitarias (Vitest)
pnpm check    # svelte-check + verificación de tipos de wrangler
pnpm lint     # Prettier + ESLint
pnpm format   # formatea el código
```

Si cambias `wrangler.toml`, ejecuta `pnpm gen` para regenerar `worker-configuration.d.ts`.

## Migraciones

Las migraciones son archivos SQL versionados en `migrations/` (`0001_init.sql`, `0002_seed.sql`, …). Para crear una nueva:

```bash
pnpm exec wrangler d1 migrations create damos-fe-db add_something
```

Aplicarlas:

```bash
pnpm db:migrate:local    # D1 local
pnpm db:migrate:remote   # D1 en Cloudflare (producción)
```

> `0002_seed.sql` contiene datos **ficticios**: un consejo, 3 tipos de constancia y 3 firmantes. En producción, después de migrar, actualiza los datos del consejo y los firmantes desde el panel (o con SQL mientras ese panel no exista).

## Despliegue en Cloudflare Pages

Configuración de una sola vez:

1. `pnpm exec wrangler login`
2. Crea la base de datos con `pnpm exec wrangler d1 create damos-fe-db` y copia el `database_id` en `wrangler.toml`.
3. Habilita R2 en el dashboard y crea el bucket con `pnpm exec wrangler r2 bucket create damos-fe-files`.
4. Sube el repositorio a GitHub.
5. En Cloudflare, ve a **Workers & Pages → Create → Pages → Connect to Git** y elige el repositorio:
   - Framework preset: `SvelteKit` (o `None`).
   - Build command: `pnpm build`.
   - Build output directory: `.svelte-kit/cloudflare`.
   - Variables de build: `NODE_VERSION=22.18.0` y `PNPM_VERSION=12.14.0`.
6. Los bindings D1 (`DB`) y R2 (`FILES`) se leen de `wrangler.toml`. Cuando el archivo tiene `pages_build_output_dir`, Pages lo toma como fuente de verdad y no se configuran en el dashboard.
7. Ajusta `APP_URL` en `wrangler.toml` con la URL pública (por ejemplo `https://damos-fe.pages.dev`). En local, `.dev.vars` la sobrescribe.

Después, cada `git push` a `main` despliega a producción y cada rama genera una vista previa.

Antes del primer uso en producción:

```bash
pnpm db:migrate:remote
pnpm create-admin --username admin --name "Administrador" --remote
```

## Crear el primer administrador

```bash
pnpm create-admin --username <usuario> [--name "Nombre visible"] [--role admin|reviewer] [--remote]
```

- Pide la contraseña sin mostrarla (mínimo 10 caracteres). Para uso no interactivo: `ADMIN_PASSWORD=... pnpm create-admin ...`.
- La contraseña se hashea en tu máquina (PBKDF2-SHA256, 100 000 iteraciones) y se inserta con `wrangler d1 execute`. La contraseña en claro nunca sale de tu equipo.
- Si el usuario ya existe, el script restablece su contraseña, lo reactiva y cierra sus sesiones. Sirve también para recuperar el acceso.
- Sin `--remote` trabaja sobre el D1 local.

## Estructura

```
migrations/                  SQL versionado de D1
scripts/create-admin.ts      alta de administradores
src/hooks.server.ts          sesión + protección de /admin
src/lib/i18n/es.ts           todos los textos visibles (español de Venezuela)
src/lib/server/
  bindings.ts                acceso a D1/R2 (cloudflare:workers)
  db.ts                      helper tipado sobre D1 y tipos de filas
  auth.ts, password.ts       contraseñas PBKDF2 y sesiones en D1
src/lib/text/                fechas en letras, concordancia de género, plantillas
src/lib/whatsapp.ts          enlaces wa.me con números venezolanos
src/lib/pdf/                 generación del PDF en el navegador (pdfmake)
src/routes/                  páginas públicas, /admin y /api/files/[...key]
```

### Notas técnicas

- **Bindings:** en SvelteKit 3 + adapter-cloudflare ya no existe `event.platform`. Los bindings se leen con `import { env } from 'cloudflare:workers'` (encapsulado en `#lib/server/bindings.ts`) y están tipados por `wrangler types`.
- **Imports:** el alias `#lib` (antes `$lib`) usa los `imports` de `package.json`, por lo que las rutas llevan la extensión: `#lib/server/db.ts`.
- **Sesiones:** la cookie `damos_fe_session` es `httpOnly` y `sameSite=lax`, y `secure` en producción. En D1 solo se guarda el hash SHA-256 del token. Las sesiones duran 30 días y se renuevan con el uso.
- **Archivos R2:** las claves bajo `public/` (el logo) son públicas. Todo lo demás, como los PDFs, exige sesión de administrador.
- **Verificación pública** (`/verify/[code]`): muestra solo nombre, tipo, estado y vigencia, nunca la cédula.
