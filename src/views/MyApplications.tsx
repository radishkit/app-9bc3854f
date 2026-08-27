import { View } from '../App';
import { Permit, eventTypeLabel, fmtDate, venueLabel } from '../data';

export function MyApplications({ permits, go }: { permits: Permit[]; go: (v: View) => void }) {
  return (
    <main className="container container--narrow">
      <div className="permits__head">
        <div>
          <h1>My Applications</h1>
          <p className="muted">Event permit applications for your account.</p>
        </div>
        <button className="btn btn--primary" onClick={() => go({ name: 'apply' })}>
          + New application
        </button>
      </div>

      <div className="permitlist">
        {permits.map((p) => (
          <button
            key={p.id}
            className="permitcard"
            onClick={() => go({ name: 'status', permitId: p.id })}
          >
            <div className="permitcard__main">
              <div className="permitcard__id">{p.id}</div>
              <div className="permitcard__biz">{p.app.eventName}</div>
              <div className="permitcard__meta">
                {eventTypeLabel(p.app.eventTypeId)} · {venueLabel(p.app.venueId)} ·{' '}
                {fmtDate(p.app.startDate)}
              </div>
            </div>
            <div className="permitcard__side">
              <span className={`badge badge--${p.status.replace(/\s/g, '').toLowerCase()}`}>
                {p.status}
              </span>
              <span className="permitcard__go" aria-hidden>→</span>
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}
