# ---------------------------------------------------------------------------
# Plantilla de Dockerfile para el shell y para cada microfrontend remoto.
# Copiar a frontend/<nombre>/Dockerfile.
#
# El resultado es una imagen nginx con los estáticos ya compilados: cada
# microfrontend se construye y se despliega por separado, sin depender del
# ciclo de vida de los demás.
# ---------------------------------------------------------------------------

# --- Etapa 1: build ---------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

# PUBLIC_PATH debe coincidir con la ruta que publica el edge
# (p. ej. /mf-reservas/). Sin esto, el remote pide sus chunks a la raíz y
# el shell falla al cargarlo con un 404.
ARG PUBLIC_PATH=/
ARG MF_RESERVAS_URL
ARG MF_ADMINISTRACION_URL
ARG MF_REPORTES_URL
ARG API_BASE_URL=/api

ENV PUBLIC_PATH=$PUBLIC_PATH \
    MF_RESERVAS_URL=$MF_RESERVAS_URL \
    MF_ADMINISTRACION_URL=$MF_ADMINISTRACION_URL \
    MF_REPORTES_URL=$MF_REPORTES_URL \
    API_BASE_URL=$API_BASE_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Etapa 2: servir --------------------------------------------------------
FROM nginx:1.27-alpine

# dist/ para Rsbuild y Vite; cambiar a build/ si se usa CRA.
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
    CMD wget -qO- http://localhost/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
