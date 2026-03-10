"""
Hasta verilerini LLM pipeline'i icin optimize edilmis sekilde paketleyen modul.
Demografik, ziyaret, lab, recete verilerini yapilandirilmis formata donusturur.
Token tasarrufu icin deduplikasyon, gruplama ve anormallik isaretleme yapar.
"""
import glob
import os
from datetime import datetime

import dask.dataframe as dd
import pandas as pd

from config import DATA_DIRS

# ---------------------------------------------------------------------------
# Referans tarih: tum tarihler bu tarihe gore goreli gune donusturulur
# Ornek: 2025-12-30 -> "-2", 2025-12-29 -> "-3", 2026-01-02 -> "+2"
# ---------------------------------------------------------------------------
REFERANS_TARIH = datetime(2026, 1, 1)


def _date_to_relative(date_str: str | None) -> str | None:
    """Tarih stringini referans tarihe gore goreli gun sayisina cevirir."""
    if not date_str or date_str == "nan":
        return None
    try:
        dt = datetime.strptime(date_str[:10], "%Y-%m-%d")
        delta = (dt - REFERANS_TARIH).days
        if delta == 0:
            return "0"
        return f"{delta:+d}" if delta > 0 else str(delta)
    except (ValueError, TypeError):
        return None

# ---------------------------------------------------------------------------
# Sutun isimleri harmonizasyonu (Turkce karakterler -> ASCII)
# ---------------------------------------------------------------------------
COL_RENAME = {
    "ÖYKÜ": "OYKU",
    "Düşme Riski": "DUSME_RISKI",
    "Ağrısı var mı": "AGRISI_VAR_MI",
    "Ağrı skoru": "AGRI_SKORU",
    "Sıklık": "SIKLIK",
    "Yer": "YER",
    "Nitelik": "NITELIK",
    "Muayene Notu": "MUAYENE_NOTU",
    "Kontrol Notu": "KONTROL_NOTU",
    "Tedavi Notu": "TEDAVI_NOTU",
    "Özgeçmiş Notu": "OZGECMIS_NOTU",
    "Sigara": "SIGARA",
    "Alkol": "ALKOL",
    "Madde": "MADDE",
    "Alerji": "ALERJI",
    "ilaç Alerjisi": "ILAC_ALERJISI",
    "Hipertansiyon Hastada": "HIPERTANSIYON",
    "Kalp Damar Hastada": "KALP_DAMAR",
    "Diyabet Hastada": "DIYABET",
    "Kan Hastalıkları Hastada": "KAN_HASTALIKLARI",
    "Kronik Hastalıklar Diğer": "KRONIK_DIGER",
    "Ameliyat Geçmişi": "AMELIYAT_GECMISI",
    "Yaralanma Geçmişi": "YARALANMA_GECMISI",
    "Sürekli Kullandığı İlaçlar": "SUREKLI_ILACLAR",
    "Kan Grubu": "KAN_GRUBU",
    "Engellilik": "ENGELLILIK",
    "Anne KH": "ANNE_KH",
    "Baba KH": "BABA_KH",
    "Erkek Kardeş KH": "ERKEK_KARDES_KH",
    "Kız Kardeş KH": "KIZ_KARDES_KH",
    "Soygeçmiş Notu": "SOYGECMIS_NOTU",
    "Meslek": "MESLEK",
    "Sosyal Durum": "SOSYAL_DURUM",
    "Boy": "BOY",
    "Kilo": "KILO",
    "BMI": "BMI",
    "SPO2": "SPO2",
    "Nabız": "NABIZ",
    "Ritmik/ Aritmik": "RITMIK_ARITMIK",
    "KB-S": "KB_S",
    "KB-D": "KB_D",
    "İlaç Adı": "ILAC_ADI",
    "Sıklık X Doz": "SIKLIK_DOZ",
    "VERİLİS_YOLU": "VERILIS_YOLU",
    "Gün": "GUN",
    # Check-Up anadata extras
    "BASLANGIC_ZAMANI": "BASLANGIC_ZAMANI",
    "RF_EPISODE2": "RF_EPISODE2",
    "YAKINMA": "YAKINMA",
}

