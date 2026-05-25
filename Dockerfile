FROM nginx:alpine

# Instalar openssl para generar certificado autofirmado
RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/certs && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/nginx/certs/selfsigned.key \
      -out    /etc/nginx/certs/selfsigned.crt \
      -subj   "/C=ES/ST=Madrid/L=Madrid/O=MMStudio/CN=localhost"

# Copiar configuración de Nginx con cabeceras de seguridad y HTTPS
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos de la web
COPY . /usr/share/nginx/html

EXPOSE 80 443
