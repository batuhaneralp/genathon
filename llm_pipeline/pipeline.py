"""
Ana pipeline orkestratoru.
Tum fazlari sirali olarak calistirir ve sonuclari kaydeder.

Kullanim:
    # Tek hasta:
    python pipeline.py --hasta_id ANON_243337

    # Tum hastalar (batch):
    python pipeline.py --all --batch_size 10

    # Ilk N hasta:
    python pipeline.py --first_n 5
"""
import os
import json
import asyncio
import argparse
import logging
from datetime import datetime

import dask.dataframe as dd

from config import OUTPUT_DIR
from data_loader import load_all_anadata, load_all_lab, load_all_recete, get_patient_data
from agents import (
    faz0_veri_hazirlama,
    faz1_uzman_degerlendirme,
    faz2_konsultasyon,
    faz2c_hakem,
    _find_score_conflicts,
    faz3_faz5_dongusu,
    faz4_prognostik,
    faz6_rapor,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(OUTPUT_DIR, "pipeline.log"), encoding="utf-8"),
    ],
)
logger = logging.getLogger(__name__)


def save_result(hasta_id: str, phase: str, data: dict | list):
    """Faz sonucunu JSON olarak kaydeder."""
    patient_dir = os.path.join(OUTPUT_DIR, hasta_id)
    os.makedirs(patient_dir, exist_ok=True)
    filepath = os.path.join(patient_dir, f"{phase}.json")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    logger.info(f"  [{hasta_id}] {phase} kaydedildi -> {filepath}")


async def run_pipeline_for_patient(
    hasta_id: str,
    anadata_ddf: dd.DataFrame,
    lab_ddf: dd.DataFrame,
    recete_ddf: dd.DataFrame,
) -> dict:
    """Tek bir hasta icin tum pipeline'i calistirir."""
    logger.info(f"=== Pipeline basliyor: {hasta_id} ===")
    start_time = datetime.now()

    # --- FAZ 0: Veri Hazirlama ---
    logger.info(f"  [{hasta_id}] FAZ 0: Veri Hazirlama...")
    patient_data = get_patient_data(hasta_id, anadata_ddf, lab_ddf, recete_ddf)

    if patient_data["anadata"].empty and patient_data["lab"].empty and patient_data["recete"].empty:
        logger.warning(f"  [{hasta_id}] Hasta icin hicbir veri bulunamadi, atlaniyor.")
        return {"hasta_id": hasta_id, "hata": "Veri bulunamadi"}

    clinical_packet = await faz0_veri_hazirlama(patient_data)
    clinical_packet["hasta_id"] = hasta_id
    save_result(hasta_id, "faz0_klinik_paket", clinical_packet)

    # --- FAZ 1: 10 Uzman Paralel ---
    logger.info(f"  [{hasta_id}] FAZ 1: 10 Uzman Degerlendirmesi...")
    specialist_assessments = await faz1_uzman_degerlendirme(clinical_packet)
    save_result(hasta_id, "faz1_uzman_degerlendirmeleri", specialist_assessments)

    # --- FAZ 2a: Konsultasyon Tur 1 ---
    logger.info(f"  [{hasta_id}] FAZ 2a: Konsultasyon Tur 1...")
    round1_assessments = await faz2_konsultasyon(specialist_assessments, round_num=1)
    save_result(hasta_id, "faz2a_konsultasyon_tur1", round1_assessments)

    # --- FAZ 2b: Konsultasyon Tur 2 ---
    logger.info(f"  [{hasta_id}] FAZ 2b: Konsultasyon Tur 2...")
    round2_assessments = await faz2_konsultasyon(round1_assessments, round_num=2)
    save_result(hasta_id, "faz2b_konsultasyon_tur2", round2_assessments)

    # --- FAZ 2c: Hakem (kosullu) ---
    logger.info(f"  [{hasta_id}] FAZ 2c: Hakem kontrolu...")
    conflicts = _find_score_conflicts(round1_assessments, round2_assessments)
    arbitrator_decisions = {}
    if conflicts:
        conflict_systems = [c[0] for c in conflicts]
        logger.info(f"  [{hasta_id}] Skor catismasi tespit edildi: {conflict_systems}")
        arbitrator_decisions = await faz2c_hakem(conflicts)
        save_result(hasta_id, "faz2c_hakem_kararlari", arbitrator_decisions)
    else:
        logger.info(f"  [{hasta_id}] Skor catismasi yok, hakem gerekmiyor.")

    # Final uzman raporlari: round2 + hakem kararlari
    final_specialist_reports = round2_assessments.copy()
    for key, decision in arbitrator_decisions.items():
        if key in final_specialist_reports:
            final_specialist_reports[key]["hakem_karari"] = decision
            # Hakem skoru baglayici
            final_specialist_reports[key]["skor"] = decision.get("baglayici_skor",
                                                                  final_specialist_reports[key].get("skor"))

    # --- FAZ 3 + FAZ 5: Bas Hekim + Red Team Dongusu ---
    logger.info(f"  [{hasta_id}] FAZ 3+5: Bas Hekim + Red Team Dongusu...")
    chief_report, red_team_objections = await faz3_faz5_dongusu(
        final_specialist_reports, arbitrator_decisions, clinical_packet
    )
    save_result(hasta_id, "faz3_bas_hekim_final", chief_report)
    save_result(hasta_id, "faz5_red_team_itirazlari", red_team_objections)

    # --- FAZ 4: Prognostik Ajan ---
    logger.info(f"  [{hasta_id}] FAZ 4: Prognostik Analiz...")
    prognostic_report = await faz4_prognostik(chief_report, clinical_packet)
    save_result(hasta_id, "faz4_prognostik", prognostic_report)

    # --- FAZ 6: Rapor Ajani ---
    logger.info(f"  [{hasta_id}] FAZ 6: Final Rapor Olusturma...")
    final_report = await faz6_rapor(
        clinical_packet=clinical_packet,
        chief_report=chief_report,
        specialist_reports=final_specialist_reports,
        arbitrator_decisions=arbitrator_decisions,
        red_team_objections=red_team_objections,
        prognostic_report=prognostic_report,
    )
    save_result(hasta_id, "faz6_final_rapor", final_report)

    elapsed = (datetime.now() - start_time).total_seconds()
    logger.info(f"=== Pipeline tamamlandi: {hasta_id} ({elapsed:.1f}s) ===")

    return final_report


