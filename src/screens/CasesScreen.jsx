import React from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function CasesScreen({ setScreen, setSelectedCase, cases = {} }) {
    const caseEntries = Object.entries(cases);

    const handleOpenCase = (id) => {
        setSelectedCase(id);
        setScreen('results');
    };

    return (
        <div id="s-cases" className="screen app active">
            <Sidebar setScreen={setScreen} activeScreen="cases" />
            <div className="main">
                <Topbar breadcrumbs={[
                    { label: 'Verity', action: () => setScreen('dashboard') },
                    { label: 'Aktif Vakalar', isCurrent: true }
                ]} setScreen={setScreen} />

                <div className="page">
                    <div className="ph a0">
                        <div className="ph-title">Aktif Vakalar</div>
                        <div className="ph-sub">Bugünkü hasta listesi &nbsp;·&nbsp; {caseEntries.length} vaka</div>
                    </div>

                    <div className="card a1">
                        <div className="card-hd">
                            <div className="card-title">Aktif Vakalar ({caseEntries.length})</div>
                        </div>
                        <table className="dt">
                            <thead>
                                <tr>
                                    <th>Hasta Kodu</th>
                                    <th>Yaş / Cins.</th>
                                    <th className="col-complaint">Başvuru Şikayeti</th>
                                    <th>Risk</th>
                                    <th className="hide-mobile">Son Analiz</th>
                                    <th className="hide-mobile">İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {caseEntries.map(([id, c]) => (
                                    <tr key={id} className="row-click" onClick={() => handleOpenCase(id)}
                                        style={c.riskClass === 'hi' ? { background: 'rgba(201,53,53,.025)' } : {}}>
                                        <td><span className="pt-code">{id.replace('VRT-', '')}</span></td>
                                        <td>{c.age} / {c.sex}</td>
                                        <td className="col-complaint" style={{ color: 'var(--text2)' }}>
                                            {c.complaint.substring(0, 40)}{c.complaint.length > 40 ? '…' : ''}
                                        </td>
                                        <td><span className={`rb ${c.riskClass}`}>{c.riskLabelShort}</span></td>
                                        <td className="hide-mobile"><span className="date">{c.lastAnalysis || '—'}</span></td>
                                        <td className="hide-mobile">
                                            <button
                                                className={`tbl-btn ${c.riskClass === 'hi' ? 'pri' : ''}`}
                                                onClick={(e) => { e.stopPropagation(); handleOpenCase(id); }}
                                            >
                                                Analizi Gör
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
