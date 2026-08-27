// Shared types + seeded data for the Special Events Permit Portal.

export type PermitStatus = 'Submitted' | 'Under Review' | 'Approved';

export interface EventType {
  id: string;
  name: string;
  icon: string;
  blurb: string;
  baseFee: number;
}

export const EVENT_TYPES: EventType[] = [
  { id: 'street-fair', name: 'Street Fair', icon: '🎪', blurb: 'Vendors, booths & food on a closed street', baseFee: 250 },
  { id: 'parade', name: 'Parade / Procession', icon: '🎉', blurb: 'Moving route with street closures', baseFee: 400 },
  { id: 'film', name: 'Film / Photo Shoot', icon: '🎬', blurb: 'Commercial filming on public property', baseFee: 350 },
  { id: 'block-party', name: 'Block Party', icon: '🏘️', blurb: 'Neighborhood gathering, single block', baseFee: 75 },
  { id: 'festival', name: 'Festival / Concert', icon: '🎸', blurb: 'Staged entertainment in a park or plaza', baseFee: 300 },
  { id: 'market', name: 'Outdoor Market', icon: '🥕', blurb: 'Recurring farmers / makers market', baseFee: 150 },
];

export interface Venue {
  id: string;
  name: string;
  blurb: string;
}

export const VENUES: Venue[] = [
  { id: 'meridian-plaza', name: 'Meridian Plaza', blurb: 'Civic heart of downtown · cap 5,000' },
  { id: 'equator-park', name: 'Equator Park', blurb: 'Waterfront lawn & bandshell · cap 8,000' },
  { id: 'harborline-ave', name: 'Harborline Avenue', blurb: 'Closable commercial corridor' },
  { id: 'lighthouse-point', name: 'Lighthouse Point', blurb: 'Scenic overlook · cap 1,200' },
  { id: 'latitude-commons', name: 'Latitude Commons', blurb: 'Neighborhood green · cap 2,000' },
  { id: 'residential', name: 'Residential street (block party)', blurb: 'Your own block — quiet hours apply' },
];

export const ATTENDANCE_TIERS = [
  { id: 'xs', label: 'Under 100', note: 'No site plan required', mult: 1.0 },
  { id: 'sm', label: '100 – 500', note: 'Basic site plan', mult: 1.25 },
  { id: 'md', label: '500 – 2,000', note: 'Site plan + insurance', mult: 1.6 },
  { id: 'lg', label: 'Over 2,000', note: 'Full public-safety plan', mult: 2.0 },
] as const;

export interface Service {
  id: string;
  name: string;
  icon: string;
  note: string;
  perDay: boolean;
  fee: number;
}

export const SERVICES: Service[] = [
  { id: 'police', name: 'Police detail', icon: '👮', note: 'Required over 500 attendees', perDay: true, fee: 320 },
  { id: 'traffic', name: 'Traffic control', icon: '🚧', note: 'Barricades & flaggers', perDay: true, fee: 180 },
  { id: 'sanitation', name: 'Sanitation & recycling', icon: '🗑️', note: 'Bins, pickup & sweep', perDay: true, fee: 120 },
  { id: 'closure', name: 'Street closure', icon: '🛑', note: 'Full closure of the right-of-way', perDay: false, fee: 200 },
  { id: 'noise', name: 'Amplified sound variance', icon: '🔊', note: 'PA / live music after 8pm', perDay: false, fee: 60 },
];

export interface Application {
  eventTypeId: string;
  eventName: string;
  organizer: string;
  email: string;
  phone: string;
  venueId: string;
  startDate: string;
  endDate: string;
  attendanceId: string;
  services: string[];
  description: string;
}

export const EMPTY_APP: Application = {
  eventTypeId: '',
  eventName: '',
  organizer: '',
  email: '',
  phone: '',
  venueId: '',
  startDate: '',
  endDate: '',
  attendanceId: '',
  services: [],
  description: '',
};

export interface Permit {
  id: string; // SE26-00042
  app: Application;
  status: PermitStatus;
  submittedAt: string;
  reviewStartedAt?: string;
  approvedAt?: string;
  fee: number;
}

// ---------------------------------------------------------------------------
// Fee estimate — recomputed live as the wizard changes
// ---------------------------------------------------------------------------

export interface FeeBreakdown {
  base: number;
  baseLabel: string;
  attendanceMult: number;
  days: number;
  serviceLines: { name: string; amount: number; detail: string }[];
  total: number;
}

export function eventDays(app: Application): number {
  if (!app.startDate) return 1;
  const start = new Date(app.startDate + 'T12:00:00');
  const end = new Date((app.endDate || app.startDate) + 'T12:00:00');
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  return Math.max(1, Math.min(diff, 30));
}

