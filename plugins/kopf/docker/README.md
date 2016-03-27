# Kopf in docker

Tagged docker images for kopf, `lmenezes/elasticsearch-kopf` on docker hub.

## Usage

Use `docker run` as you always do. You need to publish port `80`
(and `443` if you use ssl) in order to have access to kopf.

Container should have access to elasticsearch. You don't
need to expose elasticsearch to end users of kopf.

It is strongly recommended to use https and basic auth
if you don't want to get hacked.

### Env variables.

* `KOPF_SERVER_NAME` server name for your grafana, for example `kopf.example.com`
* `KOPF_ES_SERVERS` elasticsearch servers in `host:port[,host:port]` format
* `KOPF_SSL_CERT` path to ssl `.crt` file, enables http-to-https redirect, should be bind-mounted
* `KOPF_SSL_KEY` path to ssl `.key` file, should be bind-mounted
* `KOPF_BASIC_AUTH_LOGIN` basic auth login, if needed
* `KOPF_BASIC_AUTH_PASSWORD` hashed basic auth password, if needed
* `KOPF_NGINX_INCLUDE_FILE` file to include into main server of nginx (place allowed ips here)
* `KOPF_WITH_CREDENTIALS` set the external setting with_credentials. Default: false
* `KOPF_THEME` set the theme in external settings. Default: dark
* `KOPF_REFRESH_RATE` set the external setting refresh_rate. Default: 5000

### Example

#### pure docker run

Running kopf with elasticsearch on `es.dev:9200`,
exposing it on `kopf.dev` with ip address `10.10.10.10`:

```
docker run -d -p 10.10.10.10:80:80 -e KOPF_SERVER_NAME=grafana.dev \
    -e KOPF_ES_SERVERS=es.dev:9200 --name kopf lmenezes/elasticsearch-kopf
```
#### fig

An easy way to orchestrate a local docker run is fig
Install fig by fireing up ```pip install fig```.
After create a fig file and off you go. 
```
$ cat << EOF > fig.yml
kopf:
  image: lmenezes/elasticsearch-kopf
  ports:
  - 8080:80
  environment:
  - KOPF_SERVER_NAME=dockerhost
  - KOPF_ES_SERVERS=172.17.42.1:9200
EOF
$ fig up -d
Creating docker_kopf_1...
$
```
This docker container will connect to an ES instance running on the DOCKER_HOST, which exposes 9200.
