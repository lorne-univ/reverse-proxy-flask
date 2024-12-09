import logging
from flask import Flask, request

app = Flask(__name__)

# Configurer le logger
logging.basicConfig(
    level=logging.INFO,  # Niveau du logging : DEBUG, INFO, WARNING, ERROR, CRITICAL
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("app.log"),  # Sauvegarde dans un fichier
        logging.StreamHandler()         # Affichage dans la console
    ]
)

@app.before_request
def log_request_info():
    logging.info(f"Requête reçue : {request.method} {request.url}")
    logging.info(f"Headers : {request.headers}")
    logging.info(f"Payload : {request.get_data(as_text=True)}")

@app.route("/")
def home():
    return "URL /"

@app.route("/test")
def test():
    return "URL /test"

@app.route("/test2")
def test2():
    return "URL /test2"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
