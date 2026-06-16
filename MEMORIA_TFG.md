# TRABAJO DE FIN DE GRADO
## Administración de Sistemas Informáticos en Red

---

# M&M Studio
### Diseño, despliegue y administración de una plataforma web empresarial con Docker, HTTPS, monitorización y servicios de inteligencia artificial

---

**Autores:** Marcos Valero Báscones y Marius
**Centro:** Universidad Europea
**Ciclo:** Administración de Sistemas Informáticos en Red (ASIR)
**Curso:** 2025/2026

---

---

## ÍNDICE

1. [Introducción](#1-introducción)
   - 1.1 Motivación del proyecto
   - 1.2 Descripción general
   - 1.3 Estructura de la memoria

2. [Objetivos](#2-objetivos)
   - 2.1 Objetivo general
   - 2.2 Objetivos específicos

3. [Planificación](#3-planificación)
   - 3.1 Metodología de trabajo
   - 3.2 Fases del proyecto
   - 3.3 Herramientas y tecnologías utilizadas

4. [Análisis de requisitos](#4-análisis-de-requisitos)
   - 4.1 Descripción del negocio simulado
   - 4.2 Roles de usuario
   - 4.3 Requisitos funcionales
   - 4.4 Requisitos no funcionales

5. [Diseño del sistema](#5-diseño-del-sistema)
   - 5.1 Arquitectura general
   - 5.2 Diseño de contenedores Docker
   - 5.3 Modelo de datos
   - 5.4 Diseño de la API REST
   - 5.5 Sistema de autenticación

6. [Implementación — Infraestructura](#6-implementación--infraestructura)
   - 6.1 Contenerización con Docker y Docker Compose
   - 6.2 Servidor web Nginx
   - 6.3 Certificado SSL y HTTPS
   - 6.4 Cabeceras de seguridad HTTP
   - 6.5 Monitorización con Prometheus y Grafana
   - 6.6 Sistema de copias de seguridad
   - 6.7 Rotación de logs
   - 6.8 Despliegue en VPS con dominio real

7. [Implementación — Aplicación web](#7-implementación--aplicación-web)
   - 7.1 Backend: Node.js y Express
   - 7.2 Base de datos SQLite
   - 7.3 Autenticación con JWT y bcrypt
   - 7.4 Frontend: estructura de páginas
   - 7.5 Sistema de sesión en el cliente
   - 7.6 Integración con inteligencia artificial
   - 7.7 Panel de administración
   - 7.8 App privada de miembros
   - 7.9 Actividad de usuarios y reseñas

8. [Seguridad](#8-seguridad)

9. [Pruebas](#9-pruebas)

10. [Conclusiones](#10-conclusiones)

11. [Bibliografía](#11-bibliografía)

12. [Anexos](#12-anexos)

---

## RESUMEN

Este Trabajo de Fin de Grado consiste en el diseño, desarrollo y despliegue completo de una plataforma web empresarial denominada **M&M Studio**, una asesoría de imagen digital y personal branding. El proyecto ha sido planteado como si se tratara de un caso real de empresa, con el objetivo de demostrar las competencias adquiridas durante el ciclo de Administración de Sistemas Informáticos en Red.

La plataforma está completamente contenerizada con **Docker** y desplegada en un servidor VPS con dominio real y certificado SSL válido. Incluye un servidor web **Nginx** con redirección HTTPS, cabeceras de seguridad, compresión gzip y caché de recursos estáticos. El backend es una **API REST** desarrollada en Node.js con base de datos **SQLite**, autenticación mediante **JWT** y contraseñas cifradas con **bcrypt**. La monitorización del sistema se realiza con **Prometheus** y **Grafana**, y el sistema dispone de backups automáticos y rotación de logs.

Adicionalmente, la plataforma integra servicios de **inteligencia artificial** a través de la API de Groq para ofrecer asesoramiento personalizado a los usuarios registrados. El proyecto incluye un panel de administración completo y un área privada para miembros con plan contratado.

**Palabras clave:** Docker, Nginx, HTTPS, Let's Encrypt, Node.js, SQLite, JWT, Prometheus, Grafana, API REST, inteligencia artificial.

---

## 1. INTRODUCCIÓN

### 1.1 Motivación del proyecto

Al plantearse el TFG, los autores tenían claro que querían desarrollar algo que pudiera mostrarse en una entrevista de trabajo y que no pareciera un proyecto de prácticas básico. En ASIR se aprenden muchas cosas de forma aislada: Docker en un módulo, bases de datos en otro, redes en otro... pero pocas veces se trabaja con todo a la vez en un proyecto real.

La idea fue crear una web de empresa real, no solo una página estática, sino algo que tuviera un sistema de usuarios, autenticación, base de datos, backups, monitorización... todo lo que tendría una aplicación en producción. Se eligió el concepto de asesoría de imagen porque permite tener distintos niveles de usuario (visitante, cliente con plan, administrador) y eso enriquece mucho la parte técnica.

El objetivo del proyecto era demostrar que se era capaz de montar y administrar una aplicación completa desde cero: desde la configuración del servidor hasta el despliegue en un VPS con dominio y certificado real.

### 1.2 Descripción general

M&M Studio es una plataforma web para una empresa ficticia de asesoría de imagen digital y personal branding. Desde el punto de vista del negocio, ofrece tres planes de suscripción mensual: Normal, Premium y Exeltior, cada uno con servicios distintos.

Desde el punto de vista técnico, la plataforma está formada por:

- Una web pública con varias páginas de contenido corporativo
- Un sistema de registro e inicio de sesión
- Un área privada para clientes con plan activo (app de miembros)
- Un panel de administración para gestionar usuarios, planes y reseñas
- Una API REST como backend de toda la lógica de negocio
- Servicios de inteligencia artificial integrados para asesoramiento personalizado
- Toda la infraestructura necesaria para funcionar en producción: Docker, Nginx, HTTPS, monitorización, backups y logs

La web está accesible en producción en el dominio `mymstudio.duckdns.org`.

### 1.3 Estructura de la memoria

Esta memoria está organizada siguiendo el ciclo de vida del proyecto:

- Los capítulos 2 y 3 definen los objetivos y la planificación previa.
- El capítulo 4 recoge el análisis de lo que el sistema necesita hacer.
- El capítulo 5 explica las decisiones de diseño antes de escribir código.
- Los capítulos 6 y 7 describen la implementación, separada en infraestructura y aplicación.
- El capítulo 8 aborda la seguridad de forma específica.
- El capítulo 9 recoge las pruebas realizadas.
- El capítulo 10 incluye las conclusiones y posibles mejoras futuras.

---

## 2. OBJETIVOS

### 2.1 Objetivo general

Diseñar, desarrollar y desplegar una plataforma web empresarial completa que demuestre la integración de los conocimientos adquiridos durante el ciclo de ASIR, haciendo especial hincapié en la contenerización, la administración de servidores web, la seguridad, la monitorización y el despliegue en entornos de producción reales.

### 2.2 Objetivos específicos

**Infraestructura y sistemas:**
- Contenerizar toda la aplicación usando Docker y Docker Compose con al menos 4 servicios independientes.
- Configurar un servidor Nginx que sirva contenido estático, aplique redirección HTTP a HTTPS y actúe como proxy inverso hacia el backend.
- Obtener y configurar un certificado SSL válido con Let's Encrypt para un dominio real.
- Implementar cabeceras de seguridad HTTP correctas (HSTS, X-Frame-Options, CSP, etc.).
- Configurar un sistema de monitorización con Prometheus y Grafana que muestre métricas del servidor Nginx en tiempo real.
- Implementar un sistema de copias de seguridad automático con rotación de archivos.
- Configurar la rotación de logs de Nginx.

**Aplicación:**
- Desarrollar una API REST funcional con Node.js y Express.
- Diseñar y gestionar una base de datos relacional con SQLite.
- Implementar autenticación segura mediante JSON Web Tokens y cifrado de contraseñas con bcrypt.
- Crear un sistema de roles (usuario normal, administrador) con control de acceso en el servidor.
- Integrar un servicio externo de inteligencia artificial (API de Groq) de forma segura, sin exponer credenciales en el frontend.
- Desarrollar un panel de administración funcional.

**Despliegue:**
- Desplegar la aplicación en un VPS real con dominio propio.
- Gestionar el ciclo completo de actualizaciones: modificar código, subir a repositorio Git, desplegar en producción sin downtime.

---

## 3. PLANIFICACIÓN

### 3.1 Metodología de trabajo

Para este proyecto se ha seguido una metodología incremental, es decir, en lugar de intentar desarrollar todo a la vez, se han ido añadiendo funcionalidades por capas. Primero se montó la infraestructura básica (Docker + Nginx funcionando), luego se añadió el backend, luego la autenticación, y así sucesivamente. Esto permitió tener siempre algo funcionando y detectar problemas en cada fase antes de continuar.

Para el control de versiones se ha utilizado **Git** con un repositorio en GitHub. Cada vez que se terminaba una funcionalidad se hacía un commit. El flujo de trabajo con el VPS es: hacer cambios en local → commit y push a GitHub → en el VPS hacer `git pull` y reconstruir los contenedores.

### 3.2 Fases del proyecto

**Fase 1 — Diseño y planificación (1 semana)**
- Definición del concepto del proyecto
- Elección de tecnologías
- Bocetos de la estructura de la web y de la base de datos

**Fase 2 — Infraestructura base (2 semanas)**
- Configuración del VPS y dominio DuckDNS
- Docker y Docker Compose con Nginx
- Configuración de Nginx (HTTP, redirección, proxy inverso)
- Obtención del certificado SSL con Let's Encrypt (Certbot)
- Cabeceras de seguridad

**Fase 3 — Backend y base de datos (2 semanas)**
- Creación del servidor Node.js con Express
- Diseño y creación de las tablas SQLite
- Endpoints de registro y login con JWT y bcrypt
- Endpoints de gestión de usuarios y planes

**Fase 4 — Frontend (2 semanas)**
- Diseño y maquetación de todas las páginas HTML/CSS
- Sistema de autenticación en el cliente (auth.js)
- Panel de administración
- App privada de miembros

**Fase 5 — Funcionalidades avanzadas (2 semanas)**
- Integración con la API de Groq (inteligencia artificial)
- Proxy backend para proteger la clave de la IA
- Servicios IA en el área de miembros
- Sistema de actividad y reseñas

**Fase 6 — Monitorización, backups y pruebas (1 semana)**
- Configuración de Prometheus y Grafana
- Script de backup con rotación
- Configuración de logrotate
- Pruebas funcionales y de seguridad

**Fase 7 — Documentación (1 semana)**
- Redacción de esta memoria

### 3.3 Herramientas y tecnologías utilizadas

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| Contenerización | Docker + Docker Compose | 24+ |
| Servidor web | Nginx | Alpine (latest) |
| Certificados SSL | Let's Encrypt + Certbot | - |
| Backend | Node.js | 20 (Alpine) |
| Framework backend | Express | 4.18 |
| Base de datos | SQLite (better-sqlite3) | 9.4 |
| Autenticación | JSON Web Tokens (jsonwebtoken) | 9.0 |
| Hash contraseñas | bcryptjs | 2.4 |
| Monitorización | Prometheus + Grafana | Latest |
| Exportador métricas | nginx-prometheus-exporter | Latest |
| IA | Groq API (Llama 3.3 70B) | - |
| Control de versiones | Git + GitHub | - |
| VPS | Servidor Linux (Ubuntu) | - |
| Dominio | DuckDNS | - |
| Editor | Visual Studio Code | - |

---

## 4. ANÁLISIS DE REQUISITOS

### 4.1 Descripción del negocio simulado

M&M Studio es una asesoría de imagen digital y personal branding ubicada en el Barrio de Salamanca de Madrid. Su propuesta de valor es ayudar a personas, directivos y empresas a mejorar su presencia en redes sociales, optimizar sus perfiles profesionales y gestionar su reputación digital.

La empresa ofrece tres niveles de servicio:

**Plan Normal — 150€/mes**
Dirigido a personas que quieren mejorar su imagen básica en redes. Incluye guía de fotografía de perfil, plantillas de biografía, checklist de privacidad e informe inicial en PDF.

**Plan Premium — 400€/mes**
Para creadores de contenido y profesionales con presencia activa en redes. Añade informes mensuales de rendimiento, estrategia de crecimiento a 90 días, copia de seguridad del contenido y calendario de publicaciones optimizado.

**Plan Exeltior — desde 1.500€/mes**
Nivel ejecutivo para directivos y marcas corporativas. Incluye consultoría estratégica personalizada, optimización de LinkedIn con IA, sesiones fotográficas profesionales, gestión de reputación digital, limpieza de huella digital, filtrado de oportunidades y acceso prioritario a la asesora.

### 4.2 Roles de usuario

El sistema contempla tres tipos de usuario:

**Visitante (sin cuenta)**
Puede navegar por la web pública, consultar la información de los planes, usar el chatbot de orientación general y registrarse.

**Usuario registrado**
Puede iniciar sesión, solicitar un plan, gestionar su perfil (nombre, apellidos, teléfono, cumpleaños) y cambiar su contraseña. Si tiene un plan activo, accede al área de miembros y a la app privada.

**Administrador**
Accede al panel de administración. Puede ver todos los usuarios, aprobar o rechazar solicitudes de plan, cambiar el plan de cualquier usuario, resetear contraseñas, ver el historial de actividad de cada miembro y gestionar las reseñas (aprobar o eliminar).

### 4.3 Requisitos funcionales

**RF-01** — El sistema debe permitir a cualquier visitante registrarse con nombre, apellidos, email y contraseña.

**RF-02** — El sistema debe permitir iniciar sesión con email y contraseña y mantener la sesión activa durante 7 días.

**RF-03** — Un usuario registrado puede solicitar uno de los tres planes disponibles. La solicitud queda pendiente hasta que el administrador la aprueba.

**RF-04** — El administrador recibe una notificación visual (campana animada) cuando hay solicitudes pendientes.

**RF-05** — El administrador puede aprobar o rechazar solicitudes de plan. Al aprobar, el plan queda activo en la cuenta del usuario.

**RF-06** — El administrador puede cambiar directamente el plan de cualquier usuario sin necesidad de solicitud.

**RF-07** — El administrador puede resetear la contraseña de cualquier usuario y marcarla como temporal (el usuario debe cambiarla al iniciar sesión).

**RF-08** — Un usuario con plan activo puede acceder al área de miembros y a la app privada con los servicios de su plan.

**RF-09** — Los usuarios con Plan Exeltior pueden usar los seis servicios de inteligencia artificial disponibles en la app privada.

**RF-10** — Cada uso de un servicio IA queda registrado en el historial de actividad del usuario, visible para el administrador.

**RF-11** — Un usuario con plan activo puede enviar una reseña (una por usuario) con valoración de estrellas y texto.

**RF-12** — El administrador puede aprobar o eliminar reseñas. Solo las aprobadas aparecen en la página principal.

**RF-13** — El sistema debe mostrar al usuario un mensaje especial si inicia sesión el día de su cumpleaños.

### 4.4 Requisitos no funcionales

**RNF-01 — Seguridad:** Las contraseñas deben almacenarse cifradas con bcrypt. La comunicación debe ser siempre por HTTPS. Los tokens JWT deben validarse en el servidor antes de cada operación sensible.

**RNF-02 — Disponibilidad:** La plataforma debe ser accesible 24/7. Los contenedores deben configurarse con `restart: unless-stopped` para recuperarse automáticamente de fallos.

**RNF-03 — Rendimiento:** Los recursos estáticos (imágenes, CSS, JS) deben servirse con caché de 7 días. Se debe activar compresión gzip para reducir el tamaño de las respuestas.

**RNF-04 — Observabilidad:** El sistema debe disponer de monitorización con métricas de Nginx (peticiones por segundo, conexiones activas, códigos de respuesta) visibles en dashboards de Grafana.

**RNF-05 — Recuperabilidad:** El sistema debe realizar copias de seguridad automáticas de los archivos de la web, manteniendo los últimos 7 backups y eliminando los anteriores.

**RNF-06 — Mantenibilidad:** El código y la configuración deben estar versionados en Git. El proceso de actualización en producción debe estar documentado y ser reproducible.

**RNF-07 — Privacidad de credenciales:** Las claves de APIs externas nunca deben incluirse en el repositorio Git ni enviarse al navegador del usuario.

---

## 5. DISEÑO DEL SISTEMA

### 5.1 Arquitectura general

La plataforma sigue una arquitectura de tres capas clásica, pero contenerizada:

```
USUARIO (navegador)
        │
        │ HTTPS (puerto 443)
        ▼
┌──────────────────┐
│  NGINX (Capa 1)  │  Servidor web
│  - Sirve estáticos (HTML, CSS, JS, imágenes)
│  - Redirección HTTP → HTTPS
│  - Proxy inverso /api/ → backend
│  - Cabeceras de seguridad
└────────┬─────────┘
         │ HTTP interno Docker (api:3001)
         ▼
┌──────────────────┐
│  NODE.JS (Capa 2)│  Lógica de negocio
│  - API REST Express
│  - Autenticación JWT
│  - Validaciones
│  - Proxy hacia Groq IA
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  SQLITE (Capa 3) │  Persistencia
│  - Base de datos
│  - Volumen Docker (datos permanentes)
└──────────────────┘
```

Además, existen tres servicios auxiliares:

- **nginx-exporter**: expone las métricas de Nginx en formato Prometheus
- **Prometheus**: recolecta las métricas cada 15 segundos
- **Grafana**: visualiza las métricas en dashboards

Todos los servicios se comunican por la red interna de Docker. Solo Nginx expone puertos al exterior (80 y 443). Grafana expone el 3000 para acceso desde el VPS, pero no está abierto al público general.

### 5.2 Diseño de contenedores Docker

El fichero `docker-compose.yml` define cinco servicios:

| Servicio | Imagen base | Puertos externos | Datos persistentes |
|----------|------------|------------------|--------------------|
| `mmstudio_nginx` | nginx:alpine + build propio | 80, 443 | ./backups, ./logs, /etc/letsencrypt (solo lectura) |
| `mmstudio_api` | node:20-alpine + build propio | — (solo interno) | Volumen api_data |
| `mmstudio_nginx_exporter` | nginx/nginx-prometheus-exporter | — | — |
| `mmstudio_prometheus` | prom/prometheus | 9090 | Volumen prometheus_data |
| `mmstudio_grafana` | grafana/grafana | 3000 | Volumen grafana_data |

Los volúmenes con nombre (`api_data`, `prometheus_data`, `grafana_data`) son gestionados por Docker y sobreviven al `docker-compose down` y a los `--build`. Los datos de la base de datos, las métricas históricas y los dashboards de Grafana nunca se pierden al actualizar la aplicación.

El **Dockerfile de Nginx** parte de `nginx:alpine`, instala OpenSSL para generar un certificado autofirmado de fallback, copia la configuración y hornea todos los archivos estáticos de la web dentro de la imagen. Esto significa que para actualizar la web hay que reconstruir la imagen con `--build`.

El **Dockerfile de la API** parte de `node:20-alpine`, copia el `package.json`, instala solo las dependencias de producción (`--omit=dev`), copia el `server.js` y expone el puerto 3001.

### 5.3 Modelo de datos

La base de datos tiene cuatro tablas:

**Tabla `users`**

Almacena todos los usuarios del sistema, tanto clientes como administradores.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER PK | Identificador autoincremental |
| name | TEXT | Nombre del usuario |
| apellidos | TEXT | Apellidos (opcional) |
| telefono | TEXT | Teléfono de contacto (opcional) |
| birthday | TEXT | Fecha de cumpleaños en formato YYYY-MM-DD |
| email | TEXT UNIQUE | Email único, identificador de login |
| password | TEXT | Hash bcrypt de la contraseña |
| plan | TEXT | Plan activo actual o 'Sin plan activo' |
| plan_requested | TEXT | Plan solicitado pendiente de aprobación |
| joined | TEXT | Fecha de registro formateada en español |
| is_admin | INTEGER | 0 = usuario normal, 1 = administrador |
| force_pwd_change | INTEGER | 1 = obliga cambio de contraseña al login |

**Tabla `activity_logs`**

Registra cada uso de un servicio IA por parte de un miembro con plan activo.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER PK | Identificador autoincremental |
| user_id | INTEGER | Referencia al usuario |
| service | TEXT | Nombre del servicio utilizado |
| summary | TEXT | Resumen de la respuesta IA (máx. 300 caracteres) |
| created | TEXT | Fecha del uso |

**Tabla `reviews`**

Almacena las reseñas enviadas por los usuarios.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER PK | Identificador autoincremental |
| user_id | INTEGER | Referencia al usuario autor |
| user_name | TEXT | Nombre del usuario en el momento de envío |
| plan | TEXT | Plan del usuario en el momento de envío |
| stars | INTEGER | Valoración de 1 a 5 estrellas |
| body | TEXT | Texto de la reseña |
| approved | INTEGER | 0 = pendiente, 1 = aprobada y visible |
| created | TEXT | Fecha de envío |

La base de datos incluye un sistema de **migraciones automáticas**: al iniciar el servidor, se intentan ejecutar sentencias `ALTER TABLE` para añadir columnas que puedan no existir en bases de datos antiguas. Cada sentencia está dentro de un `try/catch` para que no rompa nada si la columna ya existe.

### 5.4 Diseño de la API REST

La API sigue los principios REST: cada recurso tiene su propia URL, los métodos HTTP indican la acción (GET leer, POST crear, PATCH actualizar, DELETE eliminar) y las respuestas son JSON.

Se agrupan en tres niveles de acceso:

**Públicos (sin autenticación):**
- `POST /api/register` — registro de nuevo usuario
- `POST /api/login` — inicio de sesión
- `GET /api/reviews` — reseñas aprobadas (para la home)

**Usuario autenticado (requiere JWT válido):**
- `GET /api/me` — obtener perfil propio
- `PATCH /api/me/profile` — actualizar datos de perfil
- `POST /api/change-password` — cambiar contraseña
- `POST /api/plan/request` — solicitar un plan
- `POST /api/activity` — registrar uso de servicio IA
- `POST /api/reviews` — enviar una reseña
- `POST /api/groq` — proxy autenticado hacia la IA

**Administrador (requiere JWT + isAdmin=1):**
- `GET /api/admin/users` — listar todos los usuarios
- `PATCH /api/admin/plan-requests/:id/approve` — aprobar solicitud
- `PATCH /api/admin/plan-requests/:id/reject` — rechazar solicitud
- `PATCH /api/admin/users/:id/plan` — cambiar plan directamente
- `PATCH /api/admin/users/:id/password` — resetear contraseña
- `GET /api/admin/users/:id/activity` — historial de actividad
- `GET /api/admin/reviews` — todas las reseñas
- `PATCH /api/admin/reviews/:id/approve` — aprobar reseña
- `DELETE /api/admin/reviews/:id` — eliminar reseña

### 5.5 Sistema de autenticación

El sistema de autenticación funciona con **JSON Web Tokens (JWT)**:

1. El usuario envía email y contraseña al endpoint `/api/login`
2. El servidor comprueba el email en la base de datos
3. Si existe, compara la contraseña con el hash bcrypt almacenado
4. Si es correcto, firma un JWT con los datos `{ id, email, isAdmin }` y una expiración de 7 días
5. El cliente guarda el token en `localStorage` con la clave `mm_token`
6. En cada petición protegida, el cliente incluye el token en el header `Authorization: Bearer <token>`
7. El middleware `authMiddleware` en el servidor verifica la firma del token antes de procesar la petición

Si el token ha expirado o es inválido, el servidor responde con código 401 y el cliente elimina la sesión local.

---

## 6. IMPLEMENTACIÓN — INFRAESTRUCTURA

### 6.1 Contenerización con Docker y Docker Compose

Docker permite empaquetar cada servicio con todas sus dependencias en un contenedor aislado. Esto resuelve el problema clásico de "en mi máquina funciona": como el entorno está definido en el Dockerfile, el resultado es siempre el mismo independientemente de dónde se ejecute.

Docker Compose permite definir y orquestar varios contenedores a la vez en un único fichero `docker-compose.yml`. Con un solo comando (`docker compose up -d --build`) se construyen las imágenes y se arrancan todos los servicios.

Los contenedores están configurados con `restart: unless-stopped`, lo que significa que si el servidor se reinicia o un contenedor cae, Docker lo vuelve a levantar automáticamente sin intervención manual.

La comunicación entre servicios se hace por la **red interna de Docker**: por ejemplo, Nginx accede al backend usando el hostname `api` (el nombre del servicio en el compose), no por IP. Esto es más robusto porque las IPs de los contenedores pueden cambiar.

```yaml
# Fragmento relevante de docker-compose.yml
services:
  nginx:
    build: .
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
    restart: unless-stopped

  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    volumes:
      - api_data:/data        # La BD persiste aquí
    environment:
      - JWT_SECRET=mmstudio-jwt-secret-2025
    restart: unless-stopped
```

### 6.2 Servidor web Nginx

Nginx actúa como servidor web principal y como proxy inverso. Tiene dos bloques `server`:

El primer bloque escucha en el puerto 80 (HTTP) y redirige todo el tráfico a HTTPS con un código 301 (redirección permanente). La única excepción es la ruta `/stub_status`, que expone las métricas internas de Nginx pero solo accesible desde las IPs internas de Docker.

El segundo bloque escucha en el puerto 443 (HTTPS) y se encarga de:

- Servir los archivos estáticos de la web desde `/usr/share/nginx/html`
- Aplicar compresión gzip a los tipos de contenido relevantes
- Gestionar la caché de recursos estáticos (7 días para imágenes, CSS, JS y vídeos)
- Aplicar las cabeceras de seguridad HTTP
- Redirigir las peticiones que empiecen por `/api/` hacia el contenedor de la API en el puerto 3001

```nginx
# Proxy inverso hacia el backend
location /api/ {
    proxy_pass http://api:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

Gracias a este proxy, el usuario nunca se comunica directamente con el backend. Todas las peticiones pasan por Nginx, que actúa como intermediario. Esto también significa que la API no necesita tener un puerto expuesto al exterior.

### 6.3 Certificado SSL y HTTPS

El certificado SSL ha sido obtenido con **Let's Encrypt** y el cliente **Certbot**. Let's Encrypt es una autoridad de certificación gratuita y automática que emite certificados válidos por 90 días y se pueden renovar también de forma automática.

El proceso fue:
1. Instalar Certbot en el VPS
2. Parar temporalmente los contenedores (necesita el puerto 80 libre)
3. Ejecutar `certbot certonly --standalone -d mymstudio.duckdns.org`
4. Let's Encrypt verifica que el dominio apunta al servidor haciendo una petición HTTP
5. Si la verificación es correcta, genera los archivos `fullchain.pem` y `privkey.pem`
6. Estos archivos se montan en el contenedor Nginx como volumen de solo lectura

```nginx
ssl_certificate     /etc/letsencrypt/live/mymstudio.duckdns.org/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/mymstudio.duckdns.org/privkey.pem;
ssl_protocols       TLSv1.2 TLSv1.3;
ssl_ciphers         HIGH:!aNULL:!MD5;
```

El Dockerfile también genera un certificado autofirmado como fallback para entornos donde Let's Encrypt no está disponible (por ejemplo, al hacer pruebas en local). En producción este certificado no se usa porque el de Let's Encrypt tiene prioridad.

El dominio `mymstudio.duckdns.org` es un subdominio gratuito de DuckDNS que apunta a la IP pública del VPS.

### 6.4 Cabeceras de seguridad HTTP

Nginx añade varias cabeceras de seguridad en todas las respuestas HTTPS:

**Strict-Transport-Security (HSTS)**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```
Indica al navegador que, durante el próximo año, debe acceder a este dominio siempre por HTTPS aunque el usuario escriba HTTP. Previene ataques de downgrade.

**X-Frame-Options**
```
X-Frame-Options: SAMEORIGIN
```
Impide que la web sea incrustada en un `<iframe>` de otro dominio. Protege contra ataques de clickjacking.

**X-Content-Type-Options**
```
X-Content-Type-Options: nosniff
```
Evita que el navegador intente adivinar el tipo de contenido de un archivo si no coincide con el `Content-Type` declarado. Previene algunos tipos de ataques XSS.

**X-XSS-Protection**
```
X-XSS-Protection: 1; mode=block
```
Activa el filtro XSS incorporado en navegadores antiguos y bloquea la página si se detecta un ataque.

**Referrer-Policy**
```
Referrer-Policy: strict-origin-when-cross-origin
```
Controla qué información se envía en el header `Referer` al navegar a otros sitios.

**Permissions-Policy**
```
Permissions-Policy: camera=(), microphone=(), geolocation=()
```
Desactiva explícitamente el acceso a cámara, micrófono y geolocalización, ya que la web no los necesita.

### 6.5 Monitorización con Prometheus y Grafana

El sistema de monitorización está compuesto por tres piezas:

**nginx-prometheus-exporter** es un pequeño programa que se conecta a `/stub_status` de Nginx (que expone contadores internos: conexiones activas, peticiones totales, estados de workers) y los transforma al formato de métricas que entiende Prometheus.

**Prometheus** es un sistema de recolección de métricas. Cada 15 segundos hace una petición HTTP al exportador de Nginx y almacena los valores con su timestamp. La configuración es mínima:

```yaml
scrape_configs:
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']
```

**Grafana** lee las métricas almacenadas en Prometheus y las muestra en dashboards visuales con gráficas, contadores y tablas. El provisioning automático (carpeta `grafana/provisioning/`) hace que al arrancar el contenedor ya tenga configurado el datasource de Prometheus y cargado el dashboard de Nginx, sin necesidad de configuración manual.

El dashboard muestra:
- Peticiones HTTP por segundo en tiempo real
- Número de conexiones activas
- Distribución de códigos de respuesta (2xx, 3xx, 4xx, 5xx)
- Workers de Nginx en estado activo, en espera o leyendo/escribiendo

### 6.6 Sistema de copias de seguridad

El script `backup.sh` realiza copias de seguridad de los archivos de la web:

```bash
FECHA=$(date +%Y%m%d_%H%M%S)
tar -czf "/backups/mmstudio_backup_${FECHA}.tar.gz" -C /usr/share/nginx/html .
```

Crea un archivo comprimido `.tar.gz` con la fecha y hora en el nombre, lo guarda en el directorio `/backups` (que es un volumen Docker montado en el host) e imprime información sobre el tamaño y el resultado.

Después comprueba cuántos backups hay en total. Si hay más de 7 (el máximo configurado), elimina los más antiguos para no llenar el disco:

```bash
TOTAL=$(ls "$DESTINO"/mmstudio_backup_*.tar.gz | wc -l)
if [ "$TOTAL" -gt "$MAX_BACKUPS" ]; then
    ls -t "$DESTINO"/mmstudio_backup_*.tar.gz | tail -n "$ELIMINAR" | xargs rm -f
fi
```

El script está preparado para automatizarse con crontab: añadiendo la línea `0 2 * * * /usr/local/bin/backup.sh` se ejecutaría cada día a las 2:00 de la madrugada.

### 6.7 Rotación de logs

Nginx genera dos ficheros de log:
- `access.log`: una línea por cada petición recibida
- `error.log`: errores y advertencias

Sin rotación, estos archivos crecerían indefinidamente y podrían llenar el disco. El fichero `logrotate.conf` configura la rotación:

- Rotar los logs cada semana
- Mantener las últimas 4 semanas (4 archivos comprimidos)
- Comprimir los archivos rotados con gzip
- Enviar la señal USR1 a Nginx para que reabra los archivos de log tras la rotación

Los logs están en el directorio `./logs/` que es un volumen montado en el host, por lo que están accesibles desde fuera del contenedor para análisis o auditoría.

### 6.8 Despliegue en VPS con dominio real

El servidor de producción es un VPS con Linux (Ubuntu). El proceso de actualización cuando se hace un cambio en el código es el siguiente:

```bash
# 1. Descartar cambios locales en el VPS (seguridad: evitar conflictos con las API keys)
git checkout auth.js asesor-ia.js consulta.html marca-personal.html \
            app.html server.js admin.html inicio.html

# 2. Descargar los cambios del repositorio
git pull

# 3. Inyectar la clave de la API de IA (antes del build, nunca en Git)
sed -i 's/TU_API_KEY_GROQ_AQUI/CLAVE_REAL/g' \
    auth.js asesor-ia.js consulta.html marca-personal.html server.js

# 4. Reconstruir y reiniciar los contenedores
docker-compose up -d --build
```

El paso 3 es especialmente importante: en el repositorio Git, la clave de la API de IA aparece como el texto `TU_API_KEY_GROQ_AQUI`. Justo antes de construir las imágenes Docker, se sustituye ese placeholder por la clave real con el comando `sed`. Así la clave nunca está en el repositorio, pero sí dentro de las imágenes que se ejecutan en el servidor.

---

## 7. IMPLEMENTACIÓN — APLICACIÓN WEB

### 7.1 Backend: Node.js y Express

El backend es un único fichero `server.js` que arranca un servidor Express en el puerto 3001. Express es un framework minimalista para Node.js que facilita la definición de rutas y middlewares.

La estructura general del servidor es:

```
1. Importaciones (express, https, better-sqlite3, bcryptjs, jsonwebtoken, cors)
2. Inicialización de Express y configuración (CORS, JSON)
3. Conexión a la base de datos SQLite
4. Creación de tablas (CREATE TABLE IF NOT EXISTS)
5. Migraciones automáticas (ALTER TABLE en try/catch)
6. Creación de cuentas iniciales (admin y easter egg)
7. Definición del middleware de autenticación
8. Definición de todos los endpoints (rutas)
9. Arranque del servidor (app.listen)
```

El uso de **better-sqlite3** en lugar del módulo `sqlite3` estándar tiene una ventaja importante: es **síncrono**. Esto simplifica mucho el código porque no es necesario usar callbacks o promesas para cada consulta a la base de datos.

```javascript
// Con better-sqlite3, las consultas son síncronas y muy limpias:
const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
const rows = db.prepare('SELECT * FROM users ORDER BY id DESC').all()
db.prepare('INSERT INTO users (name, email) VALUES (?, ?)').run(name, email)
```

### 7.2 Base de datos SQLite

SQLite es una base de datos relacional que almacena toda la información en un único fichero. Es una elección muy apropiada para este proyecto porque no necesita un servidor separado, el fichero de la BD es portable y el rendimiento es más que suficiente para la carga esperada.

El fichero de base de datos se guarda en `/data/mmstudio.db` dentro del contenedor de la API, que corresponde al volumen Docker `api_data` en el host. Esto garantiza que los datos persisten aunque el contenedor se reconstruya.

Al iniciar el servidor, se ejecutan los `CREATE TABLE IF NOT EXISTS` para crear las tablas si no existen. Después se ejecutan las migraciones para añadir columnas nuevas a bases de datos ya existentes:

```javascript
[
  'ALTER TABLE users ADD COLUMN apellidos TEXT NOT NULL DEFAULT \'\'',
  'ALTER TABLE users ADD COLUMN telefono TEXT NOT NULL DEFAULT \'\'',
  // ...
].forEach(function(sql) { try { db.exec(sql) } catch(e) {} })
```

Si la columna ya existe, SQLite lanza un error que el `catch` captura silenciosamente. Esto permite actualizar el esquema sin perder datos existentes.

### 7.3 Autenticación con JWT y bcrypt

**bcrypt** es un algoritmo diseñado específicamente para almacenar contraseñas de forma segura. A diferencia de MD5 o SHA, es intencionalmente lento (se puede configurar el "coste" computacional) y añade una "sal" aleatoria a cada hash. Esto hace que sea imposible usar tablas de hashes precalculadas (rainbow tables) para descifrar las contraseñas.

```javascript
// Al registrar: se hashea con coste 10
bcrypt.hashSync(password, 10)

// Al hacer login: se compara la contraseña con el hash
bcrypt.compareSync(passwordIntroducida, hashAlmacenado)
```

**JWT (JSON Web Token)** es un estándar para transmitir información de forma segura entre cliente y servidor. Un JWT está formado por tres partes codificadas en Base64 y separadas por puntos:

1. **Header**: algoritmo de firma (HS256)
2. **Payload**: datos que lleva (`{ id, email, isAdmin, exp }`)
3. **Signature**: firma HMAC del header+payload con el secreto del servidor

Solo el servidor conoce el secreto, por lo que si alguien modifica el payload del token, la firma ya no coincide y el servidor lo rechaza. Esto permite que el servidor confíe en los datos del token sin necesidad de consultar la base de datos en cada petición.

```javascript
// El middleware que protege las rutas:
function authMiddleware(req, res, next) {
  const token = (req.headers.authorization || '').split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No autenticado' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Sesión expirada' })
  }
}
```

### 7.4 Frontend: estructura de páginas

La web pública está formada por las siguientes páginas:

| Página | Descripción |
|--------|-------------|
| `inicio.html` | Página principal con hero, servicios, testimonios y CTA |
| `servicios.html` | Comparativa detallada de los tres planes con tabla de características |
| `asesoria-personal.html` | Información sobre el servicio de imagen personal |
| `marca-personal.html` | Información para empresas, con chatbot IA de marca |
| `planes-asesoria.html` | Información sobre redes sociales y analítica |
| `sobre-nosotros.html` | Página del proyecto con vídeo de presentación |
| `contacto.html` | Formulario de contacto |
| `solicitar-plan.html` | Formulario para solicitar un plan |
| `consulta.html` | Consulta personalizada con IA |
| `quiz.html` | Quiz de estilo personal |
| `app.html` | App privada de miembros (acceso con cuenta) |
| `admin.html` | Panel de administración (solo admins) |
| `404.html` | Página de error personalizada |

El CSS global (`estilos.css`) define la paleta de colores del proyecto (tonos dorados y marrones oscuros que evocan lujo y sofisticación), la tipografía, los componentes reutilizables (botones, tarjetas, secciones) y el diseño responsive para móvil.

### 7.5 Sistema de sesión en el cliente (auth.js)

`auth.js` se carga en todas las páginas públicas de la web. En lugar de usar un sistema de sesión del servidor, gestiona la autenticación completamente en el cliente usando `localStorage`.

Guarda dos elementos:
- `mm_token`: el JWT, usado para autenticar peticiones a la API
- `mm_session`: un objeto JSON con los datos del usuario en caché (nombre, email, plan, etc.)

Al cargar cualquier página, `auth.js` valida el token contra la API (`GET /api/me`) en segundo plano y actualiza la sesión local si los datos del usuario han cambiado (por ejemplo, si el admin le ha activado un plan).

El archivo inyecta en el DOM dos elementos flotantes:
- **Botón `👤`** (abajo a la derecha): abre el modal con las pestañas de login, registro, perfil, edición de perfil, cambio de contraseña y reseña.
- **Botón `👑 Mi Área`** (arriba a la izquierda): abre el modal del Área de Miembros con la asesora privada IA, los recursos del plan y el formulario de reseña.

El Área de Miembros solo muestra contenido a usuarios con plan activo. Si el usuario no tiene plan, muestra las opciones de contratación o el estado de su solicitud pendiente.

### 7.6 Integración con inteligencia artificial

La plataforma integra la API de Groq, que permite usar el modelo **Llama 3.3 70B** de Meta. Es un modelo de lenguaje de gran capacidad disponible de forma gratuita a través de Groq.

Para proteger la clave de la API se usa un **patrón de proxy backend**: la app privada (`app.html`) nunca llama directamente a la API de Groq. En su lugar, llama al endpoint `/api/groq` del propio backend, que está protegido por JWT. El servidor es quien hace la llamada real a Groq con la clave almacenada en el servidor.

```
app.html → POST /api/groq (con JWT) → server.js → api.groq.com → respuesta
```

Esto tiene dos ventajas:
1. La clave de la IA nunca llega al navegador del usuario.
2. Solo los usuarios autenticados pueden usar la IA (evita el abuso de la clave).

Los servicios IA de la app privada se dividen en dos tipos:

**Chats conversacionales** (Consultoría estratégica, Gestión de reputación, Limpieza de huella digital): mantienen un historial de la conversación que se envía completo en cada petición. Para que el modelo sepa que ya saludó al usuario y no repita la presentación en el segundo mensaje, el historial se inicializa con un turno sintético:

```javascript
_conHistory = [
  { role: 'user', content: 'Hola' },
  { role: 'assistant', content: mensajeDeBienvenida }
]
```

**Generadores de contenido** (LinkedIn, Sesión fotográfica, Filtrado de oportunidades): reciben datos de un formulario, construyen un prompt estructurado y piden al modelo que responda en un formato específico. Por ejemplo, el generador de LinkedIn pide exactamente:

```
HEADLINE: [máx 120 caracteres...]
ABOUT: [150-200 palabras, primera persona...]
```

La respuesta se parsea con expresiones regulares para separar el Headline del Acerca de y mostrarlos en secciones distintas.

Adicionalmente, `asesor-ia.js` (cargado en las páginas públicas) implementa un chatbot de orientación general para visitantes que todavía no son clientes. Este usa la clave de Groq directamente en el archivo (sustituida por `sed` antes del build) y tiene mensajes de fallback predefinidos para cuando la IA no esté disponible.

### 7.7 Panel de administración (admin.html)

El panel de administración es una página independiente con su propio sistema de login. Solo los usuarios con `is_admin = 1` pueden acceder; el servidor verifica esto en cada petición.

Al iniciar sesión, el panel carga todos los usuarios de la API y muestra:

**Estadísticas en tiempo real:**
- Total de usuarios registrados
- Solicitudes pendientes de activación de plan
- Usuarios con plan activo
- Usuarios sin plan
- Reseñas pendientes de aprobación

Si hay solicitudes pendientes, aparece una campana animada en el header que, al hacer clic, hace scroll hasta la sección de solicitudes.

**Gestión de solicitudes:** tarjetas con el nombre, email y plan solicitado de cada usuario. Botones de aprobar (activa el plan) y rechazar (limpia la solicitud).

**Tablas de usuarios:** una tabla con los usuarios que tienen plan activo y otra con los que no tienen plan. Cualquier fila es clickable y abre el modal de usuario.

**Modal de usuario:** al hacer clic en un usuario, se abre un modal con toda su información, un selector para cambiar su plan directamente, un formulario para resetear su contraseña (con opción de marcarla como temporal), y el historial de actividad cargado desde la API.

**Gestión de reseñas:** sección con todas las reseñas pendientes y aprobadas, con botones para publicar o eliminar cada una.

### 7.8 App privada de miembros (app.html)

La app privada es una Single Page Application (SPA) sencilla: todas las vistas están en el mismo HTML y se muestran u ocultan según el estado. Las vistas son:

- **Login**: formulario de acceso al área privada
- **Dashboard**: panel con los servicios del plan del usuario
- **6 vistas de servicios IA**: una por cada servicio del Plan Exeltior

El dashboard muestra un mensaje diferente según el estado del usuario:
- Sin plan: mensaje informativo con enlace a los planes
- Con solicitud pendiente: mensaje indicando que está en revisión
- Con plan activo: cuadrícula con los servicios disponibles

Los usuarios con Plan Normal y Premium ven tarjetas informativas de sus servicios. Los del Plan Exeltior ven botones de acción que abren cada servicio IA.

### 7.9 Actividad de usuarios y reseñas

**Sistema de actividad:**
Cada vez que un usuario con Plan Exeltior usa un servicio IA y recibe una respuesta correcta, la app llama al endpoint `POST /api/activity` en segundo plano (de forma que no bloquea la interfaz del usuario) con el nombre del servicio y los primeros 200 caracteres de la respuesta como resumen. Esto permite al administrador ver en qué está trabajando cada miembro y asesorarle mejor.

**Sistema de reseñas:**
Los usuarios con plan activo pueden enviar una reseña desde el Área de Miembros (pestaña "📝 Reseña") con valoración de 1 a 5 estrellas y un texto mínimo de 10 caracteres. Solo se permite una reseña por usuario. Las reseñas quedan en estado pendiente hasta que el administrador las aprueba desde el panel. Una vez aprobadas, aparecen en la página principal (`inicio.html`), sustituyendo a los testimonios estáticos de demostración.

---

## 8. SEGURIDAD

La seguridad ha sido una prioridad en todo el proyecto. Se han aplicado medidas en distintas capas:

### 8.1 Seguridad en la capa de transporte

Toda la comunicación entre el usuario y el servidor se realiza por HTTPS con TLS 1.2 o 1.3. La cabecera HSTS obliga al navegador a usar siempre HTTPS durante un año, incluso si el usuario intenta acceder por HTTP manualmente.

### 8.2 Seguridad en las contraseñas

Las contraseñas nunca se almacenan en texto plano ni con algoritmos de hash rápidos (MD5, SHA-1). Se usa bcrypt con un factor de coste de 10, lo que significa que calcular un hash tarda deliberadamente varios milisegundos. Esto hace que un ataque de fuerza bruta sea extremadamente lento: si alguien obtuviera el fichero de la base de datos, necesitaría años para probar millones de contraseñas.

### 8.3 Autenticación y autorización

El sistema de autenticación verifica la identidad en el servidor en cada petición protegida. No basta con que el cliente diga que es administrador: el token JWT contiene el campo `isAdmin` y está firmado por el servidor, por lo que no puede modificarse sin invalidar la firma. Además, cada endpoint de administrador comprueba explícitamente el campo en la base de datos antes de ejecutar cualquier operación.

### 8.4 Prevención de inyección SQL

Todas las consultas a la base de datos usan **prepared statements** (sentencias preparadas). Esto significa que el SQL y los datos están separados: el motor de la base de datos nunca interpreta los datos del usuario como código SQL. Aunque un usuario intentara poner `'; DROP TABLE users; --` en el campo de email, la consulta simplemente buscaría ese texto literal sin ejecutar nada malicioso.

```javascript
// Correcto: prepared statement con parámetros
db.prepare('SELECT * FROM users WHERE email = ?').get(email)

// Incorrecto (vulnerable a inyección): concatenación directa
db.exec('SELECT * FROM users WHERE email = ' + email)  // NUNCA así
```

### 8.5 Protección de credenciales de la API

La clave de la API de Groq nunca se guarda en el repositorio Git ni se envía al navegador del usuario desde `app.html`. El patrón usado es:

1. En el código fuente: se usa el placeholder `TU_API_KEY_GROQ_AQUI`
2. Antes del build en el VPS: `sed` sustituye el placeholder por la clave real
3. La clave queda dentro de la imagen Docker, fuera del repositorio

### 8.6 Cabeceras de seguridad HTTP

Como se describió en el capítulo 6, Nginx añade seis cabeceras de seguridad que protegen contra clickjacking, XSS, sniffing de tipos de contenido y acceso a hardware no necesario.

### 8.7 Control de acceso en el servidor

Las rutas de administrador comprueban siempre en el servidor que el usuario autenticado tiene `isAdmin = 1`. Aunque un usuario normal intentara llamar directamente a un endpoint de administrador con un JWT válido pero sin permisos, recibiría un error 403 (Acceso denegado). El control de acceso nunca se delega solo al cliente.

---

## 9. PRUEBAS

### 9.1 Pruebas funcionales de autenticación

| Prueba | Resultado esperado | Resultado obtenido |
|--------|-------------------|-------------------|
| Registro con datos válidos | Token JWT + sesión iniciada | ✅ Correcto |
| Registro con email duplicado | Error 409 "Ya existe una cuenta" | ✅ Correcto |
| Registro con contraseña < 6 chars | Error 400 | ✅ Correcto |
| Login con credenciales correctas | Token JWT + datos de usuario | ✅ Correcto |
| Login con contraseña incorrecta | Error 401 | ✅ Correcto |
| Login con email inexistente | Error 401 | ✅ Correcto |
| Acceder a /api/me sin token | Error 401 | ✅ Correcto |
| Acceder a /api/me con token expirado | Error 401 "Sesión expirada" | ✅ Correcto |
| Acceder a ruta de admin sin isAdmin | Error 403 "Acceso denegado" | ✅ Correcto |

### 9.2 Pruebas funcionales de planes y usuarios

| Prueba | Resultado esperado | Resultado obtenido |
|--------|-------------------|-------------------|
| Solicitar plan sin tener uno activo | plan_requested actualizado | ✅ Correcto |
| Solicitar plan teniendo ya uno activo | Error 400 | ✅ Correcto |
| Aprobar solicitud desde admin | plan = 'Plan X activo', plan_requested = '' | ✅ Correcto |
| Rechazar solicitud desde admin | plan_requested = '' | ✅ Correcto |
| Cambiar plan directamente desde admin | plan actualizado | ✅ Correcto |
| Resetear contraseña con force_change=true | force_pwd_change = 1 en BD | ✅ Correcto |
| Login con force_pwd_change = 1 | Banner de contraseña temporal visible | ✅ Correcto |
| Cambiar contraseña temporal con pwd incorrecta | Error 401 | ✅ Correcto |

### 9.3 Pruebas de la API de IA

| Prueba | Resultado esperado | Resultado obtenido |
|--------|-------------------|-------------------|
| Llamar a /api/groq sin token | Error 401 | ✅ Correcto |
| Llamar a /api/groq con token válido | Respuesta del modelo Llama | ✅ Correcto |
| El historial se mantiene entre mensajes | El modelo recuerda contexto previo | ✅ Correcto |
| El usuario no ve la API key en el código | Clave no presente en app.html | ✅ Correcto |
| El modelo no se presenta de nuevo en el 2º mensaje | Pre-seeding del historial funciona | ✅ Correcto |

### 9.4 Pruebas de seguridad

**Prueba de inyección SQL:** se intentó introducir `' OR '1'='1` en el campo de email durante el login. Al usar prepared statements, la consulta no devuelve ningún usuario y el login falla correctamente.

**Prueba de acceso directo a rutas de admin:** se obtuvo un JWT válido de un usuario normal y se intentó llamar a `GET /api/admin/users` con ese token. El servidor respondió 403. El campo `isAdmin` en el JWT no puede manipularse sin invalidar la firma.

**Verificación de HTTPS:** se accedió a `http://mymstudio.duckdns.org` y se comprobó que el servidor redirige automáticamente a HTTPS con código 301.

**Verificación de cabeceras:** usando las herramientas de desarrollo del navegador y el servicio `securityheaders.com`, se verificó que las cabeceras `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy` y `Permissions-Policy` están presentes en todas las respuestas.

### 9.5 Pruebas de infraestructura

**Persistencia de datos:** se detuvo y eliminó el contenedor de la API (`docker stop mmstudio_api && docker rm mmstudio_api`) y se volvió a lanzar con `docker compose up -d`. Al acceder con una cuenta ya registrada, los datos seguían intactos gracias al volumen `api_data`.

**Reinicio automático:** se forzó el cierre del proceso de Node.js dentro del contenedor. El sistema lo reinició automáticamente en menos de 5 segundos gracias a la política `restart: unless-stopped`.

**Prueba de backup:** se ejecutó manualmente `./backup.sh` y se comprobó que creaba el archivo `.tar.gz` en el directorio `./backups/`. Se ejecutó 8 veces seguidas para verificar que el séptimo backup más antiguo era eliminado correctamente.

**Monitorización:** se accedió al panel de Grafana, se navegó por la web generando peticiones y se verificó que el gráfico de peticiones por segundo reflejaba la actividad en tiempo real.

---

## 10. CONCLUSIONES

### 10.1 Objetivos alcanzados

Al concluir el proyecto se puede confirmar que todos los objetivos marcados al inicio han sido cumplidos:

- La aplicación está completamente contenerizada con Docker y Docker Compose, con 5 servicios funcionando en paralelo.
- Nginx sirve la web con HTTPS, redirección automática desde HTTP, cabeceras de seguridad y proxy inverso hacia el backend.
- El certificado SSL es real y válido (Let's Encrypt), no autofirmado.
- La API REST está completamente funcional con autenticación JWT, control de roles y consultas seguras con prepared statements.
- Las contraseñas se almacenan con bcrypt, nunca en texto plano.
- El sistema de monitorización con Prometheus y Grafana muestra métricas en tiempo real.
- Los backups automáticos funcionan con rotación de archivos.
- La integración con la IA (Groq) funciona de forma segura a través del proxy backend.
- La aplicación está desplegada y accesible en un dominio real: `mymstudio.duckdns.org`.

Más allá de los objetivos técnicos, este proyecto ha servido para comprender cómo funciona una aplicación real de principio a fin: desde la petición del usuario en el navegador hasta la respuesta de la base de datos, pasando por la red, el servidor web, el backend y la autenticación. Esa visión global es, sin duda, lo más valioso del TFG.

### 10.2 Dificultades encontradas

**Gestión de la API key con Docker:** el mayor problema técnico fue cómo inyectar la clave de la IA sin subirla a GitHub. Al principio no se había contemplado este aspecto y la clave estaba directamente en el código. La solución con `sed` antes del `docker build` requirió varias pruebas para que el flujo de despliegue fuera correcto y no hubiera conflictos al hacer `git pull`.

**Certificado SSL con Let's Encrypt y Docker:** obtener el certificado es sencillo en un servidor normal, pero con Docker el proceso es más complejo porque Certbot necesita el puerto 80 libre y los contenedores lo usan. La solución fue parar los contenedores, obtener el certificado, y luego montar la carpeta de Let's Encrypt como volumen de solo lectura en el contenedor de Nginx.

**Persistencia de la base de datos:** al inicio el volumen de Docker no estaba configurado correctamente y al reconstruir el contenedor con `--build` se perdían los usuarios registrados. La clave para solucionarlo fue comprender que el volumen debe ser con nombre (no un bind mount del directorio del código).

**Historial de la IA:** los chats conversacionales de la app tenían un problema: el modelo se volvía a presentar en cada mensaje nuevo. El problema era que el saludo inicial se mostraba en la UI pero no se incluía en el historial enviado a la API. La solución fue pre-sembrar el historial con un turno sintético.

### 10.3 Líneas futuras

Hay varias mejoras que no se han implementado por falta de tiempo pero que serían interesantes:

- **Certificado SSL con renovación automática:** configurar un cron job en el VPS que ejecute `certbot renew` periódicamente para que el certificado no caduque.
- **Notificaciones por email:** enviar un correo al administrador cuando llegue una solicitud de plan nueva.
- **Más planes y servicios de IA:** extender el sistema a los planes Normal y Premium con sus propios servicios interactivos.
- **Autenticación OAuth:** permitir el registro e inicio de sesión con Google o GitHub.
- **Dashboard de administrador más completo:** gráficas de crecimiento de usuarios, ingresos estimados, servicios más usados.
- **Tests automatizados:** añadir pruebas unitarias y de integración con una herramienta como Jest.

---

## 11. BIBLIOGRAFÍA

**Docker y contenedores:**
- Documentación oficial de Docker: https://docs.docker.com
- Documentación de Docker Compose: https://docs.docker.com/compose

**Nginx:**
- Documentación oficial de Nginx: https://nginx.org/en/docs/
- Guía de configuración SSL/TLS en Nginx: https://nginx.org/en/docs/http/configuring_https_servers.html

**Seguridad web:**
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Mozilla Observatory (análisis de cabeceras): https://observatory.mozilla.org
- Let's Encrypt — Documentación de Certbot: https://certbot.eff.org/docs/

**Node.js y Express:**
- Documentación de Node.js: https://nodejs.org/en/docs
- Documentación de Express: https://expressjs.com/en/4x/api.html
- Documentación de better-sqlite3: https://github.com/WiseLibs/better-sqlite3

**Autenticación:**
- Especificación JWT (RFC 7519): https://datatracker.ietf.org/doc/html/rfc7519
- Documentación de jsonwebtoken: https://github.com/auth0/node-jsonwebtoken
- Documentación de bcryptjs: https://github.com/dcodeIO/bcrypt.js

**Monitorización:**
- Documentación de Prometheus: https://prometheus.io/docs/
- Documentación de Grafana: https://grafana.com/docs/

**Inteligencia artificial:**
- Groq API Documentation: https://console.groq.com/docs/

---

## 12. ANEXOS

### Anexo A — Estructura de directorios del proyecto

```
MMWeb/
├── Dockerfile              Imagen Docker para Nginx
├── Dockerfile.api          Imagen Docker para Node.js
├── docker-compose.yml      Orquestación de servicios
├── nginx.conf              Configuración completa de Nginx
├── package.json            Dependencias del backend
├── server.js               API REST (Node.js + Express)
├── prometheus.yml          Configuración de scraping
├── backup.sh               Script de backups con rotación
├── logrotate.conf          Configuración de rotación de logs
│
├── estilos.css             CSS global
├── script.js               JS global (scroll, animaciones)
├── auth.js                 Sistema de autenticación cliente
├── asesor-ia.js            Chatbot IA para visitantes
│
├── inicio.html             Página principal
├── servicios.html          Comparativa de planes
├── asesoria-personal.html
├── marca-personal.html
├── planes-asesoria.html
├── sobre-nosotros.html
├── contacto.html
├── solicitar-plan.html     Formulario de solicitud de plan
├── consulta.html           Consulta IA personalizada
├── quiz.html               Quiz de estilo
├── app.html                App privada de miembros
├── admin.html              Panel de administración
├── 404.html                Página de error personalizada
│
├── fotos_inicio/           Imágenes del hero
├── images/                 Imágenes de tarjetas y secciones
├── grafana/                Provisioning automático de Grafana
│   └── provisioning/       Datasource y dashboard
├── backups/                Directorio de backups (volumen)
└── logs/                   Logs de Nginx (volumen)
```

### Anexo B — Comandos de despliegue en producción

**Primera instalación en el VPS:**
```bash
# Clonar el repositorio
git clone https://github.com/usuario/MMStudio-Web-TFG.git
cd MMStudio-Web-TFG

# Obtener certificado SSL (con el puerto 80 libre)
certbot certonly --standalone -d mymstudio.duckdns.org

# Inyectar la clave de la IA
sed -i 's/TU_API_KEY_GROQ_AQUI/CLAVE_REAL/g' \
    auth.js asesor-ia.js consulta.html marca-personal.html server.js

# Lanzar todos los servicios
docker-compose up -d --build
```

**Actualización del código:**
```bash
cd /root/MMStudio-Web-TFG

# Descartar cambios locales (evitar conflictos con las API keys)
git checkout auth.js asesor-ia.js consulta.html \
            marca-personal.html app.html server.js

# Descargar cambios
git pull

# Inyectar la clave de la IA
sed -i 's/TU_API_KEY_GROQ_AQUI/CLAVE_REAL/g' \
    auth.js asesor-ia.js consulta.html marca-personal.html server.js

# Reconstruir y reiniciar
docker-compose up -d --build
```

**Comandos de administración:**
```bash
# Ver estado de todos los contenedores
docker ps --format 'table {{.Names}}\t{{.Status}}'

# Ver logs del backend
docker logs mmstudio_api -f

# Ver logs de Nginx
docker logs mmstudio_nginx -f

# Ejecutar backup manual
docker exec mmstudio_nginx /bin/sh -c "cd / && ./backup.sh"

# Acceder a la base de datos SQLite
docker exec -it mmstudio_api sqlite3 /data/mmstudio.db
```

### Anexo C — Variables de entorno y configuración

| Variable | Servicio | Valor por defecto | Descripción |
|----------|----------|-------------------|-------------|
| `JWT_SECRET` | API | `mmstudio-secret-2025` | Secreto para firmar los JWT |
| `GROQ_KEY` | API | Placeholder (sed en VPS) | Clave de la API de Groq |
| `GF_SECURITY_ADMIN_USER` | Grafana | `admin` | Usuario de Grafana |
| `GF_SECURITY_ADMIN_PASSWORD` | Grafana | `mmstudio123` | Contraseña de Grafana |

### Anexo D — Diagrama de flujo de un usuario

```
VISITANTE
   │
   ├──► Navega la web pública
   │       └──► Puede chatear con el asistente IA de orientación
   │
   ├──► Se registra (nombre, email, contraseña)
   │       └──► Se crea su cuenta con "Sin plan activo"
   │
   ├──► Solicita un plan
   │       └──► plan_requested = 'Plan X'
   │
   │   [ADMIN]
   │   └──► Aprueba la solicitud
   │           └──► plan = 'Plan X activo', plan_requested = ''
   │
   ├──► Inicia sesión → animación de plan activado
   │
   ├──► Usa el Área de Miembros (auth.js)
   │       ├──► Chat con asesora privada IA
   │       ├──► Consulta sus recursos del plan
   │       └──► Escribe una reseña (pendiente de aprobación)
   │
   ├──► Accede a app.html (app privada)
   │       ├──► Ve sus servicios disponibles
   │       └──► Usa los servicios IA (Plan Exeltior)
   │               └──► Cada uso queda en activity_logs
   │
   └──► [ADMIN]
           ├──► Ve la actividad del usuario en el panel
           └──► Aprueba la reseña → aparece en inicio.html
```

---

*Memoria del Trabajo de Fin de Grado — M&M Studio*
*Marcos Valero Báscones y Marius — Universidad Europea — 2025/2026*