# Demografik / ozgecmis: satir bazinda degismeyen (veya en son deger alinacak) sutunlar
DEMOGRAFIK_COLS = [
    "TANI_YASI", "CINSIYET", "BOY", "KILO", "BMI", "KAN_GRUBU",
    "MESLEK", "SOSYAL_DURUM",
]
OZGECMIS_FLAG_COLS = [
    "SIGARA", "ALKOL", "MADDE", "ALERJI", "ILAC_ALERJISI",
    "HIPERTANSIYON", "KALP_DAMAR", "DIYABET", "KAN_HASTALIKLARI",
    "KRONIK_DIGER", "AMELIYAT_GECMISI", "YARALANMA_GECMISI",
    "SUREKLI_ILACLAR", "ENGELLILIK",
]
AILE_COLS = ["ANNE_KH", "BABA_KH", "ERKEK_KARDES_KH", "KIZ_KARDES_KH"]
VITAL_COLS = ["SPO2", "NABIZ", "RITMIK_ARITMIK", "KB_S", "KB_D"]
SERBEST_METIN_COLS = [
    "YAKINMA", "OYKU", "MUAYENE_NOTU", "KONTROL_NOTU",
    "TEDAVI_NOTU", "OZGECMIS_NOTU", "SOYGECMIS_NOTU",
]

# ---------------------------------------------------------------------------
# CSV yukleme
# ---------------------------------------------------------------------------

def _load_csv_folder(folder_path: str) -> pd.DataFrame | None:
    files = sorted(glob.glob(os.path.join(folder_path, "*.csv")))
    files = [f for f in files if not os.path.basename(f).startswith("._")]
    if not files:
        return None
    try:
        ddf = dd.read_csv(
            files,
            dtype=str,
            on_bad_lines="skip",
            encoding="utf-8",
            engine="python",
        )
        return ddf.compute()
    except Exception:
        return None


def _harmonize_anadata(df: pd.DataFrame) -> pd.DataFrame:
    """Sutun isimlerini normalize et, fazla sutunlari at."""
    df = df.rename(columns=COL_RENAME)
    # RF_EPISODE2 sadece Check-Up'ta var, gerekli degil
    if "RF_EPISODE2" in df.columns:
        df = df.drop(columns=["RF_EPISODE2"], errors="ignore")
    return df


def _harmonize_recete(df: pd.DataFrame) -> pd.DataFrame:
    df = df.rename(columns=COL_RENAME)
    return df


def load_all_data() -> dict[str, pd.DataFrame]:
    """Tum kaynaklardan veriyi yukler, harmonize eder."""
    anadata_frames, lab_frames, recete_frames = [], [], []
    for source, paths in DATA_DIRS.items():
        ana = _load_csv_folder(paths["anadata"])
        if ana is not None:
            ana = _harmonize_anadata(ana)
            ana["KAYNAK"] = source
            anadata_frames.append(ana)

        lab = _load_csv_folder(paths["lab"])
        if lab is not None:
            lab = lab.rename(columns=COL_RENAME)
            lab["KAYNAK"] = source
            lab_frames.append(lab)

        rec = _load_csv_folder(paths["recete"])
        if rec is not None:
            rec = _harmonize_recete(rec)
            rec["KAYNAK"] = source
            recete_frames.append(rec)

    return {
        "anadata": pd.concat(anadata_frames, ignore_index=True) if anadata_frames else pd.DataFrame(),
        "lab": pd.concat(lab_frames, ignore_index=True) if lab_frames else pd.DataFrame(),
        "recete": pd.concat(recete_frames, ignore_index=True) if recete_frames else pd.DataFrame(),
    }


