"""
Hasta verisi paketleme test scripti.
Kullanim:
    python test_paket.py ANON_169489
    python test_paket.py ANON_000001 ANON_169489
"""
import sys
import os

from data_loaderv2 import load_all_data, get_patient_data_packaged

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output", "paketler")
os.makedirs(OUTPUT_DIR, exist_ok=True)

if len(sys.argv) < 2:
    print("Kullanim: python test_paket.py <HASTA_ID> [HASTA_ID2 ...]")
    sys.exit(1)

hasta_ids = sys.argv[1:]

print("Veri yukleniyor...")
all_data = load_all_data()
print(f"  anadata: {len(all_data['anadata'])} satir")
print(f"  lab: {len(all_data['lab'])} satir")
print(f"  recete: {len(all_data['recete'])} satir")

for hasta_id in hasta_ids:
    print(f"\n--- {hasta_id} ---")
    packet, text = get_patient_data_packaged(hasta_id, all_data)

    ziyaret = len(packet.get("ziyaretler", []))
    lab_test = packet.get("lab", {}).get("tum_test_sayisi", 0)
    anormal = packet.get("lab", {}).get("anormal_sayisi", 0)
    recete = packet.get("receteler", {}).get("toplam", 0)
    print(f"  Ziyaret: {ziyaret} | Lab: {lab_test} ({anormal} anormal) | Recete: {recete}")
    print(f"  Metin: {len(text)} karakter")

    filepath = os.path.join(OUTPUT_DIR, f"{hasta_id}.txt")
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"  Kaydedildi: {filepath}")

print("\nTamamlandi.")
