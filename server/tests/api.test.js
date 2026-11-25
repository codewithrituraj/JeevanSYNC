import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import http from 'http';

let server;
let baseUrl;

test.before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}/api/v1`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('1. Health Check Endpoint returns 200 and healthy status', async () => {
  const res = await fetch(`${baseUrl.replace('/api/v1', '')}/health`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.status, 'healthy');
});

test('2. Auth: Login with seeded doctor credentials', async () => {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: '9876543213',
      password: 'Password@123',
    }),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.user.role, 'DOCTOR');
  assert.ok(body.data.accessToken);
});

test('3. Auth: Register new patient and verify JWT', async () => {
  const testPhone = `99${Math.floor(10000000 + Math.random() * 90000000)}`;
  const res = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Integration Test User',
      phone: testPhone,
      email: `test.${Date.now()}@example.com`,
      password: 'Password@123',
      role: 'PATIENT',
    }),
  });
  const body = await res.json();
  assert.equal(res.status, 201);
  assert.equal(body.success, true);
  assert.equal(body.data.user.phone, testPhone);
  assert.ok(body.data.accessToken);
});

test('4. Reception: List hospitals and search doctors', async () => {
  const resHospitals = await fetch(`${baseUrl}/reception/hospitals`);
  const bodyHospitals = await resHospitals.json();
  assert.equal(resHospitals.status, 200);
  assert.ok(bodyHospitals.data.length > 0);

  const resDoctors = await fetch(`${baseUrl}/reception/doctors?specialty=Cardiology`);
  const bodyDoctors = await resDoctors.json();
  assert.equal(resDoctors.status, 200);
  assert.ok(bodyDoctors.data.length > 0);
  assert.equal(bodyDoctors.data[0].specialty, 'Cardiology');
});

test('5. Blood Bank: Query real-time availability', async () => {
  const res = await fetch(`${baseUrl}/bloodbank/availability?bloodGroup=O_POS`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(body.data.length > 0);
  assert.equal(body.data[0].bloodGroup, 'O_POS');
});

test('6. Diagnostics: Search tests and compare lab pricing', async () => {
  const res = await fetch(`${baseUrl}/diagnostics/search?query=Lipid`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(body.data.length > 0);
  assert.ok(body.data[0].testName.includes('Lipid'));

  const resCompare = await fetch(`${baseUrl}/diagnostics/compare?name=CBC`);
  const bodyCompare = await resCompare.json();
  assert.equal(resCompare.status, 200);
  assert.ok(bodyCompare.data.length > 0);
});

test('7. Emergency Coordination: Request Emergency Ambulance', async () => {
  const res = await fetch(`${baseUrl}/coordination/ambulance/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientName: 'Emergency Case Test',
      patientPhone: '9876500000',
      pickupLatitude: 28.5355,
      pickupLongitude: 77.2090,
      pickupAddress: 'Block C, Green Park, New Delhi',
      urgencyLevel: 'CRITICAL',
      notes: 'Chest pain with breathlessness',
    }),
  });
  const body = await res.json();
  assert.equal(res.status, 201);
  assert.equal(body.success, true);
  assert.equal(body.data.status, 'REQUESTED');
  assert.ok(body.data.hospital);
});

test('8. Bed Availability: Fetch live bed status across hospitals', async () => {
  const res = await fetch(`${baseUrl}/coordination/beds`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(body.data.length > 0);
  assert.ok(body.data[0].availableBeds >= 0);
});

test('9. Inventory: Search medicine & verify out-of-stock alternative recommendation', async () => {
  const res = await fetch(`${baseUrl}/inventory/search?query=Dolo`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(body.data.length > 0);
  const dolo = body.data[0];
  assert.equal(dolo.isOutOfStock, true);
  assert.ok(dolo.suggestedAlternatives.length > 0);
});

test('10. Insurance: Check cashless coverage', async () => {
  const res = await fetch(`${baseUrl}/insurance/check?isCashless=true`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(body.data.length > 0);
  assert.equal(body.data[0].isCashless, true);
});

test('11. MonikaCare AI: Triage response with emergency detection', async () => {
  const res = await fetch(`${baseUrl}/monika-ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: `test-session-${Date.now()}`,
      prompt: 'I have severe sudden chest pain radiating down my left arm and I am sweating heavily.',
    }),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.triageResult.urgency, 'EMERGENCY');
  assert.ok(body.data.triageResult.disclaimer);
});

test('12. WhatsApp Bot: Simulate incoming message and verify webhook response', async () => {
  const res = await fetch(`${baseUrl}/whatsapp/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: '9811223344',
      text: 'hi',
    }),
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
});
