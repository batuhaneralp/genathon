import React, { useState, useMemo } from 'react';
import { classifyPatient, getAgeInterval, getRiskCategory } from '../utils/classifyPatient';

const ALL = 'Tümü';

/* ── tiny pure-CSS bar chart ── */
function BarChart({ data, colorMap }) {
    const max = Math.max(...data.map(d => d.count), 1);
    return (
        <div className="bi-bars">
            {data.map(d => (
                <div key={d.label} className="bi-bar-row">
                    <span className="bi-bar-label">{d.label}</span>
                    <div className="bi-bar-track">
                        <div className="bi-bar-fill" style={{ width: `${(d.count / max) * 100}%`, background: colorMap?.[d.label] || 'var(--grad-teal)' }} />
                    </div>
                    <span className="bi-bar-val">{d.count}</span>
                </div>
            ))}
        </div>
    );
}

/* ── donut chart via SVG ── */
function DonutChart({ segments, size = 120 }) {
    const total = segments.reduce((s, d) => s + d.count, 0) || 1;
    const r = 40, c = 2 * Math.PI * r;
    let offset = 0;
    return (
        <div className="bi-donut-wrap">
            <svg viewBox="0 0 100 100" width={size} height={size}>
                {segments.map(seg => {
                    const pct = seg.count / total;
                    const dash = pct * c;
                    const gap = c - dash;
                    const el = <circle key={seg.label} cx="50" cy="50" r={r} fill="none" stroke={seg.color} strokeWidth="16"
                        strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset} transform="rotate(-90 50 50)" />;
                    offset += dash;
                    return el;
                })}
                <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="bi-donut-num">{total}</text>
            </svg>
            <div className="bi-donut-legend">
                {segments.map(seg => (
                    <div key={seg.label} className="bi-legend-item">
                        <span className="bi-legend-dot" style={{ background: seg.color }} />
                        <span className="bi-legend-label">{seg.label}</span>
                        <span className="bi-legend-val">{seg.count} <span className="bi-legend-pct">(%{Math.round(seg.count / total * 100)})</span></span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── info card ── */
function InfoNote({ icon, title, value, sub, color }) {
    return (
        <div className="bi-info" style={{ borderLeftColor: color }}>
            <div className="bi-info-icon" style={{ background: color + '18', color }}>{icon}</div>
            <div>
                <div className="bi-info-title">{title}</div>
                <div className="bi-info-val" style={{ color }}>{value}</div>
                {sub && <div className="bi-info-sub">{sub}</div>}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════
   MAIN ANALYTICS PANEL
═══════════════════════════════════════ */
export default function AnalyticsPanel({ cases = {} }) {
    const entries = Object.entries(cases);

    /* ── filters ── */
    const [fGender, setFGender] = useState(ALL);
    const [fAge, setFAge] = useState(ALL);
    const [fRisk, setFRisk] = useState(ALL);
    const [fCat, setFCat] = useState(ALL);

    /* ── enrich data ── */
    const enriched = useMemo(() => entries.map(([id, c]) => ({
        id, ...c,
        category: classifyPatient(c),
        ageInterval: getAgeInterval(c.age),
        riskCat: getRiskCategory(c.overallScore),
    })), []);

    /* ── apply filters ── */
    const filtered = useMemo(() => enriched.filter(p =>
        (fGender === ALL || p.sex === fGender) &&
        (fAge === ALL || p.ageInterval === fAge) &&
        (fRisk === ALL || p.riskCat === fRisk) &&
        (fCat === ALL || p.category === fCat)
    ), [enriched, fGender, fAge, fRisk, fCat]);

    /* ── distribution helpers ── */
    const count = (arr, key) => {
        const map = {};
        arr.forEach(p => { const v = p[key]; map[v] = (map[v] || 0) + 1; });
        return Object.entries(map).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
    };

    const genderData = count(filtered, 'sex');
    const ageData = count(filtered, 'ageInterval').sort((a, b) => {
        const order = ['18-29', '30-39', '40-49', '50-59', '60-69', '70+'];
        return order.indexOf(a.label) - order.indexOf(b.label);
    });
    const riskData = count(filtered, 'riskCat');
    const catData = count(filtered, 'category');

    /* ── unique filter options ── */
    const ageIntervals = [...new Set(enriched.map(p => p.ageInterval))].sort();
    const categories = [...new Set(enriched.map(p => p.category))].sort();

    /* ── aggregate stats ── */
    const avgAge = filtered.length ? Math.round(filtered.reduce((s, p) => s + p.age, 0) / filtered.length) : 0;
    const avgRisk = filtered.length ? Math.round(filtered.reduce((s, p) => s + p.overallScore, 0) / filtered.length) : 0;
    const femaleCount = filtered.filter(p => p.sex === 'K').length;
    const maleCount = filtered.filter(p => p.sex === 'E').length;

    const genderColors = { 'K': '#E05888', 'E': '#3A8FD6' };
    const riskColors = { 'Yüksek': 'var(--red)', 'Orta': 'var(--amber)', 'Düşük': 'var(--green)' };

    const catColors = {
        'Onkoloji — Meme': '#D64B8A', 'Onkoloji — Prostat': '#8B5CF6', 'Onkoloji — Jinekolojik': '#EC4899',
        'Onkoloji — Diğer': '#A855F7', 'Kardiyovasküler': '#EF4444', 'Pulmoner': '#3B82F6',
        'Gastrointestinal': '#F59E0B', 'Endokrin / Metabolik': '#10B981', 'Hematolojik': '#F97316',
        'Ortopedik': '#6366F1', 'Nörolojik': '#14B8A6', 'Dermatolojik': '#84CC16', 'Diğer': '#94A3B8'
    };

    return (
        <div className="bi-panel a2">
            <div className="bi-header">
                <div className="bi-header-left">
                    <div className="bi-icon-wrap">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
                    </div>
                    <div>
                        <div className="bi-panel-title">Klinik İstatistikler</div>
                        <div className="bi-panel-sub">{filtered.length} / {enriched.length} hasta · Gerçek zamanlı veri analizi</div>
                    </div>
                </div>
            </div>

            {/* ── FILTERS ── */}
            <div className="bi-filters">
                <div className="bi-filter">
                    <label className="bi-filter-lbl">Cinsiyet</label>
                    <select className="bi-filter-sel" value={fGender} onChange={e => setFGender(e.target.value)}>
                        <option value={ALL}>Tümü</option>
                        <option value="K">Kadın</option>
                        <option value="E">Erkek</option>
                    </select>
                </div>
                <div className="bi-filter">
                    <label className="bi-filter-lbl">Yaş Aralığı</label>
                    <select className="bi-filter-sel" value={fAge} onChange={e => setFAge(e.target.value)}>
                        <option value={ALL}>Tümü</option>
                        {ageIntervals.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
                <div className="bi-filter">
                    <label className="bi-filter-lbl">Risk Skoru</label>
                    <select className="bi-filter-sel" value={fRisk} onChange={e => setFRisk(e.target.value)}>
                        <option value={ALL}>Tümü</option>
                        <option value="Yüksek">Yüksek (&ge;65)</option>
                        <option value="Orta">Orta (40-64)</option>
                        <option value="Düşük">Düşük (&lt;40)</option>
                    </select>
                </div>
                <div className="bi-filter">
                    <label className="bi-filter-lbl">Hastalık Sınıfı</label>
                    <select className="bi-filter-sel" value={fCat} onChange={e => setFCat(e.target.value)}>
                        <option value={ALL}>Tümü</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                {(fGender !== ALL || fAge !== ALL || fRisk !== ALL || fCat !== ALL) && (
                    <button className="bi-filter-clear" onClick={() => { setFGender(ALL); setFAge(ALL); setFRisk(ALL); setFCat(ALL); }}>
                        ✕ Filtreleri Temizle
                    </button>
                )}
            </div>

            {/* ── INFO NOTES ── */}
            <div className="bi-info-row">
                <InfoNote icon="♀♂" title="Cinsiyet Dağılımı" value={`${femaleCount} K · ${maleCount} E`}
                    sub={`Kadın oranı: %${filtered.length ? Math.round(femaleCount / filtered.length * 100) : 0}`} color="#3A8FD6" />
                <InfoNote icon="📊" title="Ortalama Yaş" value={`${avgAge} yaş`}
                    sub={`Aralık: ${filtered.length ? Math.min(...filtered.map(p => p.age)) : 0} - ${filtered.length ? Math.max(...filtered.map(p => p.age)) : 0}`} color="var(--teal)" />
                <InfoNote icon="⚠" title="Ort. Risk Skoru" value={`${avgRisk}/100`}
                    sub={avgRisk >= 50 ? 'Orta-yüksek risk yükü' : 'Düşük-orta risk yükü'} color={avgRisk >= 50 ? 'var(--red)' : 'var(--amber)'} />
                <InfoNote icon="🏥" title="Toplam Hasta" value={`${filtered.length}`}
                    sub={`${catData.length} hastalık kategorisi`} color="var(--navy)" />
            </div>

            {/* ── CHARTS ── */}
            <div className="bi-charts-grid">
                {/* Gender donut */}
                <div className="bi-chart-card">
                    <div className="bi-chart-title">Cinsiyet Dağılımı</div>
                    <DonutChart segments={genderData.map(d => ({ label: d.label === 'K' ? 'Kadın' : 'Erkek', count: d.count, color: genderColors[d.label] || '#94A3B8' }))} />
                </div>

                {/* Age distribution */}
                <div className="bi-chart-card">
                    <div className="bi-chart-title">Yaş Dağılımı</div>
                    <BarChart data={ageData} colorMap={Object.fromEntries(ageData.map(d => [d.label, 'var(--teal)']))} />
                </div>

                {/* Risk distribution donut */}
                <div className="bi-chart-card">
                    <div className="bi-chart-title">Risk Skoru Dağılımı</div>
                    <DonutChart segments={riskData.map(d => ({ label: d.label, count: d.count, color: riskColors[d.label] || '#94A3B8' }))} />
                </div>

                {/* Disease classification */}
                <div className="bi-chart-card bi-chart-wide">
                    <div className="bi-chart-title">Hastalık Sınıflandırması</div>
                    <BarChart data={catData} colorMap={catColors} />
                </div>
            </div>
        </div>
    );
}