export function calcFee(app: Application): FeeBreakdown {
  const type = EVENT_TYPES.find((t) => t.id === app.eventTypeId);
  const tier = ATTENDANCE_TIERS.find((t) => t.id === app.attendanceId);
  const days = eventDays(app);
  const base = type ? type.baseFee : 0;
  const mult = tier ? tier.mult : 1;

  const serviceLines = app.services
    .map((sid) => SERVICES.find((s) => s.id === sid))
    .filter((s): s is Service => !!s)
    .map((s) => ({
      name: s.name,
      amount: s.perDay ? s.fee * days : s.fee,
      detail: s.perDay ? `$${s.fee}/day × ${days} day${days === 1 ? '' : 's'}` : 'flat',
    }));

  const servicesTotal = serviceLines.reduce((sum, l) => sum + l.amount, 0);
  const total = Math.round(base * mult + servicesTotal);

  return {
    base,
    baseLabel: type ? type.name : '—',
    attendanceMult: mult,
    days,
    serviceLines,
    total,
  };
}

// ---------------------------------------------------------------------------
// Seeded upcoming events + permits
// ---------------------------------------------------------------------------

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const daysAgoIso = (n: number, h = 11) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, 12, 0, 0);
  return d.toISOString();
};

export interface UpcomingEvent {
  name: string;
  date: string;
  venue: string;
  type: string;
  icon: string;
}

export const UPCOMING_EVENTS: UpcomingEvent[] = [
  { name: 'Equator Day Parade', date: daysFromNow(16), venue: 'Harborline Avenue', type: 'Parade', icon: '🎉' },
  { name: 'Meridian Night Market', date: daysFromNow(9), venue: 'Meridian Plaza', type: 'Outdoor Market', icon: '🥕' },
  { name: 'Null Point Lighthouse Festival', date: daysFromNow(30), venue: 'Lighthouse Point', type: 'Festival', icon: '🎸' },
  { name: 'Zero Degree Film Days', date: daysFromNow(37), venue: 'Equator Park', type: 'Film Shoot', icon: '🎬' },
  { name: 'Latitude Heights Block Party', date: daysFromNow(10), venue: 'Latitude Commons', type: 'Block Party', icon: '🏘️' },
  { name: 'Prime Meridian Marathon', date: daysFromNow(52), venue: 'Citywide route', type: 'Parade', icon: '🏃' },
];

export const SEED_PERMITS: Permit[] = [
  {
    id: 'SE26-00037',
    status: 'Approved',
    submittedAt: daysAgoIso(30),
    reviewStartedAt: daysAgoIso(28),
    approvedAt: daysAgoIso(21, 16),
    fee: 1685,
    app: {
      eventTypeId: 'street-fair',
      eventName: 'Harborline Harvest Fair',
      organizer: 'Null Island Merchants Alliance',
      email: 'events@nimerchants.org',
      phone: '(555) 010-4471',
      venueId: 'harborline-ave',
      startDate: daysFromNow(23),
      endDate: daysFromNow(24),
      attendanceId: 'md',
      services: ['police', 'traffic', 'sanitation', 'closure'],
      description: 'Two-day autumn street fair with 60 local vendors, food trucks, and a kids zone.',
    },
  },
  {
    id: 'SE26-00041',
    status: 'Under Review',
    submittedAt: daysAgoIso(3),
    reviewStartedAt: daysAgoIso(1, 9),
    fee: 435,
    app: {
      eventTypeId: 'film',
      eventName: 'Compass Rose — Season 2 Exteriors',
      organizer: 'Latitude Pictures LLC',
      email: 'locations@latitudepictures.com',
      phone: '(555) 010-9012',
      venueId: 'lighthouse-point',
      startDate: daysFromNow(12),
      endDate: daysFromNow(12),
      attendanceId: 'xs',
      services: ['traffic'],
      description: 'One-day exterior shoot at the lighthouse; 25-person crew, two equipment trucks.',
    },
  },
];

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const PERMITS_KEY = 'nullisland-events-permits';
export const DRAFT_KEY = 'nullisland-events-draft';

export function loadPermits(): Permit[] {
  try {
    const raw = localStorage.getItem(PERMITS_KEY);
    const mine: Permit[] = raw ? JSON.parse(raw) : [];
    return [...mine, ...SEED_PERMITS];
  } catch {
    return [...SEED_PERMITS];
  }
}

export function savePermit(p: Permit) {
  try {
    const raw = localStorage.getItem(PERMITS_KEY);
    const mine: Permit[] = raw ? JSON.parse(raw) : [];
    mine.unshift(p);
    localStorage.setItem(PERMITS_KEY, JSON.stringify(mine));
  } catch {
    /* noop */
  }
}

export function nextPermitNumber(): string {
  const all = loadPermits();
  const max = all.reduce((m, p) => {
    const n = parseInt(p.id.split('-')[1], 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 41);
  return `SE26-${String(max + 1).padStart(5, '0')}`;
}

export function loadDraft(): { app: Application; step: number } | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDraft(app: Application, step: number) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ app, step }));
  } catch {
    /* noop */
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* noop */
  }
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export function fmtDate(iso?: string): string {
  if (!iso) return '';
  return new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function fmtDateShort(iso?: string): string {
  if (!iso) return '';
  return new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function fmtDateTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ', ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function eventTypeLabel(id: string): string {
  return EVENT_TYPES.find((t) => t.id === id)?.name ?? id;
}

export function venueLabel(id: string): string {
  return VENUES.find((v) => v.id === id)?.name ?? id;
}