def get_all_patient_ids(all_data: dict[str, pd.DataFrame]) -> list[str]:
    ids = set()
    for df in all_data.values():
        if not df.empty and "HASTA_ID" in df.columns:
            ids.update(df["HASTA_ID"].dropna().unique())
    return sorted(ids)


def get_patient_raw(hasta_id: str, all_data: dict[str, pd.DataFrame]) -> dict[str, pd.DataFrame]:
    result = {}
    for key, df in all_data.items():
        if not df.empty and "HASTA_ID" in df.columns:
            result[key] = df[df["HASTA_ID"] == hasta_id].copy()
        else:
            result[key] = pd.DataFrame()
    return result


# ---------------------------------------------------------------------------
# Paketleme: demografik bilgiler
# ---------------------------------------------------------------------------

def _val(series: pd.Series) -> str | None:
    """Bir serideki ilk bos olmayan degeri dondurur."""
    for v in series:
        if pd.notna(v) and str(v).strip() not in ("", "nan", "None"):
            return str(v).strip()
    return None


def _extract_demografik(anadata: pd.DataFrame) -> dict:
    info = {}
    for col in DEMOGRAFIK_COLS:
        if col in anadata.columns:
            info[col] = _val(anadata[col])
    return {k: v for k, v in info.items() if v is not None}


def _extract_ozgecmis_flags(anadata: pd.DataFrame) -> dict:
    flags = {}
    for col in OZGECMIS_FLAG_COLS:
        if col in anadata.columns:
            v = _val(anadata[col])
            if v is not None:
                flags[col] = v
    return flags


def _extract_aile(anadata: pd.DataFrame) -> dict:
    aile = {}
    for col in AILE_COLS:
        if col in anadata.columns:
            v = _val(anadata[col])
            if v is not None:
                aile[col] = v
    return aile


def _extract_serbest_metinler(anadata: pd.DataFrame) -> dict:
    """Ozgecmis/soygecmis notlari: tekrarsiz, bos olmayan degerler."""
    texts = {}
    for col in ["OZGECMIS_NOTU", "SOYGECMIS_NOTU"]:
        if col in anadata.columns:
            unique_vals = anadata[col].dropna().unique()
            unique_vals = [str(v).strip() for v in unique_vals if str(v).strip() not in ("", "nan")]
            if unique_vals:
                texts[col] = unique_vals[0]  # Genelde ayni metin tekrar eder
    return texts


# ---------------------------------------------------------------------------
# Paketleme: ziyaretler (episode bazli gruplama)
# ---------------------------------------------------------------------------

