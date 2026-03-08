"""
Tum faz ajanlari.
FAZ 0 -> FAZ 1 -> FAZ 2a/2b/2c -> FAZ 3 -> FAZ 5 -> FAZ 4 -> FAZ 6
"""
import json
import asyncio
from config import (
    SPECIALIST_SYSTEMS, SPECIALIST_LABELS,
    MAX_RED_TEAM_ITERATIONS, RED_TEAM_THRESHOLDS, CONSULTATION_ROUNDS,
)
from llm_utils import call_llm, call_llm_batch
from prompts import (
    FAZ0_SYSTEM, FAZ0_USER,
    SPECIALIST_SYSTEM, SPECIALIST_USER,
    CONSULTATION_SYSTEM, CONSULTATION_USER,
    ARBITRATOR_SYSTEM, ARBITRATOR_USER,
    CHIEF_PHYSICIAN_SYSTEM, CHIEF_PHYSICIAN_USER,
    RED_TEAM_SYSTEM, RED_TEAM_USER,
    PROGNOSTIC_SYSTEM, PROGNOSTIC_USER,
    REPORT_SYSTEM, REPORT_USER,
)


def _truncate_df(df, max_rows: int = 200) -> str:
    """DataFrame'i string'e cevirir, cok buyukse truncate eder."""
    if df is None or df.empty:
        return "Veri bulunamadi."
    if len(df) > max_rows:
        return df.head(max_rows).to_string(index=False) + f"\n... ({len(df)} satirdan ilk {max_rows} gosterildi)"
    return df.to_string(index=False)


# =====================================================================
# FAZ 0 - Veri Hazirlama Ajani
# =====================================================================
async def faz0_veri_hazirlama(patient_data: dict) -> dict:
    """Ham hasta verilerinden zenginlestirilmis klinik paket uretir."""
    anadata_str = _truncate_df(patient_data["anadata"])
    lab_str = _truncate_df(patient_data["lab"], max_rows=300)
    recete_str = _truncate_df(patient_data["recete"])

    user_prompt = FAZ0_USER.format(
        anadata=anadata_str,
        lab=lab_str,
        recete=recete_str,
    )
    result = await call_llm(FAZ0_SYSTEM, user_prompt)
    return result


# =====================================================================
# FAZ 1 - 10 Uzman Paralel
# =====================================================================
async def faz1_uzman_degerlendirme(clinical_packet: dict) -> dict[str, dict]:
    """10 uzmanin paralel degerlendirmelerini dondurur."""
    packet_str = json.dumps(clinical_packet, ensure_ascii=False, indent=2)

    calls = []
    for system_key in SPECIALIST_SYSTEMS:
        label = SPECIALIST_LABELS[system_key]
        sys_prompt = SPECIALIST_SYSTEM.format(specialist_name=label)
        usr_prompt = SPECIALIST_USER.format(
            specialist_name=label,
            clinical_packet=packet_str,
            system_key=system_key,
        )
        calls.append((sys_prompt, usr_prompt))

    results = await call_llm_batch(calls)

    assessments = {}
    for system_key, result in zip(SPECIALIST_SYSTEMS, results):
        assessments[system_key] = result
    return assessments


# =====================================================================
# FAZ 2a/2b - Konsultasyon Turlari
# =====================================================================
async def faz2_konsultasyon(assessments: dict[str, dict], round_num: int) -> dict[str, dict]:
    """Bir konsultasyon turu calistirir. Her uzman diger 9 uzmanin bulgularini okur."""
    calls = []
    system_keys = []

    for system_key in SPECIALIST_SYSTEMS:
        label = SPECIALIST_LABELS[system_key]
        own = assessments[system_key]

        # Diger uzmanlarin degerlendirmeleri
        others = {k: v for k, v in assessments.items() if k != system_key}
        others_str = json.dumps(others, ensure_ascii=False, indent=2)

        # Bu uzmana yoneltilen sorular
        questions = {}
        for other_key, other_assessment in assessments.items():
            if other_key == system_key:
                continue
            qs = other_assessment.get("diger_uzmanlara_sorular", {})
            if isinstance(qs, dict) and system_key in qs:
                questions[SPECIALIST_LABELS[other_key]] = qs[system_key]
            # Label ile de eslestir
            if isinstance(qs, dict) and label in qs:
                questions[SPECIALIST_LABELS[other_key]] = qs[label]

        questions_str = json.dumps(questions, ensure_ascii=False, indent=2) if questions else "Soru yok."

        sys_prompt = CONSULTATION_SYSTEM.format(specialist_name=label)
        usr_prompt = CONSULTATION_USER.format(
            own_assessment=json.dumps(own, ensure_ascii=False, indent=2),
            other_assessments=others_str,
            questions_to_me=questions_str,
            system_key=system_key,
        )
        calls.append((sys_prompt, usr_prompt))
        system_keys.append(system_key)

    results = await call_llm_batch(calls)

    updated = {}
    for key, result in zip(system_keys, results):
        updated[key] = result
    return updated


