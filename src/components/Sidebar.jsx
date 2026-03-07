import React from 'react';

export default function Sidebar({ setScreen, activeScreen }) {
    return (
        <aside className="sidebar">
            <div className="sb-brand">
                <div className="sb-logo">
                    <div className="sb-logo-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                    </div>
                    <div>
                        <div className="sb-name">Verity</div>
                        <div className="sb-sub">AI-Assisted CDS</div>
                    </div>
                </div>
            </div>
            <nav className="sb-nav">
                <div className="sb-section">Ana Menü</div>
                <div className={`nav-i ${activeScreen === 'dashboard' ? 'on' : ''}`} onClick={() => setScreen('dashboard')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>Genel Bakış
                </div>
                <div className={`nav-i ${activeScreen === 'case-form' ? 'on' : ''}`} onClick={() => setScreen('case-form')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>Yeni Vaka
                </div>
                <div className={`nav-i ${activeScreen === 'results' ? 'on' : ''}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Aktif Vakalar
                </div>
                <div className="sb-section">Çıktılar</div>
                <div className="nav-i inactive"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>Raporlar<span className="nav-upcoming">Yakında</span></div>
                <div className="nav-i inactive"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93l-1.41 1.41M5.34 18.66l-1.41 1.41M21 12h-2M5 12H3" /></svg>Ayarlar<span className="nav-upcoming">Yakında</span></div>
            </nav>
            <div className="sb-foot">
                <div className="sb-doc">
                    <div className="sb-av">AK</div>
                    <div><div className="sb-doc-name">Dr. A. Kaya</div><div className="sb-doc-role">İç Hastalıkları</div></div>
                </div>
            </div>
        </aside>
    );
}