def _extract_ziyaretler(anadata: pd.DataFrame) -> list[dict]:
    if anadata.empty:
        return []

    # Episode bazli gruplama
    group_col = "SQ_EPISODE"
    if group_col not in anadata.columns:
        return []

    ziyaretler = []
    for episode_id, grp in anadata.groupby(group_col, sort=False):
        tarih_raw = _val(grp["EPISODE_TARIH"]) if "EPISODE_TARIH" in grp.columns else None
        tarih = _date_to_relative(tarih_raw)
        servis = _val(grp["SERVISADI"]) if "SERVISADI" in grp.columns else None
        gelis_tipi = _val(grp["GELIS_TIPI"]) if "GELIS_TIPI" in grp.columns else None

        # Tanilar: bu episode'daki unique ICD-10 kodlari
        tanilar = []
        if "TANIKODU" in grp.columns:
            for _, row in grp.iterrows():
                kod = str(row.get("TANIKODU", "")).strip()
                tip = str(row.get("TANI_TIPI", "")).strip()
                if kod and kod != "nan":
                    entry = kod
                    if tip and tip != "nan":
                        entry += f" ({tip})"
                    if entry not in tanilar:
                        tanilar.append(entry)

        # Klinik notlar: bu episode'a ozel
        notlar = {}
        for col in ["YAKINMA", "OYKU", "MUAYENE_NOTU", "KONTROL_NOTU", "TEDAVI_NOTU"]:
            if col in grp.columns:
                vals = grp[col].dropna().unique()
                vals = [str(v).strip() for v in vals if str(v).strip() not in ("", "nan")]
                if vals:
                    notlar[col] = vals[0]

        # Agri
        agri = {}
        if "AGRISI_VAR_MI" in grp.columns:
            v = _val(grp["AGRISI_VAR_MI"])
            if v:
                agri["var_mi"] = v
        if "AGRI_SKORU" in grp.columns:
            v = _val(grp["AGRI_SKORU"])
            if v and v != "0.0" and v != "0":
                agri["skor"] = v

        # Vitaller
        vitaller = {}
        for col in VITAL_COLS:
            if col in grp.columns:
                v = _val(grp[col])
                if v is not None:
                    vitaller[col] = v

        ziyaret = {"episode": str(episode_id), "tarih": tarih}
        if servis:
            ziyaret["servis"] = servis
        if gelis_tipi:
            ziyaret["gelis_tipi"] = gelis_tipi
        if tanilar:
            ziyaret["tanilar"] = tanilar
        if notlar:
            ziyaret["notlar"] = notlar
        if agri:
            ziyaret["agri"] = agri
        if vitaller:
            ziyaret["vitaller"] = vitaller

        ziyaretler.append(ziyaret)

    # Tarihe gore sirala (goreli gun sayisina gore)
    def _parse_tarih(z):
        t = z.get("tarih")
        if not t:
            return float("-inf")
        try:
            return int(t)
        except (ValueError, TypeError):
            return float("-inf")

    ziyaretler.sort(key=_parse_tarih)
    return ziyaretler


# ---------------------------------------------------------------------------
# Paketleme: tum tanilar (TUM_EPS_TANILAR'dan unique ICD-10 listesi)
# ---------------------------------------------------------------------------

def _extract_tum_tanilar(anadata: pd.DataFrame) -> list[str]:
    if anadata.empty or "TUM_EPS_TANILAR" not in anadata.columns:
        return []
    all_codes = set()
    for val in anadata["TUM_EPS_TANILAR"].dropna().unique():
        codes = [c.strip() for c in str(val).split(",") if c.strip() and c.strip() != "nan"]
        all_codes.update(codes)
    return sorted(all_codes)


# ---------------------------------------------------------------------------
# Paketleme: lab sonuclari (test bazli kronolojik + anormallik isaretleme)
# ---------------------------------------------------------------------------

def _parse_ref(ref_str: str) -> float | None:
    if not ref_str or ref_str == "nan":
        return None
    cleaned = ref_str.strip().replace(">", "").replace("<", "").replace(",", ".").strip()
    try:
        return float(cleaned)
    except (ValueError, TypeError):
        return None


def _is_abnormal(result_str: str, ref_min_str: str, ref_max_str: str) -> str | None:
    """Sonucun referans disinda olup olmadigini kontrol eder."""
    if not result_str or result_str == "nan":
        return None

    # Pozitif/Negatif sonuclar icin
    result_upper = result_str.strip().upper()
    if "POZİTİF" in result_upper or "POZITIF" in result_upper:
        return "POZITIF"
    if "REAKTİF" in result_upper or "REAKTIF" in result_upper:
        return "REAKTIF"

    # Numerik sonuclar
    cleaned = result_str.strip().replace(",", ".").replace(">", "").replace("<", "")
    try:
        val = float(cleaned)
    except (ValueError, TypeError):
        return None

    ref_min = _parse_ref(ref_min_str)
    ref_max = _parse_ref(ref_max_str)

    if ref_max is not None and val > ref_max:
        return "YUKSEK"
    if ref_min is not None and val < ref_min:
        return "DUSUK"
    return None


