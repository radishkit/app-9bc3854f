import { View } from '../App';
import { ATTENDANCE_TIERS, Permit, SERVICES, eventTypeLabel, fmtDate, fmtDateTime, venueLabel } from '../data';

const STAGES = ['Submitted', 'Under Review', 'Approved'] as const;

function addBusinessDays(iso: string, n: number): Date {
  const d = new Date(iso);
  let added = 0;
  while (added < n) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d;
}

export function StatusTracker({ permit, go }: { permit: Permit; go: (v: View) => void }) {
  const idx = STAGES.indexOf(permit.status);
  const expectedReview = addBusinessDays(permit.submittedAt, 1);
  const expectedDecision = addBusinessDays(permit.submittedAt, 10);

  const stages = [
    {
      name: 'Submitted',
      done: true,
      stamp: fmtDateTime(permit.submittedAt),
      note: `Application ${permit.id} received online.`,
    },
    {
      name: 'Under Review',
      done: idx >= 1,
      stamp:
        idx >= 1
          ? fmtDateTime(permit.reviewStartedAt) || 'In progress'
          : `Expected by ${fmtDateTime(expectedReview.toISOString())}`,
      note:
        idx >= 1
          ? 'Police, transportation, and sanitation are reviewing routing, staffing, and site plans.'
          : 'Waiting for an event coordinator to be assigned.',
    },
    {
      name: 'Approved',
      done: idx >= 2,
      stamp:
        idx >= 2
          ? fmtDateTime(permit.approvedAt)
          : `Decision expected by ${fmtDate(expectedDecision.toISOString().slice(0, 10))}`,
      note:
        idx >= 2
          ? `Approved — final invoice for $${permit.fee.toLocaleString()} and permit packet sent to ${permit.app.email}.`
          : 'You will be emailed the moment a decision is made.',
    },
  ];

  const services = permit.app.services
    .map((sid) => SERVICES.find((s) => s.id === sid)?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <main className="container container--narrow">
      <button className="linkbtn" onClick={() => go({ name: 'applications' })}>
        ← Back to My Applications
      </button>

      <div className="tracker__head">
        <div>
          <h1>{permit.app.eventName}</h1>
          <p className="muted">
            {permit.id} · {eventTypeLabel(permit.app.eventTypeId)} · {venueLabel(permit.app.venueId)}
          </p>
        </div>
        <span className={`badge badge--${permit.status.replace(/\s/g, '').toLowerCase()}`}>
          {permit.status}
        </span>
      </div>

      <section className="panel">
        <ol className="timeline">
          {stages.map((s) => (
            <li key={s.name} className={s.done ? 'is-done' : ''}>
              <span className="timeline__dot">{s.done ? '✓' : ''}</span>
              <div className="timeline__body">
                <div className="timeline__title">
                  <strong>{s.name}</strong>
                  <span className="timeline__stamp">{s.stamp}</span>
                </div>
                <p>{s.note}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel">
        <h3 className="panel__title">Application details</h3>
        <dl className="detailgrid">
          <div><dt>Organizer</dt><dd>{permit.app.organizer}</dd></div>
          <div><dt>Contact</dt><dd>{permit.app.email} · {permit.app.phone}</dd></div>
          <div>
            <dt>Dates</dt>
            <dd>
              {fmtDate(permit.app.startDate)}
              {permit.app.endDate && permit.app.endDate !== permit.app.startDate
                ? ` – ${fmtDate(permit.app.endDate)}`
                : ''}
            </dd>
          </div>
          <div>
            <dt>Attendance</dt>
            <dd>{ATTENDANCE_TIERS.find((t) => t.id === permit.app.attendanceId)?.label ?? '—'}</dd>
          </div>
          <div><dt>City services</dt><dd>{services || 'None requested'}</dd></div>
          <div>
            <dt>Estimated fee</dt>
            <dd>
              ${permit.fee.toLocaleString()}
              {permit.status === 'Approved' ? ' (invoiced)' : ' (due after approval)'}
            </dd>
          </div>
        </dl>
        {permit.app.description && (
          <p className="muted" style={{ marginTop: 12 }}>
            “{permit.app.description}”
          </p>
        )}
      </section>

      <p className="muted center">
        Questions? Call (555) 010-0042 and reference {permit.id}.
      </p>
    </main>
  );
}