# =====================================================================
# FAZ 2c - Hakem Ajani
# =====================================================================
def _find_score_conflicts(round1: dict[str, dict], round2: dict[str, dict]) -> list[tuple[str, dict, dict]]:
    """Iki tur arasinda skor farki >= 2 olan sistemleri bulur."""
    conflicts = []
    for key in SPECIALIST_SYSTEMS:
        score1 = round1.get(key, {}).get("skor", 0)
        score2 = round2.get(key, {}).get("skor", 0)
        try:
            score1 = int(score1)
            score2 = int(score2)
        except (ValueError, TypeError):
            continue
        if abs(score1 - score2) >= 2:
            conflicts.append((key, round1[key], round2[key]))
    return conflicts


async def faz2c_hakem(conflicts: list[tuple[str, dict, dict]]) -> dict[str, dict]:
    """Hakem ajani: skor farki >= 2 olan sistemler icin baglayici karar verir."""
    if not conflicts:
        return {}

    calls = []
    conflict_keys = []

    for system_key, assess1, assess2 in conflicts:
        label = SPECIALIST_LABELS[system_key]
        usr_prompt = ARBITRATOR_USER.format(
            system_name=label,
            assessment_1=json.dumps(assess1, ensure_ascii=False, indent=2),
            assessment_2=json.dumps(assess2, ensure_ascii=False, indent=2),
            system_key=system_key,
        )
        calls.append((ARBITRATOR_SYSTEM, usr_prompt))
        conflict_keys.append(system_key)

    results = await call_llm_batch(calls)

    decisions = {}
    for key, result in zip(conflict_keys, results):
        decisions[key] = result
    return decisions


# =====================================================================
# FAZ 3 - Bas Hekim Ajani
# =====================================================================
async def faz3_bas_hekim(
    specialist_reports: dict[str, dict],
    arbitrator_decisions: dict[str, dict],
    clinical_packet: dict,
    revision_note: str = "",
) -> dict:
    """Bas Hekim: butunsel klinik tablo uretir."""
    usr_prompt = CHIEF_PHYSICIAN_USER.format(
        specialist_reports=json.dumps(specialist_reports, ensure_ascii=False, indent=2),
        arbitrator_decisions=json.dumps(arbitrator_decisions, ensure_ascii=False, indent=2) if arbitrator_decisions else "Hakem karari yok.",
        clinical_packet=json.dumps(clinical_packet, ensure_ascii=False, indent=2),
        revision_note=revision_note,
    )
    return await call_llm(CHIEF_PHYSICIAN_SYSTEM, usr_prompt)


# =====================================================================
# FAZ 5 - Red Team Ajani
# =====================================================================
async def faz5_red_team(
    chief_report: dict,
    specialist_reports: dict[str, dict],
    clinical_packet: dict,
    iteration: int,
) -> dict:
    """Red Team: adversarial itirazlar uretir."""
    iteration_notes = {
        1: "Bu 1. Red Team iterasyonu. Tum ciktilari ilk kez inceliyorsun.",
        2: "Bu 2. Red Team iterasyonu. Bas Hekim 1. itirazlarindan sonra revize etti. Daha guclu argumanlar gerekli (esik: 6).",
        3: "Bu 3. ve SON Red Team iterasyonu. Bu itirazlar 'azinlik gorusu' olarak rapora eklenecek. Skor degismeyecek.",
    }

    usr_prompt = RED_TEAM_USER.format(
        chief_report=json.dumps(chief_report, ensure_ascii=False, indent=2),
        specialist_reports=json.dumps(specialist_reports, ensure_ascii=False, indent=2),
        clinical_packet=json.dumps(clinical_packet, ensure_ascii=False, indent=2),
        iteration_note=iteration_notes.get(iteration, ""),
    )
    return await call_llm(RED_TEAM_SYSTEM, usr_prompt)


