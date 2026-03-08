"""
Dask tabanli buyuk veri yukleme modulu.
Tum CSV dosyalarini birlestirip HASTA_ID bazli sorgulama saglar.
"""
import glob
import dask.dataframe as dd
import pandas as pd
from config import DATA_DIRS


# --- Anadata sutun harmonizasyonu ---
# Check-Up Anadata'da fazladan RF_EPISODE2 ve farkli sutun sirasi var.
# Cancer ve Ex ayni formatta. Hepsini ortak schemaya cekiyoruz.

ANADATA_COMMON_COLS = [
    "HASTA_ID", "SQ_EPISODE", "EPISODE_TARIH", "TOPLAM_GELIS_SAYISI",
    "GELIS_SAYISI", "ILK_TANI_SON_TANI_GUN_FARKI", "TANI_YASI", "CINSIYET",
    "TANITARIH", "MIN_TANI_TARIH", "MAX_TANI_TARIH", "TANIKODU", "TANI_TIPI",
    "GELIS_TIPI", "SERVISADI", "TUM_EPS_TANILAR", "YAKINMA", "OYKU",
    "YAKINMA_BASLANGIC_ZAMANI", "Dusme Riski", "Agrisi var mi", "Agri skoru",
    "Siklik", "Yer", "Nitelik", "Muayene Notu", "Kontrol Notu", "Tedavi Notu",
    "Ozgecmis Notu", "Sigara", "Alkol", "Madde", "Alerji", "ilac Alerjisi",
    "Hipertansiyon Hastada", "Kalp Damar Hastada", "Diyabet Hastada",
    "Kan Hastaliklari Hastada", "Kronik Hastaliklar Diger", "Ameliyat Gecmisi",
    "Yaralanma Gecmisi", "Surekli Kullandigi Ilaclar", "Kan Grubu",
    "Engellilik", "Anne KH", "Baba KH", "Erkek Kardes KH", "Kiz Kardes KH",
    "Soygecmis Notu", "Meslek", "Sosyal Durum", "Boy", "Kilo", "BMI",
    "SPO2", "Nabiz", "Ritmik/ Aritmik", "KB-S", "KB-D",
]

LAB_COLS = ["HASTA_ID", "SUB_CODE", "RESULT", "UNIT", "REFMIN", "REFMAX", "REP_DATE"]
RECETE_COLS = ["HASTA_ID", "RECETE_TARIH", "Ilac Adi", "Siklik X Doz", "VERILIS_YOLU", "Gun"]


def _load_csv_folder(folder_path: str, pattern: str = "*.csv") -> dd.DataFrame | None:
    """Bir klasordeki tum CSV dosyalarini Dask DataFrame olarak yukler."""
    files = sorted(glob.glob(f"{folder_path}/{pattern}"))
    # macOS ._* dosyalarini filtrele
    files = [f for f in files if not f.split("/")[-1].startswith("._")]
    if not files:
        return None
    return dd.read_csv(
        files, dtype=str, on_bad_lines="skip", encoding="utf-8",
        engine="python",  # C engine EOF-inside-string hatasini handle edemiyor
    )


def load_all_anadata() -> dd.DataFrame:
    """Tum Anadata CSV'lerini yukleyip birlestirir."""
    frames = []
    for source, paths in DATA_DIRS.items():
        df = _load_csv_folder(paths["anadata"])
        if df is not None:
            df = df.assign(KAYNAK=source)
            frames.append(df)
    if not frames:
        raise FileNotFoundError("Hicbir Anadata dosyasi bulunamadi.")
    return dd.concat(frames, interleave_partitions=True)


def load_all_lab() -> dd.DataFrame:
    """Tum Lab CSV'lerini yukleyip birlestirir."""
    frames = []
    for source, paths in DATA_DIRS.items():
        df = _load_csv_folder(paths["lab"])
        if df is not None:
            df = df.assign(KAYNAK=source)
            frames.append(df)
    if not frames:
        raise FileNotFoundError("Hicbir Lab dosyasi bulunamadi.")
    return dd.concat(frames, interleave_partitions=True)


def load_all_recete() -> dd.DataFrame:
    """Tum Recete CSV'lerini yukleyip birlestirir."""
    frames = []
    for source, paths in DATA_DIRS.items():
        df = _load_csv_folder(paths["recete"])
        if df is not None:
            df = df.assign(KAYNAK=source)
            frames.append(df)
    if not frames:
        raise FileNotFoundError("Hicbir Recete dosyasi bulunamadi.")
    return dd.concat(frames, interleave_partitions=True)


def get_all_patient_ids() -> list[str]:
    """Tum tablolardaki benzersiz HASTA_ID listesini dondurur."""
    ids = set()
    for loader in [load_all_anadata, load_all_lab, load_all_recete]:
        df = loader()
        patient_ids = df["HASTA_ID"].drop_duplicates().compute().tolist()
        ids.update(patient_ids)
    return sorted(ids)


def get_patient_data(hasta_id: str,
                     anadata_ddf: dd.DataFrame,
                     lab_ddf: dd.DataFrame,
                     recete_ddf: dd.DataFrame) -> dict[str, pd.DataFrame]:
    """
    Tek bir hasta icin tum Anadata, Lab ve Recete verilerini Pandas DataFrame olarak dondurur.
    """
    anadata = anadata_ddf[anadata_ddf["HASTA_ID"] == hasta_id].compute()
    lab = lab_ddf[lab_ddf["HASTA_ID"] == hasta_id].compute()
    recete = recete_ddf[recete_ddf["HASTA_ID"] == hasta_id].compute()
    return {
        "anadata": anadata,
        "lab": lab,
        "recete": recete,
    }
