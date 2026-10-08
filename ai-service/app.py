from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import math

app = Flask(__name__)
CORS(app)

CLASSIFICATION_RULES = {
    "PANNE_MOTEUR": ["moteur", "panne", "calé", "essence", "carburant", "mécanique"],
    "ECHOUEMENT": ["échou", "échoue", "sable", "récif", "rocher", "bas-fond"],
    "INONDATION": ["eau", "inondation", "voie d'eau", "cave", "pompe"],
    "INCENDIE": ["feu", "fumée", "brûle", "incendie", "étincelle"],
    "MEDICAL": ["blessé", "malade", "malaise", "évacuation médicale", "infirmier"],
}

@app.route("/classify", methods=["POST"])
def classify():
    text = request.json.get("text", "")
    detected = []
    for cat, keywords in CLASSIFICATION_RULES.items():
        for kw in keywords:
            if kw in text.lower():
                detected.append(cat)
                break
    if not detected:
        detected = ["AUTRE"]
    severity = "MEDIUM"
    if any(w in text.lower() for w in ["critique", "urgence", "détresse", "feu", "blessé"]):
        severity = "CRITICAL"
    elif any(w in text.lower() for w in ["important", "grave", "rapide"]):
        severity = "HIGH"
    return jsonify({"types": detected, "severity": severity, "confidence": 0.85})

@app.route("/predict-eta", methods=["POST"])
def predict_eta():
    data = request.json
    lat1 = data.get("lat", 43.12)
    lng1 = data.get("lng", 5.92)
    lat2 = data.get("dest_lat", 43.18)
    lng2 = data.get("dest_lng", 5.85)
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(dlng/2)**2
    c = 2*math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = R*c
    speed_kn = data.get("speed", 12)
    speed_kmh = speed_kn * 1.852
    eta_hours = distance / speed_kmh if speed_kmh>0 else 0
    hours = int(eta_hours)
    minutes = int((eta_hours - hours)*60)
    return jsonify({
        "distance_km": round(distance,2),
        "eta_hours": round(eta_hours,2),
        "eta_formatted": f"{hours}h{minutes}min" if hours>0 else f"{minutes}min",
        "speed_kn": speed_kn
    })

OLLAMA_URL = "http://ollama:11434/api/generate"

@app.route("/chat", methods=["POST"])
def chat():
    user_msg = request.json.get("message", "")
    if not user_msg:
        return jsonify({"response": "Veuillez fournir un message."}), 400
    payload = {
        "model": "llama3.2:1b",
        "prompt": f"Réponds brièvement en français : {user_msg}",
        "stream": False,
        "options": {"temperature": 0.3, "top_p": 0.9}
    }
    try:
        resp = requests.post(OLLAMA_URL, json=payload, timeout=120)
        if resp.status_code == 200:
            result = resp.json()
            return jsonify({"response": result.get("response", "Je n'ai pas compris.")})
        else:
            return jsonify({"response": f"Erreur Ollama: {resp.status_code}"}), 500
    except Exception as e:
        print(f"❌ Chat error: {e}")
        return jsonify({"response": f"⚠️ Erreur: {str(e)}"}), 500

@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"status": "ok"})

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "AI Service running!"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False, threaded=True)