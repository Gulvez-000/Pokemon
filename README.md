# La sala — archivo compartido (version Vercel)

## 1. Subir a GitHub
Sube TODO el contenido de esta carpeta a un repositorio de GitHub (puede ser privado).
No necesitas subir `node_modules` (ya esta en `.gitignore`).

## 2. Importar en Vercel
En vercel.com > Add New > Project > conecta tu cuenta de GitHub > elige este repo > Deploy.
No hace falta tocar ninguna configuracion de build, Vercel detecta la carpeta `api/` sola.

## 3. Agregar la base de datos
Dentro del proyecto en Vercel: pestaña "Storage" > "Create Database" > Postgres.
Al conectarla, Vercel agrega automaticamente las variables POSTGRES_URL, etc. No las tocas tu.

## 4. Cargar las tablas
En la misma pestaña "Storage" > tu base > "Query" (o "Data"), pega el contenido de `schema.sql`
y ejecutalo. Eso crea las tablas y las categorias iniciales.

## 5. Variables de entorno
En el proyecto: Settings > Environment Variables, agrega estas tres:

- `SITE_PASSWORD` -> una clave que inventes tu (la que usaran tu y Daira para entrar)
- `SESSION_SECRET` -> cualquier texto largo al azar (ej. generalo en https://www.uuidgenerator.net/)
- `ANTHROPIC_API_KEY` -> tu clave de console.anthropic.com

Despues de agregarlas, ve a "Deployments" y haz Redeploy (las variables nuevas solo aplican
en el proximo despliegue).

## 6. Dominio propio
Settings > Domains > agrega tu dominio. Te da los registros DNS para pegar donde compraste
el dominio (puede ser el mismo Hostinger o GoDaddy, solo para el dominio, no el hosting).

## Notas
- La lista se actualiza sola cada 15 segundos (no es tiempo real, pero para dos personas alcanza).
- El acceso es con nombre + una sola clave compartida, no con cuentas individuales.
- Nunca compartas `ANTHROPIC_API_KEY` ni `SESSION_SECRET` fuera de las variables de entorno de Vercel.
