"""
Pipeline yapilandirmasi.
"""
import os

# --- Paths ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIRS = {
    "cancer": {
        "anadata": os.path.join(BASE_DIR, "Cancer - Data", "Cancer_Anadata"),
        "lab": os.path.join(BASE_DIR, "Cancer - Data", "Cancer_Lab"),
        "recete": os.path.join(BASE_DIR, "Cancer - Data", "Cancer_Recete"),
    },
    "checkup": {
        "anadata": os.path.join(BASE_DIR, "Check-Up - Data", "Check_Up_Anadata"),
        "lab": os.path.join(BASE_DIR, "Check-Up - Data", "Check_Up_Lab"),
        "recete": os.path.join(BASE_DIR, "Check-Up - Data", "Check_Up_Recete"),
    },
    "ex": {
        "anadata": os.path.join(BASE_DIR, "Ex - Data", "Ex_Anadata"),
        "lab": os.path.join(BASE_DIR, "Ex - Data", "Ex_Lab"),
        "recete": os.path.join(BASE_DIR, "Ex - Data", "Ex_Recete"),
    },
}

OUTPUT_DIR = os.path.join(BASE_DIR, "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# --- OpenAI ---
OPENAI_MODEL = "gpt-4o-mini"
OPENAI_TEMPERATURE = 0.2
OPENAI_MAX_TOKENS = 4096

# --- Pipeline ---
MAX_RED_TEAM_ITERATIONS = 3
RED_TEAM_THRESHOLDS = [4, 6]  # 1. iterasyon >= 4, 2. iterasyon >= 6
CONSULTATION_ROUNDS = 2

# --- 10 Uzman Sistemleri ---
SPECIALIST_SYSTEMS = [
    "kardiyovaskuler",
    "metabolik_endokrin",
    "solunum",
    "kas_iskelet",
    "renal_hepatik",
    "hematolojik_immun",
    "onkolojik",
    "norolojik_psikiyatrik",
    "gastrointestinal",
    "ureme_jinekolojik",
]

SPECIALIST_LABELS = {
    "kardiyovaskuler": "Kardiyovaskuler",
    "metabolik_endokrin": "Metabolik/Endokrin",
    "solunum": "Solunum",
    "kas_iskelet": "Kas-Iskelet",
    "renal_hepatik": "Renal/Hepatik",
    "hematolojik_immun": "Hematolojik/Immun",
    "onkolojik": "Onkolojik",
    "norolojik_psikiyatrik": "Norolojik/Psikiyatrik",
    "gastrointestinal": "Gastrointestinal",
    "ureme_jinekolojik": "Ureme/Jinekolojik",
}
