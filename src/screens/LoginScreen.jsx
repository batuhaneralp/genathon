import React from 'react';

export default function LoginScreen({ setScreen }) {
    return (
        <div id="s-login" className="screen active">
            <div className="lg-mesh"></div>
            <div className="lg-grid"></div>
            <div className="lg-wrap">
                <div className="lg-brand">
                    <div className="lg-logo">
                        <div className="lg-logo-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                        </div>
                        <div>
                            <div className="lg-wordmark">Verity</div>
                            <div className="lg-sub">AI-Assisted Clinical Decision Support</div>
                        </div>
                    </div>
                    <div className="lg-headline">Daha net klinik<br />kararlar için<br /><em>yapay zeka desteği.</em></div>
                    <div className="lg-desc">Verity, yapılandırılmış hasta verisi ve serbest metin anamnezini açıklanabilir risk analizine dönüştürür. Nihai karar her zaman hekime aittir.</div>
                </div>
                <div className="lg-card">
                    <div className="lg-card-title">Sisteme Giriş</div>
                    <div className="lg-card-sub">Demo Erişimi — Acıbadem Sağlık Grubu</div>
                    <div className="demo-badge">
                        <div className="demo-avatar">AK</div>
                        <div><div className="demo-name">Dr. Ayşe Kaya</div><div className="demo-role">İç Hastalıkları Uzmanı · Acıbadem Maslak</div></div>
                    </div>
                    <button className="lg-btn" onClick={() => setScreen('dashboard')}>Demo Olarak Giriş Yap &nbsp;→</button>
                    <div className="lg-foot">
                        <span className="proto-pill">⚙ Prototip Demo Modu</span><br /><br />
                        Bu sistem klinik karar desteği sağlar; tanı koymaz.<br />Gerçek hasta verisi işlenmemektedir.
                    </div>
                </div>
            </div>
        </div>
    );
}