def _extract_lab(lab: pd.DataFrame) -> dict:
    """Lab sonuclarini test bazli gruplar, kronolojik siralar, anormalleri isaretler."""
    if lab.empty:
        return {"testler": {}, "anormal_sayisi": 0, "normal_ozet": []}

    testler = {}
    anormal_count = 0
    normal_tests = set()

    for _, row in lab.iterrows():
        test_name = str(row.get("SUB_CODE", "")).strip()
        if not test_name or test_name == "nan":
            continue

        result = str(row.get("RESULT", "")).strip()
        unit = str(row.get("UNIT", "")).strip()
        ref_min = str(row.get("REFMIN", "")).strip()
        ref_max = str(row.get("REFMAX", "")).strip()
        rep_date_raw = str(row.get("REP_DATE", "")).strip()
        rep_date = _date_to_relative(rep_date_raw)

        abnormal = _is_abnormal(result, ref_min, ref_max)

        entry = {"gun": rep_date, "sonuc": result}
        if unit and unit != "nan":
            entry["birim"] = unit
        if ref_min and ref_min != "nan":
            entry["ref_min"] = ref_min
        if ref_max and ref_max != "nan":
            entry["ref_max"] = ref_max
        if abnormal:
            entry["durum"] = abnormal
            anormal_count += 1
        else:
            normal_tests.add(test_name)

        if test_name not in testler:
            testler[test_name] = []
        testler[test_name].append(entry)

    # Her test icinde gun sirasina gore sirala
    for test_name in testler:
        testler[test_name].sort(key=lambda x: int(x["gun"]) if x.get("gun") else float("-inf"))

    # Hep normal testleri ayir
    sadece_normal = []
    anormal_testler = {}
    for test_name, olcumler in testler.items():
        has_abnormal = any(o.get("durum") for o in olcumler)
        if has_abnormal:
            anormal_testler[test_name] = olcumler
        else:
            sadece_normal.append(test_name)

    return {
        "anormal_testler": anormal_testler,
        "anormal_sayisi": anormal_count,
        "normal_testler": sadece_normal,
        "tum_test_sayisi": len(testler),
    }


# ---------------------------------------------------------------------------
# Paketleme: receteler (tarih sirali, aktif/gecmis ayrimi)
# ---------------------------------------------------------------------------

def _extract_receteler(recete: pd.DataFrame) -> dict:
    if recete.empty:
        return {"aktif": [], "gecmis": [], "toplam": 0}

    ilaclar = []
    for _, row in recete.iterrows():
        ilac_adi = str(row.get("ILAC_ADI", "")).strip()
        if not ilac_adi or ilac_adi == "nan":
            ilac_adi = str(row.get("İlaç Adı", "")).strip()
        if not ilac_adi or ilac_adi == "nan":
            continue

        tarih_str = str(row.get("RECETE_TARIH", "")).strip()
        siklik = str(row.get("SIKLIK_DOZ", "")).strip()
        if siklik == "nan":
            siklik = str(row.get("Sıklık X Doz", "")).strip()
        yol = str(row.get("VERILIS_YOLU", "")).strip()
        if yol == "nan":
            yol = str(row.get("VERİLİS_YOLU", "")).strip()
        gun = str(row.get("GUN", "")).strip()
        if gun == "nan":
            gun = str(row.get("Gün", "")).strip()

        entry = {"ilac": ilac_adi}
        tarih_rel = _date_to_relative(tarih_str)
        if tarih_rel is not None:
            entry["gun"] = tarih_rel
        if siklik and siklik != "nan":
            entry["doz"] = siklik
        if yol and yol != "nan":
            entry["yol"] = yol
        if gun and gun != "nan":
            entry["gun"] = gun

        ilaclar.append(entry)

    # Gun sirasina gore sirala (en yakin gun once)
    ilaclar.sort(key=lambda x: int(x["gun"]) if x.get("gun") else float("-inf"), reverse=True)

    # Aktif (son 180 gun) / gecmis ayrimi
    aktif, gecmis = [], []
    for ilac in ilaclar:
        gun_str = ilac.get("gun")
        try:
            gun = int(gun_str)
            if gun >= -180:
                aktif.append(ilac)
            else:
                gecmis.append(ilac)
        except (ValueError, TypeError):
            gecmis.append(ilac)

    return {
        "aktif": aktif,
        "gecmis": gecmis,
        "toplam": len(ilaclar),
    }


