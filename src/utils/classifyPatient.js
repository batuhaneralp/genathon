// Classify each patient into a disease category based on complaint/anamnesis
export function classifyPatient(c) {
    const text = ((c.complaint || '') + ' ' + (c.anamnesis || '')).toLowerCase();
    if (/meme\s*ca|meme\s*kitle|meme\s*lezyon|breast|mastektomi|mamografi/i.test(text)) return 'Onkoloji — Meme';
    if (/prostat|psma|psa/i.test(text)) return 'Onkoloji — Prostat';
    if (/endometrium|over ca|serviks/i.test(text)) return 'Onkoloji — Jinekolojik';
    if (/akciğer|pulmoner|koah|öksürük.*kilo|toraks|pnömoni/i.test(text)) return 'Pulmoner';
    if (/kalp|kardiyovasküler|göğüs ağrısı|nefes darlığı|ödem|koroner|miyokard/i.test(text)) return 'Kardiyovasküler';
    if (/karın ağrısı|bulantı|gastro|ülser|pankreat|gis/i.test(text)) return 'Gastrointestinal';
    if (/tiroid|hashimoto|tsh|endokrin|diyabet|dm|diabet/i.test(text)) return 'Endokrin / Metabolik';
    if (/anemi|hematoloji|kan.*hastalık|lösemi|lenfoma/i.test(text)) return 'Hematolojik';
    if (/kırık|ortoped|kalça|femur|omuz|diz|el bileği/i.test(text)) return 'Ortopedik';
    if (/sisplatin|kemoterapi|radyoterapi|onkoloji|kanser|tümör|metastaz/i.test(text)) return 'Onkoloji — Diğer';
    if (/nöroloji|epilepsi|nöbet|baş dönmesi|inme/i.test(text)) return 'Nörolojik';
    if (/alopesi|dermatoloji|cilt/i.test(text)) return 'Dermatolojik';
    return 'Diğer';
}

export function getAgeInterval(age) {
    if (age < 30) return '18-29';
    if (age < 40) return '30-39';
    if (age < 50) return '40-49';
    if (age < 60) return '50-59';
    if (age < 70) return '60-69';
    return '70+';
}

export function getRiskCategory(score) {
    if (score >= 65) return 'Yüksek';
    if (score >= 40) return 'Orta';
    return 'Düşük';
}