async def faz3_faz5_dongusu(
    specialist_reports: dict[str, dict],
    arbitrator_decisions: dict[str, dict],
    clinical_packet: dict,
) -> tuple[dict, list[dict]]:
    """
    Bas Hekim + Red Team dongusu.
    Dondurur: (final_chief_report, all_red_team_objections)
    """
    chief_report = await faz3_bas_hekim(specialist_reports, arbitrator_decisions, clinical_packet)
    all_objections = []

    for iteration in range(1, MAX_RED_TEAM_ITERATIONS + 1):
        red_team_result = await faz5_red_team(
            chief_report, specialist_reports, clinical_packet, iteration
        )
        all_objections.append(red_team_result)

        max_guc = red_team_result.get("max_guc", 0)
        try:
            max_guc = int(max_guc)
        except (ValueError, TypeError):
            max_guc = 0

        # 3. iterasyon: skor degismez, azinlik gorusu olarak eklenir
        if iteration == MAX_RED_TEAM_ITERATIONS:
            break

        # Esik kontrolu
        threshold = RED_TEAM_THRESHOLDS[iteration - 1] if iteration - 1 < len(RED_TEAM_THRESHOLDS) else 10
        if max_guc < threshold:
            # Itiraz yeterince guclu degil, donguden cik
            break

        # Bas Hekim revize eder
        revision_note = (
            f"RED TEAM ITIRAZLARI (Iterasyon {iteration}, max guc: {max_guc}):\n"
            + json.dumps(red_team_result.get("itirazlar", []), ensure_ascii=False, indent=2)
            + "\n\nBu itirazlari dikkate alarak raporunu revize et."
        )
        chief_report = await faz3_bas_hekim(
            specialist_reports, arbitrator_decisions, clinical_packet,
            revision_note=revision_note,
        )

    return chief_report, all_objections


# =====================================================================
# FAZ 4 - Prognostik Ajan
# =====================================================================
async def faz4_prognostik(final_clinical_report: dict, clinical_packet: dict) -> dict:
    """Prognostik ajan: temporal analiz ve risk tahminleri."""
    usr_prompt = PROGNOSTIC_USER.format(
        final_clinical_report=json.dumps(final_clinical_report, ensure_ascii=False, indent=2),
        clinical_packet=json.dumps(clinical_packet, ensure_ascii=False, indent=2),
    )
    return await call_llm(PROGNOSTIC_SYSTEM, usr_prompt)


# =====================================================================
# FAZ 6 - Rapor Ajani
# =====================================================================
async def faz6_rapor(
    clinical_packet: dict,
    chief_report: dict,
    specialist_reports: dict[str, dict],
    arbitrator_decisions: dict[str, dict],
    red_team_objections: list[dict],
    prognostic_report: dict,
) -> dict:
    """Rapor ajani: tum ciktilari tutarli formata donusturur."""
    usr_prompt = REPORT_USER.format(
        clinical_packet=json.dumps(clinical_packet, ensure_ascii=False, indent=2),
        chief_report=json.dumps(chief_report, ensure_ascii=False, indent=2),
        specialist_reports=json.dumps(specialist_reports, ensure_ascii=False, indent=2),
        arbitrator_decisions=json.dumps(arbitrator_decisions, ensure_ascii=False, indent=2) if arbitrator_decisions else "Hakem karari yok.",
        red_team_objections=json.dumps(red_team_objections, ensure_ascii=False, indent=2),
        prognostic_report=json.dumps(prognostic_report, ensure_ascii=False, indent=2),
    )
    return await call_llm(REPORT_SYSTEM, usr_prompt)
