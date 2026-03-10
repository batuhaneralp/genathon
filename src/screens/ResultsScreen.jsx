import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
const SCORE_META = {
    5: { cls: 'hi',  label: 'Yüksek Risk' },
    4: { cls: 'hi',  label: 'Yüksek-Orta Risk' },
    3: { cls: 'md',  label: 'Orta Risk' },
    2: { cls: 'lo',  label: 'Düşük-Orta Risk' },
    1: { cls: 'lo',  label: 'Düşük Risk' },
};

export default function ResultsScreen({ setScreen, selectedCase, cases = {} }) {
    const c = (selectedCase && cases[selectedCase]) ? cases[selectedCase] : cases[Object.keys(cases)[0]];

    const [breakdownOpen, setBreakdownOpen] = useState(true);
    const [messages, setMessages] = useState([{
        sender: 'a',
        text: c ? `Merhaba Dr. Kaya. ${c.code.replace('VRT-', '')} vakasının analizi tamamlandı. Genel risk skoru ${c.overallScore}/100 — ${c.overallLabel}. ${c.metaSystems} yapıldı. Sorularınızı yanıtlamaya hazırım.` : '',
        tags: []
    }]);
    const [typing, setTyping] = useState(false);
    const [currentSuggs, setCurrentSuggs] = useState(c?.chatTree || []);
    const msgsRef = useRef(null);

    useEffect(() => {
        if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }, [messages, typing]);

    if (!c) return <div className="screen app active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>Yükleniyor...</div>;

    const addExchange = (questionText, answerText, followUps) => {
        setMessages(prev => [...prev, { sender: 'u', text: questionText, tags: [] }]);
        setCurrentSuggs([]);
        setTyping(true);
        setTimeout(() => {
            setTyping(false);
            setMessages(prev => [...prev, {
                sender: 'a',
                text: answerText,
                tags: [{ type: 'model', label: 'Verity Clinical AI' }]
            }]);
            setCurrentSuggs(followUps || []);
        }, 900);
    };

    const handleTreeNode = (node) => {
        addExchange(node.text, node.answer, node.follow_ups || []);
    };

    const velocityColor = c.healthVelocity < 0 ? 'var(--red)' : c.healthVelocity > 0 ? 'var(--teal)' : 'var(--text2)';

    return (
        <div id="s-results" className="screen app active">
            <Sidebar setScreen={setScreen} activeScreen="results" />
            <div className="main">
                <Topbar breadcrumbs={[
                    { label: 'Verity', action: () => setScreen('dashboard') },
                    { label: 'Aktif Vakalar', action: () => setScreen('cases') },
                    { label: 'Analiz Sonuçları', isCurrent: true }
                ]} setScreen={setScreen} />

                <div className="page">
                    <div className="res-layout">
                        <div className="res-left" id="res-left">

                            {/* ── Genel Risk Değerlendirmesi ── */}
                            <div className="sec-hd">
                                <div className="sec-hd-title">Genel Risk Değerlendirmesi</div>
                                <span className="dtag">AI Analizi</span>
                            </div>
                            <div className="grs-card">
                                <div className="grs-top">
                                    <div className="grs-top-left">
                                        <div className="grs-eyebrow">Genel Risk Skoru</div>
                                        <div className="grs-title">Hastanın Genel Klinik Risk Değerlendirmesi</div>
                                        <div className="grs-summary">{c.overallSummary}</div>
                                    </div>
                                    <div className="grs-top-right">
                                        <div className="grs-lvl-badge" style={{ background: c.overallLvlClass === 'hi' ? 'rgba(201,53,53,.28)' : 'rgba(201,123,26,.28)', color: c.overallLvlClass === 'hi' ? '#FF9090' : '#FFC080', border: `1px solid ${c.overallLvlClass === 'hi' ? 'rgba(201,53,53,.38)' : 'rgba(201,123,26,.38)'}` }}>
                                            {c.overallLabel}
                                        </div>
                                        <div className="grs-score-display">
                                            <div className="grs-num">{c.overallScore}</div>
                                            <div className="grs-denom">/100</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="grs-body">
                                    <div className="grs-bar-wrap">
                                        <div className="grs-bar-bg">
                                            <div className="grs-bar-fill" style={{ width: `${c.overallScore}%`, background: c.overallLvlClass === 'hi' ? 'linear-gradient(90deg,#C93535,#E55555,#EF8040)' : 'linear-gradient(90deg,#C97B1A,#E09830)' }}></div>
                                        </div>
                                        <div className="grs-bar-pct" style={{ color: c.overallLvlClass === 'hi' ? 'var(--red)' : 'var(--amber)' }}>%{c.overallScore} risk</div>
                                    </div>
                                    <div className="grs-foot">
                                        <div className="grs-meta">
                                            <div className="grs-meta-item">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                                {c.code.replace('VRT-', '')} · {c.sex} · {c.age} yaş{c.bmi > 0 ? ` · BMI ${c.bmi}` : ''}
                                            </div>
                                            <div className="grs-meta-item">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                {c.metaLongitudinal}
                                            </div>
                                            <div className="grs-meta-item">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
                                                {c.metaSystems}
                                            </div>
                                            {c.healthVelocity !== undefined && (
                                                <div className="grs-meta-item" style={{ color: velocityColor }}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
                                                    Health Velocity: {c.healthVelocity > 0 ? '+' : ''}{c.healthVelocity} · {c.trend === 'kotulesme' ? 'Kötüleşme' : c.trend}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Sistem Bazlı Skor Kırılımı ── */}
                            {c.sistemSkorlari && (
                                <div className={`breakdown-wrap ${breakdownOpen ? 'open' : ''}`} style={{ marginTop: 14 }}>
                                    <div className="breakdown-hd" onClick={() => setBreakdownOpen(!breakdownOpen)}>
                                        <div className="breakdown-hd-left">
                                            <div className="breakdown-title">Sistem Bazlı Skor Kırılımı</div>
                                            <div className="breakdown-sub">· {c.sistemSkorlari.length} sistem değerlendirmesi · Skor: 1–5</div>
                                        </div>
                                        <div className="breakdown-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg></div>
                                    </div>
                                    <div className="breakdown-body">
                                        <div className="breakdown-intro">Aşağıdaki kategoriler birbirinden bağımsız hesaplanmıştır. Her skor 1 (düşük) – 5 (yüksek) skalasındadır.</div>
                                        <div className="bk-grid">
                                            {c.sistemSkorlari.map(s => {
                                                const meta = SCORE_META[s.score] || SCORE_META[3];
                                                return (
                                                    <div key={s.key} className={`bk-cat ${meta.cls}`}>
                                                        <div className="bk-cat-top">
                                                            <div className="bk-cat-label">{meta.label}</div>
                                                            <div className="bk-cat-name">{s.label}</div>
                                                            <div className={`bk-lvl ${meta.cls}`}>{s.score}/5</div>
                                                            <div className="bk-score-row">
                                                                <div className="bk-num">{s.score * 20}</div><div className="bk-den">/100</div>
                                                            </div>
                                                        </div>
                                                        <div className="bk-bar-bg"><div className="bk-bar-fill" style={{ width: `${s.score * 20}%` }}></div></div>
                                                        {s.desc && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 8, lineHeight: 1.5 }}>{s.desc}</div>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Öncelikli Aksiyonlar ── */}
                            {c.oncelikliAksiyonlar && c.oncelikliAksiyonlar.length > 0 && (
                                <div className="card" style={{ marginTop: 14 }}>
                                    <div className="card-hd">
                                        <div className="card-title">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, marginRight: 6, verticalAlign: 'middle' }}><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
                                            Öncelikli Aksiyonlar
                                        </div>
                                    </div>
                                    <div style={{ padding: '0 16px 16px' }}>
                                        {c.oncelikliAksiyonlar.map((a, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < c.oncelikliAksiyonlar.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                                <div style={{ minWidth: 22, height: 22, borderRadius: '50%', background: 'rgba(201,53,53,.18)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                                                <div style={{ fontSize: 13, color: 'var(--text1)', lineHeight: 1.5 }}>{a}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Uyarılar ── */}
                            {c.uyarilar && c.uyarilar.length > 0 && (
                                <div className="card" style={{ marginTop: 14 }}>
                                    <div className="card-hd">
                                        <div className="card-title">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, marginRight: 6, verticalAlign: 'middle', color: 'var(--amber)' }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                            Dikkat Edilmesi Gereken Uyarılar
                                        </div>
                                    </div>
                                    <div style={{ padding: '0 16px 16px' }}>
                                        {c.uyarilar.map((u, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < c.uyarilar.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--amber)', flexShrink: 0 }}></div>
                                                <div style={{ fontSize: 13, color: 'var(--text1)', lineHeight: 1.5 }}>{u}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── 6 Aylık Projeksiyon ── */}
                            {c.altiAylikProj && (
                                <div className="card" style={{ marginTop: 14 }}>
                                    <div className="card-hd">
                                        <div className="card-title">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, marginRight: 6, verticalAlign: 'middle' }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                                            6 Aylık Projeksiyon
                                        </div>
                                    </div>
                                    <div style={{ padding: '0 16px 16px', fontSize: 13, color: 'var(--text1)', lineHeight: 1.6 }}>
                                        {c.altiAylikProj}
                                    </div>
                                </div>
                            )}


                        </div>

                        {/* ── AI Asistan ── */}
                        <div className="res-right a0">
                            <div className="ast-panel">
                                <div className="ast-hd">
                                    <div className="ast-av"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 010 2h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 010-2h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z" /><circle cx="9" cy="13" r="1" fill="currentColor" /><circle cx="15" cy="13" r="1" fill="currentColor" /></svg></div>
                                    <div><div className="ast-name">Yapay Zeka Asistanı</div><div className="ast-status"><div className="st-dot"></div>Simüle · Demo Modu</div></div>
                                </div>
                                <div className="ast-msgs" id="chat-msgs" ref={msgsRef}>
                                    {messages.map((m, i) => (
                                        <div key={i} className={`msg ${m.sender}`}>
                                            <div className="msg-b">{m.text}</div>
                                            {m.tags && m.tags.length > 0 && (
                                                <div className="msg-tags">
                                                    {m.tags.map(t => <div key={t.label} className={`mtag ${t.type}`}>{t.label}</div>)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {typing && (
                                    <div className="typing show" id="typing-ind">
                                        <div className="ty-dot"></div><div className="ty-dot"></div><div className="ty-dot"></div>
                                        <span className="ty-lbl">Yanıt oluşturuluyor...</span>
                                    </div>
                                )}
                                {!typing && currentSuggs.length > 0 && (
                                    <div className="ast-sugg" id="sugg-area">
                                        <div className="sugg-lbl">Önerilen Sorular</div>
                                        <div className="sugg-btns">
                                            {currentSuggs.map(node => (
                                                <button key={node.id} className="sugg-btn" onClick={() => handleTreeNode(node)}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                                                    {node.text}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