# ---------------------------------------------------------------------------
# Ziyaret istatistikleri
# ---------------------------------------------------------------------------

def _extract_ziyaret_istatistik(anadata: pd.DataFrame) -> dict:
    if anadata.empty:
        return {}

    stats = {}
    if "TOPLAM_GELIS_SAYISI" in anadata.columns:
        v = _val(anadata["TOPLAM_GELIS_SAYISI"])
        if v:
            stats["toplam_gelis"] = v

    if "GELIS_SAYISI" in anadata.columns:
        v = _val(anadata["GELIS_SAYISI"])
        if v:
            stats["kaynak_gelis"] = v

    if "MIN_TANI_TARIH" in anadata.columns:
        v = _val(anadata["MIN_TANI_TARIH"])
        if v:
            stats["ilk_tani_gun"] = _date_to_relative(v)

    if "MAX_TANI_TARIH" in anadata.columns:
        v = _val(anadata["MAX_TANI_TARIH"])
        if v:
            stats["son_tani_gun"] = _date_to_relative(v)

    if "ILK_TANI_SON_TANI_GUN_FARKI" in anadata.columns:
        v = _val(anadata["ILK_TANI_SON_TANI_GUN_FARKI"])
        if v:
            stats["takip_suresi_gun"] = v

    # Gelis tipi dagilimi
    if "GELIS_TIPI" in anadata.columns:
        episode_gelis = anadata.drop_duplicates(subset=["SQ_EPISODE"])[["GELIS_TIPI"]].dropna()
        if not episode_gelis.empty:
            dagilim = episode_gelis["GELIS_TIPI"].value_counts().to_dict()
            stats["gelis_tipi_dagilim"] = dagilim

    return stats


# ---------------------------------------------------------------------------
# Ana paketleme fonksiyonu
# ---------------------------------------------------------------------------

def package_patient_for_llm(hasta_id: str, all_data: dict[str, pd.DataFrame]) -> dict:
    """
    Bir hasta icin tum verileri LLM'e optimize edilmis yapilandirilmis pakete donusturur.
    """
    raw = get_patient_raw(hasta_id, all_data)
    anadata = raw["anadata"]
    lab = raw["lab"]
    recete = raw["recete"]

    packet = {
        "hasta_id": hasta_id,
        "tarih_aciklama": "Tarihler 1 Ocak 2026 referans alinarak goreli gun olarak verilmistir. "
                          "Ornek: -2 = 2 gun once (30 Aralik 2025), -365 = 1 yil once, 0 = 1 Ocak 2026.",
    }

    # 1. Demografik
    packet["demografik"] = _extract_demografik(anadata)

    # 2. Ozgecmis flags
    packet["ozgecmis"] = _extract_ozgecmis_flags(anadata)

    # 3. Aile hikayesi
    aile = _extract_aile(anadata)
    if aile:
        packet["aile_hikayesi"] = aile

    # 4. Serbest metin notlar (ozgecmis/soygecmis)
    metinler = _extract_serbest_metinler(anadata)
    if metinler:
        packet["notlar"] = metinler

    # 5. Ziyaret istatistikleri
    stats = _extract_ziyaret_istatistik(anadata)
    if stats:
        packet["ziyaret_istatistik"] = stats

    # 6. Ziyaretler (episode bazli kronolojik)
    packet["ziyaretler"] = _extract_ziyaretler(anadata)

    # 7. Tum ICD-10 kodlari (unique, sorted)
    tum_tanilar = _extract_tum_tanilar(anadata)
    if tum_tanilar:
        packet["tum_icd10_kodlari"] = tum_tanilar

    # 8. Lab sonuclari
    packet["lab"] = _extract_lab(lab)

    # 9. Receteler
    packet["receteler"] = _extract_receteler(recete)

    # 10. Kaynak bilgisi
    kaynaklar = set()
    for df in raw.values():
        if not df.empty and "KAYNAK" in df.columns:
            kaynaklar.update(df["KAYNAK"].dropna().unique())
    if kaynaklar:
        packet["veri_kaynaklari"] = sorted(kaynaklar)

    return packet


