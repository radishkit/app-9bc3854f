import { View } from '../App';
import { Permit, fmtDate, venueLabel, eventTypeLabel } from '../data';

export function Confirmation({ permit, go }: { permit: Permit; go: (v: View) => void }) {
  return (
    <main className="container container--narrow">
      <div className="confirm">
        <div className="confirm__check" aria-hidden>✓</div>
        <h1>Application received!</h1>
        <p className="confirm__lede">
          Thanks — <strong>{permit.app.eventName}</strong> has been submitted to the City of Null
          Island Office of Special Events.
        </p>

        <div className="confirm__number">
          <span>Your application number</span>
          <strong>{permit.id}</strong>
        </div>

        <div className="confirm__summary">
          <div>
            <span>Event type</span>
            <strong>{eventTypeLabel(permit.app.eventTypeId)}</strong>
          </div>
          <div>
            <span>Location</span>
            <strong>{venueLabel(permit.app.venueId)}</strong>
          </div>
          <div>
            <span>Starts</span>
            <strong>{fmtDate(permit.app.startDate)}</strong>
          </div>
          <div>
            <span>Estimated fee</span>
            <strong>${permit.fee.toLocaleString()}</strong>
          </div>
        </div>

        <div className="confirm__next">
          <h3>What happens next</h3>
          <ul>
            <li>
              <strong>Within 1 business day</strong> — an event coordinator is assigned and your
              application moves to <em>Under Review</em>.
            </li>
            <li>
              <strong>5–10 business days</strong> — police, transportation, and sanitation review
              routing, staffing, and site plans.
            </li>
            <li>
              <strong>On approval</strong> — you'll receive the final fee invoice and your permit
              packet by email.
            </li>
          </ul>
        </div>

        <div className="confirm__actions">
          <button
            className="btn btn--primary"
            onClick={() => go({ name: 'status', permitId: permit.id })}
          >
            Track this application
          </button>
          <button className="btn btn--ghost" onClick={() => go({ name: 'applications' })}>
            My applications
          </button>
        </div>
      </div>
    </main>
  );
}
