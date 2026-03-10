const RISK_MAP = {
    'yüksek': { cls: 'hi', label: 'Yüksek Risk' },
    'orta':   { cls: 'md', label: 'Orta Risk' },
    'düşük':  { cls: 'lo', label: 'Düşük Risk' },
};

const SISTEM_LABELS = {
    kardiyovaskuler:       'Kardiyovasküler',
    metabolik_endokrin:    'Metabolik & Endokrin',
    hematolojik_immun:     'Hematolojik & İmmün',
    solunum:               'Solunum',
    kas_iskelet:           'Kas & İskelet',
    norolojik_psikiyatrik: 'Nörolojik & Psikiyatrik',
    gastrointestinal:      'Gastrointestinal',
    ureme_jinekolojik:     'Üreme & Jinekolojik',
    renal_hepatik:         'Renal & Hepatik',
    onkolojik:             'Onkolojik',
};

function parseAgeAndSex(klinikOzet) {
    const ageMatch = klinikOzet.match(/(\d+)\s*yaşında/);
    const age = ageMatch ? parseInt(ageMatch[1]) : 0;
    const sex = /erkek/i.test(klinikOzet) ? 'E' : /kadın/i.test(klinikOzet) ? 'K' : '?';
    return { age, sex };
}

export function transformPatientJson(json, caseId, chatTree = null) {
    const d = json.dashboard_json;
    const score = Math.round(d.genel_skor * 20);
    const risk = RISK_MAP[d.risk_seviyesi] || RISK_MAP['orta'];
    const { age, sex } = parseAgeAndSex(json.klinik_ozet || '');

    const sistemSkorlari = Object.entries(d.sistem_skorlari)
        .sort((a, b) => b[1] - a[1])
        .map(([key, score]) => ({
            key,
            label: SISTEM_LABELS[key] || key,
            score,
            desc: json.skor_gerekceleri?.[key] || '',
        }));

    const now = new Date();
    const lastAnalysis = `${now.getDate().toString().padStart(2,'0')}.${(now.getMonth()+1).toString().padStart(2,'0')}.${now.getFullYear()} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;

    return {
        code: caseId,
        age,
        sex,
        bmi: 0,
        complaint: json.klinik_ozet?.substring(0, 80) || '',
        riskLabelShort: risk.label,
        riskClass: risk.cls,
        status: 'analyzed',
        lastAnalysis,
        healthVelocity: d.health_velocity,
        trend: d.trend,
        overallScore: score,
        overallLabel: risk.label,
        overallLvlClass: risk.cls,
        overallSummary: json.klinik_ozet || '',
        metaLongitudinal: `Health Velocity: ${d.health_velocity} · ${d.trend === 'kotulesme' ? 'Kötüleşme trendi' : d.trend}`,
        metaSystems: `${sistemSkorlari.length} sistem değerlendirmesi`,
        sistemSkorlari,
        oncelikliAksiyonlar: json.oncelikli_aksiyonlar || [],
        altiAylikProj: json.alti_aylik_projeksiyon || '',
        uyarilar: json.uyarilar || [],
        chatTree: chatTree?.initial_questions || null,
    };
}
