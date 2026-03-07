import React, { useEffect, useState } from 'react';

export default function LoadingModal({ onComplete }) {
    const [stepIdx, setStepIdx] = useState(0);
    const steps = [
        "Klinik veriler işleniyor...",
        "Anamnez metni analiz ediliyor...",
        "Risk modeli çalıştırılıyor...",
        "Sonuçlar hazırlanıyor..."
    ];
    const progs = [20, 45, 75, 98, 100];

    useEffect(() => {
        let currentIdx = 0;
        const t = setInterval(() => {
            currentIdx++;
            if (currentIdx < steps.length) {
                setStepIdx(currentIdx);
            } else {
                clearInterval(t);
                setStepIdx(steps.length);
                setTimeout(onComplete, 400);
            }
        }, 950);
        return () => clearInterval(t);
    }, [onComplete]);

    return (
        <div className="modal-bg on">
            <div className="ld-modal">
                <div className="ld-spin">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                </div>
                <div className="ld-title">Analiz Çalıştırılıyor</div>
                <div className="ld-step">{steps[stepIdx] || steps[steps.length - 1]}</div>
                <div className="ld-prog"><div className="ld-fill" style={{ width: `${progs[stepIdx] || 100}%` }}></div></div>
                <div className="ld-dots">
                    <div className={`ld-dot ${stepIdx === 0 ? 'on' : ''}`}></div>
                    <div className={`ld-dot ${stepIdx === 1 ? 'on' : ''}`}></div>
                    <div className={`ld-dot ${stepIdx === 2 ? 'on' : ''}`}></div>
                    <div className={`ld-dot ${stepIdx >= 3 ? 'on' : ''}`}></div>
                </div>
            </div>
        </div>
    );
}
