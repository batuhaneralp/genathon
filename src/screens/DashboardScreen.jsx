import React from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import AnalyticsPanel from '../components/AnalyticsPanel';
import { CASES } from '../data/cases';

export default function DashboardScreen({ setScreen, setSelectedCase }) {
    const caseEntries = Object.entries(CASES);
    const totalCases = caseEntries.length;
    const pendingCases = caseEntries.filter(([, c]) => c.status === 'pending').length;
    const highRiskCases = caseEntries.filter(([, c]) => c.overallScore >= 65).length;
    const analyzedCases = caseEntries.filter(([, c]) => c.status === 'analyzed').length;

    const handleOpenCase = (id) => {
        setSelectedCase(id);
        setScreen('results');
    };
    const handleNewCase = (id) => {
        setSelectedCase(id || null);
        setScreen('case-form');
    };

    const firstHigh = caseEntries.find(([, c]) => c.overallScore >= 65);

    return (
        <div id="s-dashboard" className="screen app active">
            <Sidebar setScreen={setScreen} activeScreen="dashboard" />
            <div className="main">
                <Topbar breadcrumbs={[
                    { label: 'Verity', action: () => setScreen('dashboard') },
                    { label: 'Genel Bakış', isCurrent: true }
                ]} setScreen={setScreen} />

                <div className="page">
                    <div className="ph a0">
                        <div className="ph-title">Genel Bakış</div>
                        <div className="ph-sub">Bugün, 7 Mart 2026 &nbsp;·&nbsp; Acıbadem Maslak &nbsp;·&nbsp; Klinik Vaka Paneli</div>
                    </div>
                    <div className="stat-row a1">
                        <div className="stat-c cn"><div className="stat-lbl">Bugünkü Vakalar</div><div className="stat-val">{totalCases}</div><div className="stat-sub">CSV verisinden yüklendi</div>
                            <div className="stat-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /><circle cx="9" cy="7" r="4" /></svg></div>
                        </div>
                        <div className="stat-c ct"><div className="stat-lbl">Analiz Bekleyen</div><div className="stat-val">{pendingCases}</div><div className="stat-sub">Henüz çalıştırılmamış</div>
                            <div className="stat-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg></div>
                        </div>
                        <div className="stat-c cr"><div className="stat-lbl">Yüksek Risk Uyarısı</div><div className="stat-val">{highRiskCases}</div><div className="stat-sub">Kritik eşik aşıldı</div>
                            <div className="stat-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg></div>
                        </div>
                        <div className="stat-c cg"><div className="stat-lbl">Tamamlanan Rapor</div><div className="stat-val">{analyzedCases}</div><div className="stat-sub">Analiz edildi</div>
                            <div className="stat-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12" /></svg></div>
                        </div>
                    </div>

                    <AnalyticsPanel />

                    {firstHigh && (
                        <div className="alert-band a2">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                            <div className="alert-band-txt"><strong>Yüksek Risk Uyarısı:</strong> {firstHigh[0]} numaralı vakada kritik bulgular tespit edildi.</div>
                            <div className="alert-band-link" onClick={() => handleOpenCase(firstHigh[0])}>Vakayı Görüntüle →</div>
                        </div>
                    )}

                    <div className="card a3">
                        <div className="card-hd">
                            <div className="card-title">Aktif Vakalar ({totalCases})</div>
                            <button className="btn-ghost" onClick={() => handleNewCase()}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}><path d="M12 5v14M5 12h14" /></svg>Yeni Vaka</button>
                        </div>
                        <table className="dt">
                            <thead><tr><th>Hasta Kodu</th><th>Yaş / Cins.</th><th className="col-complaint">Başvuru Şikayeti</th><th>Risk</th><th className="hide-mobile">Son Analiz</th><th className="hide-mobile">İşlem</th></tr></thead>
                            <tbody>
                                {caseEntries.map(([id, c]) => (
                                    <tr key={id} className="row-click" onClick={() => handleOpenCase(id)}
                                        style={c.riskClass === 'hi' ? { background: 'rgba(201,53,53,.025)' } : {}}>
                                        <td><span className="pt-code">{c.code}</span></td>
                                        <td>{c.age} / {c.sex}</td>
                                        <td className="col-complaint" style={{ color: 'var(--text2)' }}>{c.complaint.substring(0, 40)}{c.complaint.length > 40 ? '…' : ''}</td>
                                        <td><span className={`rb ${c.riskClass}`}>{c.riskLabelShort}</span></td>
                                        <td className="hide-mobile"><span className="date">{c.lastAnalysis || '—'}</span></td>
                                        <td className="hide-mobile">
                                            {c.status === 'pending'
                                                ? <button className="tbl-btn" onClick={(e) => { e.stopPropagation(); handleNewCase(id); }}>Analiz Başlat</button>
                                                : <button className={`tbl-btn ${c.riskClass === 'hi' ? 'pri' : ''}`} onClick={(e) => { e.stopPropagation(); handleOpenCase(id); }}>Analizi Gör</button>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <button className="fab" onClick={() => handleNewCase()}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>Yeni Vaka Aç</button>
        </div>
    );
}
