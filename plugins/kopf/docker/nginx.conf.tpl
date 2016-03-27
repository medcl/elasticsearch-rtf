daemon off;
user www-data;
worker_processes 4;
pid /run/nginx.pid;

events {
  worker_connections 1024;
}

http {
  sendfile on;
  tcp_nopush on;
  tcp_nodelay on;
  keepalive_timeout 65;
  types_hash_max_size 2048;

  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  access_log /dev/stdout;
  error_log /dev/stderr;

  upstream es {
    {% for server in KOPF_ES_SERVERS.split(",") %}
    server {{ server }};
    {% endfor %}
  }

  {% if KOPF_SSL_CERT is defined %}
  server {
    listen 80;
    server_name {{ KOPF_SERVER_NAME }};
    return 301 https://{{ KOPF_SERVER_NAME }}$request_uri;
  }
  {% endif %}

  server {
    {% if KOPF_SSL_CERT is defined %}
    listen 443 ssl;

    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_certificate {{ KOPF_SSL_CERT }};
    ssl_certificate_key {{ KOPF_SSL_KEY }};
    {% else %}
    listen 80;
    {% endif %}

    server_name {{ KOPF_SERVER_NAME }};

    satisfy any;

    {% if KOPF_BASIC_AUTH_LOGIN is defined %}
    auth_basic "Access restricted";
    auth_basic_user_file /etc/nginx/kopf.htpasswd;
    {% endif %}

    {% if KOPF_NGINX_INCLUDE_FILE is defined %}
    include {{ KOPF_NGINX_INCLUDE_FILE }};
    {% endif %}

    # suppress passing basic auth to upstreams
    proxy_set_header Authorization "";

    # everybody loves caching bugs after upgrade
    expires -1;

    location / {
      root /kopf/_site;
    }

    location /es/ {
      rewrite ^/es/(.*)$ /$1 break;
      proxy_pass http://es;
    }
  }
}
