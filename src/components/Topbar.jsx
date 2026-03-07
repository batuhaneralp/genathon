import React from 'react';

export default function Topbar({ breadcrumbs = [] }) {
    const [time, setTime] = React.useState('09:47');

    React.useEffect(() => {
        const updateTime = () => {
            const d = new Date();
            setTime(d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
        };
        updateTime();
        const t = setInterval(updateTime, 60000);
        return () => clearInterval(t);
    }, []);

    return (
        <div className="topbar">
            <div className="bc">
                {breadcrumbs.map((bc, i) => (
                    <React.Fragment key={i}>
                        <span className={bc.isCurrent ? 'cur' : 'lnk'} onClick={() => bc.action && bc.action()}>
                            {bc.label}
                        </span>
                        {i !== breadcrumbs.length - 1 && <span className="sep">›</span>}
                    </React.Fragment>
                ))}
            </div>
            <div className="tb-right">
                <span className="proto-pill-sm">⚙ Prototip Demo Modu</span>
                <span className="tb-clock">{time}</span>
                <div className="tb-notif">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
                    </svg>
                    <div className="notif-dot"></div>
                </div>
            </div>
        </div>
    );
}
