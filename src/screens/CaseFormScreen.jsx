import React from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { CASES } from '../data/cases';

export default function CaseFormScreen({ setScreen, selectedCase, onStartAnalysis }) {
    const c = selectedCase ? CASES[selectedCase] : null;

    const breadcrumbs = [
        { label: 'Verity', action: () => setScreen('dashboard') },
        { label: 'Aktif Vakalar', action: () => setScreen('dashboard') },
        { label: c ? c.code : 'Yeni Vaka', isCurrent: true }
    ];

    return (
        <div id="s-case-form" className="screen app active">
            <Sidebar setScreen={setScreen} activeScreen="case-form" />
            <div className="main">
                <Topbar breadcrumbs={breadcrumbs} setScreen={setScreen} />

                <div className="page" style={{ paddingBottom: 0 }}>
                    <div className="ph a0">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div className="ph-title">Yeni Vaka &nbsp;<span style={{ color: 'var(--teal)', fontFamily: 'var(--f-mono)', fontSize: 18, fontWeight: 600 }}>{c ? c.code : 'YENİ VAKA'}</span></div>
                                <div className="ph-sub">Yapılandırılmış klinik veri girişi &amp; anamnez</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div className="prog-lbl" style={{ marginBottom: 4 }}>Tamamlanma: <strong style={{ color: 'var(--teal)' }}>%{c ? c.completion : 0}</strong></div>
                                <div className="prog-bar" style={{ width: 200 }}>
                                    <div className="prog-fill" style={{ width: `${c ? c.completion : 0}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="cf-grid a1">
                        {/* LEFT: structured */}
                        <div>
                            <div className="card">
                                <div className="card-bd" id="form-left-body">
                                    <div className="fs">
                                        <div className="fs-title">Demografik Bilgiler</div>
                                        <div className="fg3">
                                            <div className="fg-1"><label className="fl">Yaş</label><input type="number" className="fi" defaultValue={c?.age} placeholder="Örn. 45" /></div>
                                            <div className="fg-1"><label className="fl">Cinsiyet</label>
                                                <select className="fsel" defaultValue={c?.sex || ""}>
                                                    <option value="" disabled>Seçiniz</option>
                                                    <option value="E">Erkek</option>
                                                    <option value="K">Kadın</option>
                                                </select>
                                            </div>
                                            <div className="fg-1"><label className="fl">VKİ</label><input type="number" className="fi mono" defaultValue={c?.bmi} placeholder="—" /></div>
                                        </div>
                                        <div className="fg" style={{ marginTop: 9 }}>
                                            <div className="fg-1"><label className="fl">Boy (cm)</label><input type="number" className="fi mono" defaultValue={c?.height} placeholder="—" /></div>
                                            <div className="fg-1"><label className="fl">Kilo (kg)</label><input type="number" className="fi mono" defaultValue={c?.weight} placeholder="—" /></div>
                                        </div>
                                    </div>

                                    <div className="fs">
                                        <div className="fs-title">Vital Bulgular</div>
                                        <div className="fg" style={{ marginBottom: 9 }}>
                                            <div className="fg-1">
                                                <label className="fl">Tansiyon (Sistolik / Diastolik)</label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <input type="number" className={`fi mono ${c?.vitalsFlags?.bpSys || ''}`} defaultValue={c?.vitals?.bpSys} placeholder="120" />
                                                    <span>/</span>
                                                    <input type="number" className={`fi mono ${c?.vitalsFlags?.bpDia || ''}`} defaultValue={c?.vitals?.bpDia} placeholder="80" />
                                                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>mmHg</span>
                                                </div>
                                                {c?.vitalsWarnings?.bpSys && <div className="f-warn">{c.vitalsWarnings.bpSys}</div>}
                                            </div>
                                        </div>
                                        <div className="fg3" style={{ marginBottom: 9 }}>
                                            <div className="fg-1"><label className="fl">Nabız</label><input type="number" className={`fi mono ${c?.vitalsFlags?.hr || ''}`} defaultValue={c?.vitals?.hr} placeholder="—" /></div>
                                            <div className="fg-1">
                                                <label className="fl">SpO2 (%)</label>
                                                <input type="number" className={`fi mono ${c?.vitalsFlags?.spo2 || ''}`} defaultValue={c?.vitals?.spo2} placeholder="—" />
                                                {c?.vitalsWarnings?.spo2 && <div className="f-warn red">{c.vitalsWarnings.spo2}</div>}
                                            </div>
                                            <div className="fg-1"><label className="fl">Ateş (°C)</label><input type="number" className={`fi mono ${c?.vitalsFlags?.temp || ''}`} defaultValue={c?.vitals?.temp} placeholder="—" /></div>
                                        </div>
                                        <div className="fg-1">
                                            <label className="fl">Şikayet Süresi</label>
                                            <select className="fsel" defaultValue={c?.vitals?.duration || ""}>
                                                <option value="" disabled>Seçiniz</option>
                                                <option value="<24 saat (Akut)">{"<24 saat (Akut)"}</option>
                                                <option value="1-3 gün (Akut)">1-3 gün (Akut)</option>
                                                <option value="3-7 gün (Subakut)">3-7 gün (Subakut)</option>
                                                <option value="1-4 hafta (Subakut)">1-4 hafta (Subakut)</option>
                                                <option value=">4 hafta (Kronik)">{">4 hafta (Kronik)"}</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="fs">
                                        <div className="fs-title">Kronik Hastalıklar</div>
                                        <div className="chips">
                                            {['Tip 2 DM', 'Hipertansiyon', 'KOAH', 'KAH', 'Hiperlipidemi', 'Hashimoto Tiroiditi'].map(cond => (
                                                <div key={cond} className={`chip ${(c?.conditions || []).includes(cond) ? 'on' : ''}`}>{cond}</div>
                                            ))}
                                        </div>
                                    </div>

                                    {c?.meds && c.meds.length > 0 && (
                                        <div className="fs">
                                            <div className="fs-title">Aktif İlaçlar</div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                {c.meds.map((med, i) => (
                                                    <div key={i} className="drug-row">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                                        {med}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="fs" style={{ marginBottom: 0 }}>
                                        <div className="fs-title">Aile Öyküsü</div>
                                        <div className="chips" style={{ marginBottom: 10 }}>
                                            {['Kardiyovasküler Hastalık', 'DM', 'Kanser', 'İnme'].map(cond => (
                                                <div key={cond} className={`chip ${(c?.familyChips || []).includes(cond) ? 'on' : ''}`}>{cond}</div>
                                            ))}
                                        </div>
                                        {c?.familyHistory && (
                                            <div style={{ background: 'var(--amber-dim2)', borderLeft: '3px solid var(--amber)', padding: '8px 11px', fontSize: 12, fontWeight: 500, color: 'var(--amber)' }}>
                                                {c.familyHistory}
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* RIGHT: free text */}
                        <div>
                            <div className="card" style={{ height: '100%' }}>
                                <div className="card-hd">
                                    <div className="card-title">Anamnez &amp; Başvuru Şikayeti</div>
                                    <button className="btn-passive" title="Prototipte aktif değil">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                                        Sesli Dikte
                                    </button>
                                </div>
                                <div className="card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                                    <textarea className="fta" placeholder="Hastanın şikayetini, öyküsünü ve muayene bulgularını serbest metin olarak giriniz..." defaultValue={c?.anamnesis || ''} readOnly={!!c}></textarea>
                                    <div className="fta-meta">
                                        <span className="fta-cnt">{c?.wordCount || '0 kelime · 0 karakter'}</span>
                                        <button className="btn-passive">Metinden Otomatik Doldur</button>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: 'var(--teal-dim2)', border: '1px solid rgba(10,158,142,.14)', borderRadius: 8, fontSize: 11.5, color: 'var(--text2)', marginTop: 8 }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14, color: 'var(--teal)', flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                                        <div>Laboratuvar verileri eklenirse değerlendirme daha kapsamlı olabilir. (Opsiyonel)</div>
                                    </div>
                                    <div className="fs">
                                        <div className="fs-title" style={{ marginTop: 10 }}>Laboratuvar Değerleri (Opsiyonel)</div>
                                        <div className="fg3">
                                            <div className="fg-1">
                                                <label className="fl">Hgb (g/dL)</label>
                                                <input type="text" className={`fi mono ${c?.labs?.hgb?.cls || ''}`} defaultValue={typeof c?.labs?.hgb === 'object' ? c.labs.hgb.val : (c?.labs?.hgb || '')} placeholder="—" />
                                            </div>
                                            <div className="fg-1">
                                                <label className="fl">CRP (mg/L)</label>
                                                <input type="text" className={`fi mono ${c?.labs?.crp?.cls || ''}`} defaultValue={typeof c?.labs?.crp === 'object' ? c.labs.crp.val : (c?.labs?.crp || '')} placeholder="—" />
                                            </div>
                                            <div className="fg-1">
                                                <label className="fl">BNP (pg/mL)</label>
                                                <input type="text" className={`fi mono ${c?.labs?.bnp?.cls || ''}`} defaultValue={typeof c?.labs?.bnp === 'object' ? c.labs.bnp.val : (c?.labs?.bnp || '')} placeholder="—" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-foot">
                    <div className="ff-l">
                        {c?.footerWarnHtml ? (
                            <div dangerouslySetInnerHTML={{ __html: c.footerWarnHtml }}></div>
                        ) : null}
                    </div>
                    <div className="ff-r">
                        <button className="btn-sec" onClick={() => setScreen('dashboard')}>Taslak Kaydet</button>
                        <button className="btn-pri" onClick={onStartAnalysis}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                            Yapay Zeka Analizini Başlat
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
