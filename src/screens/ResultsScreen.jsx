import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { CASES } from '../data/cases';

export default function ResultsScreen({ setScreen, selectedCase }) {
    const c = selectedCase && CASES[selectedCase] ? CASES[selectedCase] : CASES['ACB-2024-00847'];
    const [breakdownOpen, setBreakdownOpen] = useState(false);
    const [chatInp, setChatInp] = useState('');
    const [messages, setMessages] = useState([{
        sender: 'a',
        text: `Merhaba Dr. Kaya. ${c.code} vakasının analizi tamamlandı. Genel risk skoru ${c.overallScore || 84}/100 — ${c.overallLabel || 'Yüksek Risk'}. ${c.metaSystems || '3 sistem değerlendirmesi'} yapıldı. Sorularınızı yanıtlamaya hazırım.`,
        tags: []
    }]);
    const [typing, setTyping] = useState(false);
    const [suggs, setSuggs] = useState([
        "Framingham kriterlerini bu vakaya uygular mısın?",
        "Klinik seyir öngörüsünü açıklar mısın?",
        "Risk faktörlerini özetle"
    ]);

    const sendFree = () => {
        if (!chatInp.trim()) return;
        const txt = chatInp;
        setMessages(prev => [...prev, { sender: 'u', text: txt, tags: [] }]);
        setChatInp('');
        setTyping(true);
        setTimeout(() => {
            setTyping(false);
            setMessages(prev => [...prev, {
                sender: 'a',
                text: 'Mevcut klinik verilere dayanarak, hastanın durumu dikkate alınmıştır. Ek tetkikler tanıyı kesinleştirebilir.',
                tags: [{ type: 'model', label: 'Verity Clinical AI' }]
            }]);
        }, 1200);
    };

    const handleSugg = (sugg) => {
        setSuggs(suggs.filter(s => s !== sugg));
        setChatInp(sugg);
        setTimeout(() => {
            const btn = document.getElementById('chat-send-btn');
            if (btn) btn.click();
        }, 50);
    };

    return (
        <div id="s-results" className="screen app active">
            <Sidebar setScreen={setScreen} activeScreen="results" />
            <div className="main">
                <Topbar breadcrumbs={[
                    { label: 'Verity', action: () => setScreen('dashboard') },
                    { label: 'Aktif Vakalar', action: () => setScreen('dashboard') },
                    { label: c.code, action: () => setScreen('case-form') },
                    { label: 'Analiz Sonuçları', isCurrent: true }
                ]} setScreen={setScreen} />

                <div className="page">
                    <div className="res-layout">
                        <div className="res-left" id="res-left">
                            <div className="sec-hd">
                                <div className="sec-hd-title">Genel Risk Değerlendirmesi</div>
                                <span className="dtag">Demo İçeriği</span>
                            </div>
                            <div className="grs-card">
                                <div className="grs-top">
                                    <div className="grs-top-left">
                                        <div className="grs-eyebrow">Genel Risk Skoru</div>
                                        <div className="grs-title">Hastanın Genel Klinik Risk Değerlendirmesi</div>
                                        <div className="grs-summary">{c.overallSummary || 'Mevcut klinik bulgular, anamnez ve longitudinal hasta verisi birlikte değerlendirilerek kardiyovasküler ağırlıklı yüksek risk saptanmıştır.'}</div>
                                    </div>
                                    <div className="grs-top-right">
                                        <div className={`grs-lvl-badge`} style={{ background: c.overallLvlClass === 'hi' ? 'rgba(201,53,53,.28)' : 'rgba(201,123,26,.28)', color: c.overallLvlClass === 'hi' ? '#FF9090' : '#FFC080', border: `1px solid ${c.overallLvlClass === 'hi' ? 'rgba(201,53,53,.38)' : 'rgba(201,123,26,.38)'}` }}>
                                            {c.overallLabel || 'Yüksek Risk'}
                                        </div>
                                        <div className="grs-score-display">
                                            <div className="grs-num">{c.overallScore || 84}</div>
                                            <div className="grs-denom">/100</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="grs-body">
                                    <div className="grs-bar-wrap">
                                        <div className="grs-bar-bg">
                                            <div className="grs-bar-fill" style={{ width: `${c.overallScore || 84}%`, background: c.overallLvlClass === 'hi' ? 'linear-gradient(90deg,#C93535,#E55555,#EF8040)' : 'linear-gradient(90deg,#C97B1A,#E09830)' }}></div>
                                        </div>
                                        <div className="grs-bar-pct" style={{ color: c.overallLvlClass === 'hi' ? 'var(--red)' : 'var(--amber)' }}>%{c.overallScore || 84} risk</div>
                                    </div>
                                    <div className="grs-foot">
                                        <div className="grs-meta">
                                            <div className="grs-meta-item">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                                {c.code} · {c.sex} · {c.age}
                                            </div>
                                            <div className="grs-meta-item">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                {c.metaLongitudinal || '5 yıllık longitudinal veri'}
                                            </div>
                                            <div className="grs-meta-item">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
                                                {c.metaSystems || '3 sistem değerlendirmesi'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`breakdown-wrap ${breakdownOpen ? 'open' : ''}`} style={{ marginTop: 14 }}>
                                <div className="breakdown-hd" onClick={() => setBreakdownOpen(!breakdownOpen)}>
                                    <div className="breakdown-hd-left">
                                        <div className="breakdown-title">Detaylı Değerlendirme Kırılımı</div>
                                        <div className="breakdown-sub">· Sistem bazlı skorlar</div>
                                    </div>
                                    <div className="breakdown-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg></div>
                                </div>
                                <div className="breakdown-body">
                                    <div className="breakdown-intro">Aşağıdaki kategoriler birbirinden bağımsız hesaplanmıştır ve genel skoru doğrudan toplamaz.</div>
                                    <div className="bk-grid">
                                        <div className={`bk-cat ${c.overallLvlClass || 'hi'}`}>
                                            <div className="bk-cat-top">
                                                <div className="bk-cat-label">Birincil Sistem</div>
                                                <div className="bk-cat-name">Kardiyovasküler Değerlendirme</div>
                                                <div className={`bk-lvl ${c.overallLvlClass || 'hi'}`}>{c.overallLabel || 'Yüksek Risk'}</div>
                                                <div className="bk-score-row">
                                                    <div className="bk-num">{c.overallScore || 84}</div><div className="bk-den">/100</div>
                                                </div>
                                            </div>
                                            <div className="bk-bar-bg"><div className="bk-bar-fill" style={{ width: `${c.overallScore || 84}%` }}></div></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="res-right a0">
                            <div className="ast-panel">
                                <div className="ast-hd">
                                    <div className="ast-av"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 010 2h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 010-2h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z" /><circle cx="9" cy="13" r="1" fill="currentColor" /><circle cx="15" cy="13" r="1" fill="currentColor" /></svg></div>
                                    <div><div className="ast-name">Yapay Zeka Asistanı</div><div className="ast-status"><div className="st-dot"></div>Simüle · Demo Modu</div></div>
                                </div>
                                <div className="ast-msgs" id="chat-msgs">
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
                                {suggs.length > 0 && (
                                    <div className="ast-sugg" id="sugg-area">
                                        <div className="sugg-lbl">Önerilen Sorular</div>
                                        <div className="sugg-btns">
                                            {suggs.map(sugg => (
                                                <button key={sugg} className="sugg-btn" onClick={() => handleSugg(sugg)}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                                                    {sugg}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="ast-inp">
                                    <input className="chat-in" value={chatInp} onChange={e => setChatInp(e.target.value)} placeholder="Sorunuzu yazın..." onKeyDown={e => { if (e.key === 'Enter') sendFree(); }} />
                                    <button id="chat-send-btn" className="chat-send" onClick={sendFree}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg></button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
