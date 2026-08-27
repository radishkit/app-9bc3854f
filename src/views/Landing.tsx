import { View } from '../App';
import { UPCOMING_EVENTS, fmtDateShort } from '../data';

export function Landing({ go }: { go: (v: View) => void }) {
  return (
    <>
      <header className="hero">
        <div className="hero__inner">
          <div className="hero__eyebrow">City of Null Island · Office of Special Events</div>
          <h1>
            Bring your event <span className="hero__hl">to the streets.</span>
          </h1>
          <p className="hero__lede">
            Street fairs, parades, film shoots, block parties — apply for a special event permit
            online and get a live fee estimate before you submit.
          </p>
          <div className="hero__actions">
            <button className="btn btn--primary btn--lg" onClick={() => go({ name: 'apply' })}>
              Plan an event
            </button>
            <button className="btn btn--ghost btn--lg" onClick={() => go({ name: 'applications' })}>
              My applications
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        <section className="upcoming">
          <div className="upcoming__head">
            <h2>Happening soon on Null Island</h2>
            <p className="muted">Permitted events open to everyone — come say hi.</p>
          </div>
          <div className="eventgrid">
            {UPCOMING_EVENTS.map((ev) => (
              <div className="eventcard" key={ev.name}>
                <div className="eventcard__icon" aria-hidden>{ev.icon}</div>
                <div className="eventcard__date">{fmtDateShort(ev.date)}</div>
                <div className="eventcard__name">{ev.name}</div>
                <div className="eventcard__meta">
                  {ev.venue} · {ev.type}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="cardgrid">
          <div className="infocard">
            <div className="infocard__icon" aria-hidden>🗓️</div>
            <h3>Apply 30+ days ahead</h3>
            <p>
              Most events need at least 30 days of lead time — 60 for parades and anything over
              2,000 attendees.
            </p>
          </div>
          <div className="infocard">
            <div className="infocard__icon" aria-hidden>🧮</div>
            <h3>Know your fee up front</h3>
            <p>
              The application shows a running fee estimate as you choose your event type, dates,
              crowd size, and city services.
            </p>
          </div>
          <div className="infocard">
            <div className="infocard__icon" aria-hidden>🤝</div>
            <h3>One application, every department</h3>
            <p>
              We route your application to police, transportation, and sanitation for you — track
              it all in one place.
            </p>
          </div>
        </section>

        <div className="steps__cta">
          <button className="btn btn--primary btn--lg" onClick={() => go({ name: 'apply' })}>
            Start your application
          </button>
        </div>
      </main>
    </>
  );
}
