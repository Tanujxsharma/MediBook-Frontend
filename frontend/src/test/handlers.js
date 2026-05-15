import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// ─── Mock Data Factories ──────────────────────────────────────────────────────

export const mockProvider = (overrides = {}) => ({
  id: 1,
  name: 'John Smith',
  specialization: 'Cardiologist',
  clinicName: 'HeartCare Clinic',
  bio: 'Experienced cardiologist',
  qualification: 'MBBS, MD',
  experienceYears: 10,
  minimumFees: 500,
  available: true,
  verified: true,
  email: 'doctor@example.com',
  ...overrides,
});

export const mockSlot = (overrides = {}) => ({
  id: 101,
  providerId: 1,
  startTime: '2099-12-01T09:00:00',
  endTime: '2099-12-01T09:30:00',
  booked: false,
  isBooked: false,
  ...overrides,
});

export const mockAppointment = (overrides = {}) => ({
  id: 201,
  patientName: 'Jane Doe',
  providerName: 'Dr. John Smith',
  slotStartTime: '2099-12-01T09:00:00',
  slotEndTime: '2099-12-01T09:30:00',
  notes: 'Routine check-up',
  status: 'CONFIRMED',
  slotId: 101,
  providerId: 1,
  ...overrides,
});

export const mockPatient = (overrides = {}) => ({
  id: 301,
  name: 'Jane Doe',
  email: 'patient@example.com',
  provider: 'LOCAL',
  ...overrides,
});

// ─── Token helpers ────────────────────────────────────────────────────────────

/**
 * Build a fake JWT (not cryptographically signed — fine for unit tests).
 * The payload is base64url-encoded so auth.js can decode it.
 */
export const makeFakeToken = (payload = {}) => {
  const encode = (obj) =>
    btoa(JSON.stringify(obj))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const body = encode({ sub: 'user@example.com', email: 'user@example.com', role: 'PATIENT', ...payload });
  return `${header}.${body}.fakesignature`;
};

// ─── MSW Handlers ────────────────────────────────────────────────────────────

const BASE = 'http://localhost:8080';

export const handlers = [
  // Public providers & slots
  http.get(`${BASE}/providers`, () =>
    HttpResponse.json([mockProvider()])
  ),
  http.get(`${BASE}/slots/public`, () =>
    HttpResponse.json([mockSlot()])
  ),
  http.get(`${BASE}/providers/search`, ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword') || '';
    return HttpResponse.json(
      keyword ? [mockProvider({ name: `Dr. ${keyword}` })] : []
    );
  }),

  // Auth
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = await request.json();
    if (body.email === 'bad@example.com') {
      return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    const role = body.email.startsWith('doctor') ? 'DOCTOR'
      : body.email.startsWith('admin') ? 'ADMIN' : 'PATIENT';
    return HttpResponse.json({ token: makeFakeToken({ role, email: body.email }) });
  }),
  http.post(`${BASE}/auth/signup`, async ({ request }) => {
    const body = await request.json();
    if (body.email === 'existing@example.com') {
      return HttpResponse.json({ message: 'Email already in use' }, { status: 409 });
    }
    return HttpResponse.json({ message: 'User created' }, { status: 201 });
  }),

  // Doctor endpoints
  http.get(`${BASE}/providers/me`, () =>
    HttpResponse.json(mockProvider())
  ),
  http.put(`${BASE}/providers/me`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...mockProvider(), ...body });
  }),
  http.put(`${BASE}/providers/me/availability`, ({ request }) => {
    const url = new URL(request.url);
    const available = url.searchParams.get('available') === 'true';
    return HttpResponse.json({ ...mockProvider(), available });
  }),
  http.get(`${BASE}/slots/my`, () =>
    HttpResponse.json([mockSlot()])
  ),
  http.post(`${BASE}/slots`, () =>
    HttpResponse.json(mockSlot({ id: 999 }), { status: 201 })
  ),
  http.delete(`${BASE}/slots/:id`, () =>
    new HttpResponse(null, { status: 204 })
  ),
  http.get(`${BASE}/appointments/provider`, () =>
    HttpResponse.json([mockAppointment()])
  ),

  // Patient endpoints
  http.get(`${BASE}/appointments/patient`, () =>
    HttpResponse.json([mockAppointment()])
  ),
  http.get(`${BASE}/appointments/my`, () =>
    HttpResponse.json([mockAppointment()])
  ),
  http.get(`${BASE}/users/me`, () =>
    HttpResponse.json({ id: 301, name: 'Jane Doe', email: 'patient@example.com' })
  ),
  http.put(`${BASE}/users/me`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 301, name: body.name || 'Jane Doe', email: body.email || 'patient@example.com' });
  }),
  http.post(`${BASE}/appointments`, () =>
    HttpResponse.json(mockAppointment({ id: 999 }), { status: 201 })
  ),
  http.post(`${BASE}/appointments/book/:slotId`, () =>
    HttpResponse.json(mockAppointment({ id: 999 }), { status: 201 })
  ),
  http.put(`${BASE}/appointments/:id/cancel`, () =>
    HttpResponse.json({ ...mockAppointment(), status: 'CANCELLED' })
  ),
  http.delete(`${BASE}/appointments/:id`, () =>
    new HttpResponse(null, { status: 204 })
  ),
  http.get(`${BASE}/payments/patient`, () =>
    HttpResponse.json([])
  ),
  http.post(`${BASE}/payments/process`, () =>
    HttpResponse.json({ id: 1, status: 'SUCCESS', amount: 500 })
  ),

  // Admin endpoints
  http.get(`${BASE}/providers/admin/all`, () =>
    HttpResponse.json([mockProvider(), mockProvider({ id: 2, name: 'Alice Green', verified: false })])
  ),
  http.get(`${BASE}/users/admin/patients`, () =>
    HttpResponse.json([mockPatient()])
  ),
  http.put(`${BASE}/providers/:id/verify`, () =>
    HttpResponse.json({ ...mockProvider(), verified: true })
  ),
  http.put(`${BASE}/providers/:id/unverify`, () =>
    HttpResponse.json({ ...mockProvider(), verified: false })
  ),
];

export const server = setupServer(...handlers);
