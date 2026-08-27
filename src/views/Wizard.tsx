import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { View } from '../App';
import {
  ATTENDANCE_TIERS,
  Application,
  EMPTY_APP,
  EVENT_TYPES,
  Permit,
  SERVICES,
  VENUES,
  calcFee,
  clearDraft,
  eventDays,
  fmtDate,
  loadDraft,
  nextPermitNumber,
  saveDraft,
  savePermit,
  venueLabel,
} from '../data';

const STEPS = ['Event type', 'When & where', 'Attendance', 'City services', 'Review'];

export function Wizard({
  go,
  onSubmitted,
}: {
  go: (v: View) => void;
  onSubmitted: () => void;
}) {
  const draft = useMemo(loadDraft, []);
  const [step, setStep] = useState(draft?.step ?? 0);
  const [app, setApp] = useState<Application>(draft?.app ?? EMPTY_APP);
  const [tried, setTried] = useState(false);
  const [certified, setCertified] = useState(false);

  useEffect(() => {
    saveDraft(app, step);
  }, [app, step]);

  const set = (k: keyof Application) => (v: string) => setApp((a) => ({ ...a, [k]: v }));
  const fee = calcFee(app);
  const errs = validate(app, step);

  const next = () => {
    setTried(true);
    if (errs.length === 0) {
      setTried(false);
      setStep((s) => Math.min(s + 1, 4));
      window.scrollTo({ top: 0 });
    }
  };
  const back = () => {
    setTried(false);
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0 });
  };

  const submit = () => {
    setTried(true);
    if (!certified) return;
    const permit: Permit = {
      id: nextPermitNumber(),
      app,
      status: 'Submitted',
      submittedAt: new Date().toISOString(),
      fee: fee.total,
    };
    savePermit(permit);
    clearDraft();
    onSubmitted();
    go({ name: 'confirmation', permit });
  };

  return (
    <main className="container container--narrow">
      <div className="wizard__head">
        <h1>Special Event Permit Application</h1>
        <p className="muted">Your progress is saved automatically.</p>
      </div>

      <ol className="progress">
        {STEPS.map((label, i) => (
          <li key={label} className={i === step ? 'is-current' : i < step ? 'is-done' : ''}>
            <button type="button" disabled={i > step} onClick={() => i < step && setStep(i)}>
              <span className="progress__dot">{i < step ? '✓' : i + 1}</span>
              <span className="progress__label">{label}</span>
            </button>
          </li>
        ))}
      </ol>

      {app.eventTypeId && step > 0 && step < 4 && (
        <div className="feebar">
          <span>
            Estimated fee so far — updates as you choose options
          </span>
          <strong>${fee.total.toLocaleString()}</strong>
        </div>
      )}

      <section className="panel">
        {step === 0 && (
          <div className="formgrid">
            <h2>What kind of event?</h2>
            <div className="zonegrid zonegrid--events">
              {EVENT_TYPES.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  className={'zonecard' + (app.eventTypeId === t.id ? ' is-selected' : '')}
                  aria-pressed={app.eventTypeId === t.id}
                  onClick={() => set('eventTypeId')(t.id)}
                >
                  <span className="zonecard__icon" aria-hidden>{t.icon}</span>
                  <span className="zonecard__name">{t.name}</span>
                  <span className="zonecard__blurb">{t.blurb}</span>
                  <span className="zonecard__mult">from ${t.baseFee}</span>
                </button>
              ))}
            </div>
            {tried && !app.eventTypeId && (
              <p className="field__errtext-standalone">Pick an event type to continue.</p>
            )}
            <Field label="Event name" required error={tried && !app.eventName.trim()}>
              <input
                value={app.eventName}
                onChange={(e) => set('eventName')(e.target.value)}
                placeholder="e.g. Equator Day Parade"
              />
            </Field>
            <div className="formgrid__row">
              <Field label="Organizer / organization" required error={tried && !app.organizer.trim()}>
                <input
                  value={app.organizer}
                  onChange={(e) => set('organizer')(e.target.value)}
                  placeholder="Who's putting this on?"
                />
              </Field>
              <Field
                label="Email"
                required
                error={tried && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(app.email)}
                errorText="Enter a valid email"
              >
                <input
                  type="email"
                  value={app.email}
                  onChange={(e) => set('email')(e.target.value)}
                  placeholder="you@example.com"
                />
              </Field>
            </div>
            <Field
              label="Phone"
              required
              error={tried && app.phone.replace(/\D/g, '').length < 10}
              errorText="Enter a 10-digit phone number"
            >
              <input
                value={app.phone}
                onChange={(e) => set('phone')(e.target.value)}
                placeholder="(555) 010-1234"
              />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="formgrid">
            <h2>When & where</h2>
            <div>
              <div className={'field__label' + (tried && !app.venueId ? ' field__label--error' : '')}>
                Location <span className="req">*</span>
                {tried && !app.venueId && <em className="field__errtext"> — pick a location</em>}
              </div>
              <div className="zonegrid">
                {VENUES.map((v) => (
                  <button
                    type="button"
                    key={v.id}
                    className={'zonecard' + (app.venueId === v.id ? ' is-selected' : '')}
                    aria-pressed={app.venueId === v.id}
                    onClick={() => set('venueId')(v.id)}
                  >
                    <span className="zonecard__name">{v.name}</span>
                    <span className="zonecard__blurb">{v.blurb}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="formgrid__row">
              <Field label="Start date" required error={tried && !app.startDate}>
                <input
                  type="date"
                  value={app.startDate}
                  onChange={(e) => set('startDate')(e.target.value)}
                />
              </Field>
              <Field
                label="End date (same day if blank)"
                error={tried && !!app.endDate && app.endDate < app.startDate}
                errorText="End can't be before start"
              >
                <input
                  type="date"
                  value={app.endDate}
                  onChange={(e) => set('endDate')(e.target.value)}
                />
              </Field>
            </div>
            <Field label="Tell us about the event" required error={tried && app.description.trim().length < 10} errorText="A sentence or two helps reviewers">
              <textarea
                rows={3}
                value={app.description}
                onChange={(e) => set('description')(e.target.value)}
                placeholder="What's happening, roughly how it's laid out, anything unusual…"
              />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="formgrid">
            <h2>How many people?</h2>
            <p className="muted">Expected peak attendance sets the review level and fee factor.</p>
            <div className="tiergrid">
              {ATTENDANCE_TIERS.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  className={'tiercard' + (app.attendanceId === t.id ? ' is-selected' : '')}
                  aria-pressed={app.attendanceId === t.id}
                  onClick={() => set('attendanceId')(t.id)}
                >
                  <span className="tiercard__label">{t.label}</span>
                  <span className="tiercard__note">{t.note}</span>
                  <span className="tiercard__mult">fee ×{t.mult.toFixed(2)}</span>
                </button>
              ))}
            </div>
            {tried && !app.attendanceId && (
              <p className="field__errtext-standalone">Pick an attendance range to continue.</p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="formgrid">
            <h2>City services</h2>
            <p className="muted">
              Toggle what you need — the estimate updates instantly. Our team confirms final
              staffing during review.
            </p>
            <div className="servicelist">
              {SERVICES.map((s) => {
                const on = app.services.includes(s.id);
                const days = eventDays(app);
                return (
                  <button
                    type="button"
                    key={s.id}
                    className={'servicerow' + (on ? ' is-on' : '')}
                    aria-pressed={on}
                    onClick={() =>
                      setApp((a) => ({
                        ...a,
                        services: on ? a.services.filter((x) => x !== s.id) : [...a.services, s.id],
                      }))
                    }
                  >
                    <span className="servicerow__icon" aria-hidden>{s.icon}</span>
                    <span className="servicerow__body">
                      <strong>{s.name}</strong>
                      <em>{s.note}</em>
                    </span>
                    <span className="servicerow__fee">
                      {s.perDay ? `$${s.fee}/day` : `$${s.fee}`}
                      {s.perDay && days > 1 && <em> × {days}d</em>}
                    </span>
                    <span className="servicerow__toggle" aria-hidden>{on ? '✓' : '+'}</span>
                  </button>
                );
              })}
            </div>
            <p className="muted">No services needed? Just continue — they're optional.</p>
          </div>
        )}

        {step === 4 && (
          <div className="review">
            <h2>Review your application</h2>
            <ReviewSection title="Event" onEdit={() => setStep(0)}>
              <Row k="Event" v={`${app.eventName} · ${fee.baseLabel}`} />
              <Row k="Organizer" v={`${app.organizer} · ${app.email} · ${app.phone}`} />
            </ReviewSection>
            <ReviewSection title="When & where" onEdit={() => setStep(1)}>
              <Row k="Location" v={venueLabel(app.venueId)} />
              <Row
                k="Dates"
                v={
                  fmtDate(app.startDate) +
                  (app.endDate && app.endDate !== app.startDate ? ` – ${fmtDate(app.endDate)}` : '') +
                  ` (${fee.days} day${fee.days === 1 ? '' : 's'})`
                }
              />
              <Row k="Description" v={app.description} />
            </ReviewSection>
            <ReviewSection title="Attendance & services" onEdit={() => setStep(2)}>
              <Row
                k="Attendance"
                v={ATTENDANCE_TIERS.find((t) => t.id === app.attendanceId)?.label ?? '—'}
              />
              <Row
                k="Services"
                v={
                  app.services.length
                    ? app.services
                        .map((sid) => SERVICES.find((s) => s.id === sid)?.name)
                        .filter(Boolean)
                        .join(', ')
                    : 'None requested'
                }
              />
            </ReviewSection>

            <div className="feebox feebox--detailed">
              <div className="feebox__lines">
                <div className="feebox__line">
                  <span>
                    {fee.baseLabel} base × {fee.attendanceMult.toFixed(2)} attendance factor
                  </span>
                  <span>${Math.round(fee.base * fee.attendanceMult).toLocaleString()}</span>
                </div>
                {fee.serviceLines.map((l) => (
                  <div className="feebox__line" key={l.name}>
                    <span>
                      {l.name} <em className="muted">({l.detail})</em>
                    </span>
                    <span>${l.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="feebox__line feebox__line--total">
                  <span>Estimated total (due after approval)</span>
                  <span>${fee.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <label className={'certify' + (tried && !certified ? ' certify--error' : '')}>
              <input
                type="checkbox"
                checked={certified}
                onChange={(e) => setCertified(e.target.checked)}
              />
              <span>
                I certify the information above is accurate and I'm authorized to apply on behalf
                of this organization.
              </span>
            </label>
          </div>
        )}

        <div className="panel__actions">
          {step > 0 ? (
            <button className="btn btn--ghost" onClick={back}>
              ← Back
            </button>
          ) : (
            <button className="btn btn--ghost" onClick={() => go({ name: 'landing' })}>
              Cancel
            </button>
          )}
          {step < 4 ? (
            <button className="btn btn--primary" onClick={next}>
              Continue →
            </button>
          ) : (
            <button className="btn btn--primary btn--lg" onClick={submit}>
              Submit application
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

function validate(app: Application, step: number): string[] {
  const errs: string[] = [];
  if (step === 0) {
    if (!app.eventTypeId) errs.push('eventTypeId');
    if (!app.eventName.trim()) errs.push('eventName');
    if (!app.organizer.trim()) errs.push('organizer');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(app.email)) errs.push('email');
    if (app.phone.replace(/\D/g, '').length < 10) errs.push('phone');
  }
  if (step === 1) {
    if (!app.venueId) errs.push('venueId');
    if (!app.startDate) errs.push('startDate');
    if (app.endDate && app.endDate < app.startDate) errs.push('endDate');
    if (app.description.trim().length < 10) errs.push('description');
  }
  if (step === 2) {
    if (!app.attendanceId) errs.push('attendanceId');
  }
  return errs;
}

function Field({
  label,
  required,
  error,
  errorText,
  children,
}: {
  label: string;
  required?: boolean;
  error?: boolean;
  errorText?: string;
  children: ReactNode;
}) {
  return (
    <label className={'field' + (error ? ' field--error' : '')}>
      <span className="field__label">
        {label} {required && <span className="req">*</span>}
        {error && <em className="field__errtext"> — {errorText ?? 'required'}</em>}
      </span>
      {children}
    </label>
  );
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <div className="review__section">
      <div className="review__head">
        <h3>{title}</h3>
        <button className="linkbtn" onClick={onEdit}>
          Edit
        </button>
      </div>
      <dl>{children}</dl>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="review__row">
      <dt>{k}</dt>
      <dd>{v || '—'}</dd>
    </div>
  );
}
