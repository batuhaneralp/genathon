"""
Hasta no'ya gore paket hazirlayip txt olarak kaydeden script.
Kullanim: python export_patient.py <HASTA_ID>
"""
import sys
import os

from data_loaderv2 import load_all_data, get_patient_data_packaged
from config import OUTPUT_DIR


def main():
    if len(sys.argv) < 2:
        print("Kullanim: python export_patient.py <HASTA_ID>")
        sys.exit(1)

    hasta_id = sys.argv[1]

    print("Veriler yukleniyor...")
    all_data = load_all_data()

    print(f"Hasta {hasta_id} icin paket hazirlaniyor...")
    packet, text = get_patient_data_packaged(hasta_id, all_data)

    if not packet.get("demografik") and not packet.get("ziyaretler"):
        print(f"UYARI: Hasta {hasta_id} icin veri bulunamadi.")

    output_path = os.path.join(OUTPUT_DIR, f"hasta_{hasta_id}.txt")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(text)

    print(f"Kaydedildi: {output_path}")


if __name__ == "__main__":
    main()
