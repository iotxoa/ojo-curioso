# El ojo curioso 📷

Plataforma de aprendizaje de fotografía personalizada.

## Setup rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Variables de entorno
```bash
cp .env.local.example .env.local
```
Rellena con tus valores de Supabase (Project Settings > API).

### 3. Base de datos
En Supabase > SQL Editor, ejecuta el contenido de `supabase-schema.sql`.

### 4. Crear usuarios
En Supabase > Authentication > Users > Add user:
- **Tu aita**: email + contraseña sencilla
- **Tú (admin)**: tu email + contraseña

Luego en SQL Editor, marca tu usuario como admin:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'tu@email.com';
UPDATE profiles SET full_name = 'Aita' WHERE email = 'email_aita@example.com';
```

### 5. Arrancar en local
```bash
npm run dev
```
Abre http://localhost:3000

### 6. Deploy en Vercel
```bash
# Conecta el repo en vercel.com
# Añade las env vars en Vercel > Settings > Environment Variables
# Deploy automático en cada push a main
```

## Estructura del proyecto
```
app/
  auth/login/          → Página de login
  student/dashboard/   → Dashboard del alumno
  student/leccion/     → Página de lección (dinámica)
  admin/               → Panel de admin
  api/submissions/     → API para entregas + email
components/
  layout/Nav.tsx       → Navegación con toggle dark/light + accesibilidad
  layout/AdminClient   → Panel admin interactivo
  lesson/LessonClient  → Lección + quiz + ejercicio
lib/supabase/          → Clientes de Supabase (client + server)
types/                 → TypeScript types
styles/globals.css     → Tema completo (dark/light, accesibilidad, grain)
supabase-schema.sql    → Schema completo con datos de la primera lección
```

## Añadir más lecciones
Edita directamente en Supabase > Table Editor > lessons, o añade INSERTs al SQL.

El campo `content` es un array JSON de bloques. Tipos disponibles:
- `{ type: "intro", text: "..." }`
- `{ type: "paragraph", text: "..." }`
- `{ type: "section_title", text: "..." }`
- `{ type: "highlight", author: "...", year: "...", text: "..." }`
- `{ type: "quote", text: "...", author: "..." }`