async def run_batch(hasta_ids: list[str], batch_size: int = 5):
    """Birden fazla hastayi batch halinde calistirir."""
    logger.info(f"Toplam {len(hasta_ids)} hasta, batch boyutu: {batch_size}")

    # Dask DataFrame'leri bir kez yukle
    logger.info("Veri setleri yukleniyor (Dask lazy)...")
    anadata_ddf = load_all_anadata()
    lab_ddf = load_all_lab()
    recete_ddf = load_all_recete()
    logger.info("Veri setleri hazir.")

    all_results = {}
    for i in range(0, len(hasta_ids), batch_size):
        batch = hasta_ids[i:i + batch_size]
        logger.info(f"--- Batch {i // batch_size + 1}: {len(batch)} hasta ---")

        tasks = [
            run_pipeline_for_patient(hid, anadata_ddf, lab_ddf, recete_ddf)
            for hid in batch
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for hid, result in zip(batch, results):
            if isinstance(result, Exception):
                logger.error(f"  [{hid}] HATA: {result}")
                all_results[hid] = {"hata": str(result)}
            else:
                all_results[hid] = result

    # Toplu sonuc kaydet
    summary_path = os.path.join(OUTPUT_DIR, "batch_summary.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    logger.info(f"Toplu sonuc kaydedildi: {summary_path}")

    return all_results


def get_sample_patient_ids(anadata_ddf: dd.DataFrame, n: int = 5) -> list[str]:
    """Ornek hasta ID'leri alir."""
    ids = anadata_ddf["HASTA_ID"].drop_duplicates().head(n, npartitions=-1)
    return ids.tolist()


def main():
    parser = argparse.ArgumentParser(description="Klinik Degerlendirme Pipeline")
    parser.add_argument("--hasta_id", type=str, help="Tek hasta ID")
    parser.add_argument("--all", action="store_true", help="Tum hastalari calistir")
    parser.add_argument("--first_n", type=int, default=0, help="Ilk N hastayi calistir")
    parser.add_argument("--batch_size", type=int, default=5, help="Paralel hasta sayisi")
    args = parser.parse_args()

    if args.hasta_id:
        # Tek hasta
        anadata_ddf = load_all_anadata()
        lab_ddf = load_all_lab()
        recete_ddf = load_all_recete()
        result = asyncio.run(
            run_pipeline_for_patient(args.hasta_id, anadata_ddf, lab_ddf, recete_ddf)
        )
        print(json.dumps(result, ensure_ascii=False, indent=2))

    elif args.first_n > 0:
        # Ilk N hasta
        anadata_ddf = load_all_anadata()
        sample_ids = get_sample_patient_ids(anadata_ddf, args.first_n)
        logger.info(f"Ilk {args.first_n} hasta: {sample_ids}")
        asyncio.run(run_batch(sample_ids, args.batch_size))

    elif args.all:
        # Tum hastalar
        from data_loader import get_all_patient_ids
        all_ids = get_all_patient_ids()
        logger.info(f"Toplam {len(all_ids)} hasta bulundu.")
        asyncio.run(run_batch(all_ids, args.batch_size))

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
