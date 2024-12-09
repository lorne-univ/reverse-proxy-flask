# Héberger une application Flask derrrière un reverse proxy Apache

Ce dépot est construit pour faire des **tests**.

Une application Flask écoute en interne sur le port 4900.
Cette application dessert 3 URL : 
- /
- /test
- /test2

Un conteneur httpd proxy les requête reçues sur le port 80 vers l'application écoutant sur le port 4900.


