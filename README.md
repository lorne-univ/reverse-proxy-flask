# Héberger une application Flask derrrière un reverse proxy Apache

Ce dépot est construit pour faire des **tests**.

Créer un réseau, commun aux applications et au reverse proxy.dokc

`docker network create reverse-proxy`

Application Flask (flask-app) écoute en interne sur le port 5000.
Cette application dessert 3 URL : 
- /
- /test
- /test2

L'application flask est hébergée dans le sous-dossier /flask.
On a donc les URL : 
- /flask/
- /flask/test
- /flask/test2

Application LoRaWAN-Compiler-WebApp écoute en interne sur le port 4050.
Pour télécharger l'application voir Readme.md à https://github.com/elias-qzo/LoRaWAN-Compiler-Webapp
```
git clone https://github.com/elias-qzo/LoRaWAN-Compiler-Webapp
git clone https://github.com/SylvainMontagny/STM32WL.git
```
Editer le fichier docker-compose.yml
Rajouter à la fin 
```
networks:
  reverse-proxy:
    external: true
```
Rajouter dans la définition du service compiler-web l'utilisation du réseau: 

```
services:
  compiler-web:
    build: . # Docker build current folder
    image: lorawan-compiler-webapp # Webapp image
    ports:
      - "4050:4050" # Webapp port
    volumes:
      - shared-vol:/shared-vol # Volume to share data across containers
      - ${STM32WL_PATH:-../STM32WL/STM32WL-standalone}:/STM32WL # Path to compiler folder
      - /var/run/docker.sock:/var/run/docker.sock # Docker socket to start container inside a container
    environment:
      - GENERAL_SETUP_PATH=/LoRaWAN/App # General_Setup.h path in compiler folder
      - CONFIG_APPLICATION_PATH=/LoRaWAN # config_application.h path in compiler folder
    networks:
      reverse-proxy:
```

Pour démarrer l'application : `docker compose up -d --build`

Cette application dessert plusieurs URL :
- / 
- /compile
- /compile-multiple

Un conteneur httpd retransmet les requête reçues sur le port 80 vers l'application adéquates.
Les URLS sont : 
- http://preprod.univ-lorawan.fr/flask 
- http://preprod.univ-lorawan.fr/compiler


Extrait du fichier httpd.conf 
```
 ProxyPass /flask http://flask-app:5000/
    ProxyPassReverse /flask http://flask-app:5000/

    <Location />
        Require all granted
    </Location>

    ProxyPass /compiler http://lorawan-compiler-webapp:4050
    ProxyPassReverse /compiler http://lorawan-compiler-webapp:4050
```


## Analyse des logs de l'application et du reverse proxy pour debuger

- Navigateur : http://preprod.univ-lorawan.fr/flask
```
apache-1     | 193.48.121.87 - - [09/Dec/2024:09:28:26 +0000] "GET /flask HTTP/1.1" 200 5
flask-app-1  | 2024-12-09 09:28:26,887 - root - INFO - Requête reçue : GET http://preprod.univ-lorawan.fr/
```

- Navigateur : http://preprod.univ-lorawan.fr/flask/test
```
apache-1     | 193.48.121.87 - - [09/Dec/2024:09:27:57 +0000] "GET /flask/test HTTP/1.1" 200 9
flask-app-1  | 2024-12-09 09:27:57,714 - root - INFO - Requête reçue : GET http://preprod.univ-lorawan.fr/test
```

- Navigateur : http://preprod.univ-lorawan.fr/flask/test2
```
apache-1     | 193.48.121.87 - - [09/Dec/2024:09:29:11 +0000] "GET /flask/test2
flask-app-1  | 2024-12-09 09:29:11,426 - root - INFO - Requête reçue : GET http://preprod.univ-lorawan.fr/test2
```

- Navigateur : http://preprod.univ-lorawan.fr/compiler/
```
apache-1                   | 193.48.121.87 - - [09/Dec/2024:10:11:31 +0000] "GET /compiler/ HTTP/1.1" 304 - "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
apache-1                   | 193.48.121.87 - - [09/Dec/2024:10:11:31 +0000] "GET /compiler/css/style.css HTTP/1.1" 304 - "http://preprod.univ-lorawan.fr/compiler/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
apache-1                   | 193.48.121.87 - - [09/Dec/2024:10:11:31 +0000] "GET /socket.io/socket.io.js HTTP/1.1" **404** 196 "http://preprod.univ-lorawan.fr/compiler/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
apache-1                   | 193.48.121.87 - - [09/Dec/2024:10:11:31 +0000] "GET /compiler/js/main.js HTTP/1.1" 304 - "http://preprod.univ-lorawan.fr/compiler/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko
```
On voit l'erreur **404** lors du GET /socket.io/socket.io.js

## Fichier httpd.conf

```
<VirtualHost *:80>
    ProxyPreserveHost On
    ServerName preprod.univ-lorawan.fr
    # Redirection vers une application backend
    ProxyPass /flask http://flask-app:5000/
    ProxyPassReverse /flask http://flask-app:5000/

    # <Location />
    #     Require all granted
    # </Location>

    ProxyPass "/compiler" "http://lorawan-compiler-webapp:4050"
    ProxyPassReverse "/compiler" "http://lorawan-compiler-webapp:4050"
    # ProxyHTMLURLMap "/compiler" "http://lorawan-compiler-webapp:4050"

    # ProxyPass /socket.io/ http://lorawan-compiler-webapp:4050/socket.io/
    # ProxyPassReverse /socket.io http://lorawan-compiler-webapp:4050/socket.io/
    LogLevel proxy:trace7
    RewriteEngine on
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/compiler/(.*) "ws://lorawan-compiler-webapp:4050/$1" [P,L]
    

</VirtualHost>
```

