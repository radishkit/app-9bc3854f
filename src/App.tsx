import { useState, useCallback } from 'react';
import { Landing } from './views/Landing';
import { Wizard } from './views/Wizard';
import { Confirmation } from './views/Confirmation';
import { MyApplications } from './views/MyApplications';
import { StatusTracker } from './views/StatusTracker';
import { Permit, loadPermits } from './data';

export type View =
  | { name: 'landing' }
  | { name: 'apply' }
  | { name: 'confirmation'; permit: Permit }
  | { name: 'applications' }
  | { name: 'status'; permitId: string };

export default function App() {
  const [view, setView] = useState<View>({ name: 'landing' });
  const [permits, setPermits] = useState<Permit[]>(() => loadPermits());

  const refresh = useCallback(() => setPermits(loadPermits()), []);

  const go = useCallback((v: View) => {
    setView(v);
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="portal">
      <nav className="topnav">
        <button className="topnav__brand" onClick={() => go({ name: 'landing' })}>
          <span className="topnav__seal" aria-hidden>◎</span>
          <span>
            <strong>City of Null Island</strong>
            <em>Special Event Permits</em>
          </span>
        </button>
        <div className="topnav__links">
          <button
            className={view.name === 'landing' ? 'is-active' : ''}
            onClick={() => go({ name: 'landing' })}
          >
            Home
          </button>
          <button
            className={view.name === 'apply' ? 'is-active' : ''}
            onClick={() => go({ name: 'apply' })}
          >
            Apply
          </button>
          <button
            className={view.name === 'applications' || view.name === 'status' ? 'is-active' : ''}
            onClick={() => go({ name: 'applications' })}
          >
            My Applications
          </button>
        </div>
      </nav>

      {view.name === 'landing' && <Landing go={go} />}
      {view.name === 'apply' && <Wizard go={go} onSubmitted={refresh} />}
      {view.name === 'confirmation' && <Confirmation permit={view.permit} go={go} />}
      {view.name === 'applications' && <MyApplications permits={permits} go={go} />}
      {view.name === 'status' && (
        <StatusTracker
          permit={permits.find((p) => p.id === view.permitId) ?? permits[0]}
          go={go}
        />
      )}

      <footer className="footer">
        <div>
          <strong>City of Null Island</strong> · Office of Special Events & Film
        </div>
        <div className="footer__muted">
          0° 0′ N, 0° 0′ E · Open Mon–Fri, 8am–5pm · (555) 010-0042 · events@nullisland.gov
        </div>
      </footer>
    </div>
  );
}
