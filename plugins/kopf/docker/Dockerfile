FROM nginx:1.9.4

# upgrade
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends python-pip curl && \
    rm -rf /var/lib/apt/lists/* && \
    pip install envtpl

# nginx
ADD nginx.conf.tpl /etc/nginx/nginx.conf.tpl

# run script
ADD ./run.sh ./run.sh

# kopf
ENV KOPF_VERSION 2.0.1
RUN curl -s -L "https://github.com/lmenezes/elasticsearch-kopf/archive/v${KOPF_VERSION}.tar.gz" | \
    tar xz -C /tmp && mv "/tmp/elasticsearch-kopf-${KOPF_VERSION}" /kopf

# logs
VOLUME ["/var/log/nginx"]

# ports
EXPOSE 80 443

ENTRYPOINT ["/run.sh"]