def format_packet_as_text(packet: dict) -> str:
    """
    Yapilandirilmis paketi LLM icin okunabilir metin formatina donusturur.
    JSON yerine daha az token kullanan yapilandirilmis metin.
    """
    lines = []

    # -- Tarih aciklamasi --
    if packet.get("tarih_aciklama"):
        lines.append(f"NOT: {packet['tarih_aciklama']}")
        lines.append("")

    # -- Demografik --
    lines.append("## HASTA BILGILERI")
    demo = packet.get("demografik", {})
    parts = []
    if demo.get("TANI_YASI"):
        parts.append(f"Yas: {demo['TANI_YASI']}")
    if demo.get("CINSIYET"):
        parts.append(f"Cinsiyet: {demo['CINSIYET']}")
    if demo.get("BOY"):
        parts.append(f"Boy: {demo['BOY']}")
    if demo.get("KILO"):
        parts.append(f"Kilo: {demo['KILO']}")
    if demo.get("BMI"):
        parts.append(f"BMI: {demo['BMI']}")
    if demo.get("KAN_GRUBU"):
        parts.append(f"Kan Grubu: {demo['KAN_GRUBU']}")
    if demo.get("MESLEK"):
        parts.append(f"Meslek: {demo['MESLEK']}")
    lines.append(" | ".join(parts) if parts else "Demografik veri yok")

    # -- Ozgecmis --
    ozg = packet.get("ozgecmis", {})
    if ozg:
        lines.append("\n## OZGECMIS")
        for k, v in ozg.items():
            lines.append(f"- {k}: {v}")

    # -- Aile --
    aile = packet.get("aile_hikayesi", {})
    if aile:
        lines.append("\n## AILE HIKAYESI")
        for k, v in aile.items():
            lines.append(f"- {k}: {v}")

    # -- Notlar --
    notlar = packet.get("notlar", {})
    if notlar:
        lines.append("\n## KLINIK NOTLAR")
        for k, v in notlar.items():
            lines.append(f"### {k}")
            lines.append(v)

    # -- Ziyaret istatistik --
    stats = packet.get("ziyaret_istatistik", {})
    if stats:
        lines.append("\n## ZIYARET ISTATISTIKLERI")
        if stats.get("toplam_gelis"):
            lines.append(f"Toplam gelis: {stats['toplam_gelis']}")
        if stats.get("ilk_tani_gun"):
            lines.append(f"Ilk tani: gun {stats['ilk_tani_gun']}")
        if stats.get("son_tani_gun"):
            lines.append(f"Son tani: gun {stats['son_tani_gun']}")
        if stats.get("takip_suresi_gun"):
            lines.append(f"Takip suresi: {stats['takip_suresi_gun']} gun")
        dagilim = stats.get("gelis_tipi_dagilim")
        if dagilim:
            lines.append("Gelis tipi dagilimi:")
            for tip, sayi in dagilim.items():
                lines.append(f"  - {tip}: {sayi}")

    # -- Ziyaretler --
    ziyaretler = packet.get("ziyaretler", [])
    if ziyaretler:
        lines.append(f"\n## ZIYARETLER ({len(ziyaretler)} episode)")
        for z in ziyaretler:
            header = f"### [gun {z.get('tarih', '?')}] {z.get('servis', '?')} | {z.get('gelis_tipi', '?')}"
            lines.append(header)

            if z.get("tanilar"):
                lines.append(f"  Tanilar: {', '.join(z['tanilar'])}")

            if z.get("vitaller"):
                vparts = [f"{k}:{v}" for k, v in z["vitaller"].items()]
                lines.append(f"  Vitaller: {' | '.join(vparts)}")

            if z.get("agri"):
                apart = [f"{k}:{v}" for k, v in z["agri"].items()]
                lines.append(f"  Agri: {' | '.join(apart)}")

            notlar = z.get("notlar", {})
            for nk, nv in notlar.items():
                # Uzun notlari kisalt
                text = nv if len(nv) <= 300 else nv[:300] + "..."
                lines.append(f"  {nk}: {text}")

    # -- Tum ICD-10 --
    icd = packet.get("tum_icd10_kodlari", [])
    if icd:
        lines.append(f"\n## TUM ICD-10 KODLARI ({len(icd)} unique)")
        lines.append(", ".join(icd))

    # -- Lab --
    lab = packet.get("lab", {})
    if lab.get("tum_test_sayisi", 0) > 0:
        lines.append(f"\n## LAB SONUCLARI ({lab['tum_test_sayisi']} test, {lab['anormal_sayisi']} anormal)")

        anormal = lab.get("anormal_testler", {})
        if anormal:
            lines.append("### ANORMAL TESTLER")
            for test_name, olcumler in anormal.items():
                lines.append(f"  {test_name}:")
                for o in olcumler:
                    ref = ""
                    if o.get("ref_min") or o.get("ref_max"):
                        ref = f" [{o.get('ref_min', '')}-{o.get('ref_max', '')}]"
                    durum = f" **{o['durum']}**" if o.get("durum") else ""
                    birim = f" {o['birim']}" if o.get("birim") else ""
                    lines.append(f"    gun {o.get('gun', '?')}: {o['sonuc']}{birim}{ref}{durum}")

        normal = lab.get("normal_testler", [])
        if normal:
            lines.append(f"### NORMAL TESTLER ({len(normal)})")
            lines.append(", ".join(normal))

    # -- Receteler --
    rec = packet.get("receteler", {})
    if rec.get("toplam", 0) > 0:
        lines.append(f"\n## RECETELER ({rec['toplam']} toplam)")

        aktif = rec.get("aktif", [])
        if aktif:
            lines.append(f"### AKTIF ILACLAR (son 6 ay, {len(aktif)} ilac)")
            for ilac in aktif:
                parts = [ilac["ilac"]]
                if ilac.get("doz"):
                    parts.append(ilac["doz"])
                if ilac.get("yol"):
                    parts.append(ilac["yol"])
                if ilac.get("gun"):
                    parts.append(f"gun {ilac['gun']}")
                lines.append(f"  - {' | '.join(parts)}")

        gecmis = rec.get("gecmis", [])
        if gecmis:
            lines.append(f"### GECMIS ILACLAR ({len(gecmis)} ilac)")
            for ilac in gecmis[:50]:  # Cok uzun listeleri kisalt
                parts = [ilac["ilac"]]
                if ilac.get("doz"):
                    parts.append(ilac["doz"])
                if ilac.get("gun"):
                    parts.append(f"gun {ilac['gun']}")
                lines.append(f"  - {' | '.join(parts)}")
            if len(gecmis) > 50:
                lines.append(f"  ... ve {len(gecmis) - 50} ilac daha")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Uyumluluk: eski data_loader arayuzu
# ---------------------------------------------------------------------------

def get_patient_data_packaged(hasta_id: str, all_data: dict[str, pd.DataFrame]) -> tuple[dict, str]:
    """
    Hem yapilandirilmis dict hem de metin formatini dondurur.
    Returns: (packet_dict, packet_text)
    """
    packet = package_patient_for_llm(hasta_id, all_data)
    text = format_packet_as_text(packet)
    return packet, text
