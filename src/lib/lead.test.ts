import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LeadSubmissionError,
  normalizePhone,
  parseAmount,
  resolveLeadConfig,
  submitLead,
  validateContact,
  validateDetails,
  type LeadDraft,
} from './lead.ts';

const validDraft: LeadDraft = {
  service: 'personal',
  amount: '750 000',
  term: '36',
  comment: 'Хочу обсудить варианты',
  name: 'Анна Петрова',
  phone: '8 (999) 123-45-67',
  communication: 'phone',
  consent: true,
};

const liveConfig = resolveLeadConfig({
  endpoint: '/api/leads',
  privacyPolicyVersion: '2026-10-26',
  privacyPolicyUrl: '/privacy',
});

test('amount validation rejects zero, overflow, fractions, exponent notation and embedded text', () => {
  for (const value of ['', '0', '-1', '1000000001', '1.5', '1e6', '500 руб.', 'Infinity']) {
    assert.equal(parseAmount(value), null, value);
  }
  assert.equal(parseAmount('750 000'), 750000);
  assert.equal(parseAmount('1\u00a0000\u00a0000'), 1000000);
  assert.equal(parseAmount('1000000000'), 1000000000);
});

test('details validation catches invalid service, unsupported term and oversized comment', () => {
  assert.deepEqual(validateDetails(validDraft), {});
  const errors = validateDetails({ ...validDraft, service: 'other', amount: '0', term: '17', comment: 'x'.repeat(1001) });
  assert.ok(errors.service);
  assert.ok(errors.amount);
  assert.ok(errors.term);
  assert.ok(errors.comment);
});

test('phone normalization accepts Russian and international formats without accepting letters', () => {
  assert.equal(normalizePhone('8 (999) 123-45-67'), '+79991234567');
  assert.equal(normalizePhone('9991234567'), '+79991234567');
  assert.equal(normalizePhone('+44 7700 900123'), '+447700900123');
  assert.equal(normalizePhone('+7 999 CALL 123'), null);
  assert.equal(normalizePhone('123'), null);
  assert.equal(normalizePhone('+00000000000'), null);
});

test('contact validation requires a name, valid number, channel and explicit consent', () => {
  assert.deepEqual(validateContact(validDraft), {});
  const errors = validateContact({ ...validDraft, name: '1', phone: '123', communication: 'email', consent: false });
  assert.ok(errors.name);
  assert.ok(errors.phone);
  assert.ok(errors.communication);
  assert.ok(errors.consent);
});

test('live mode requires a same-origin API path and both privacy settings', () => {
  assert.equal(resolveLeadConfig({}).mode, 'demo');
  assert.equal(liveConfig.mode, 'live');
  for (const endpoint of ['https://other.example/api/leads', '//other.example/api/leads', '/api/../leads', '/api/%2e%2e/leads', '/api/leads#x', '/api\\leads']) {
    assert.equal(resolveLeadConfig({ endpoint, privacyPolicyVersion: 'v1', privacyPolicyUrl: '/privacy' }).mode, 'unavailable', endpoint);
  }
  assert.equal(resolveLeadConfig({ endpoint: '/api/leads' }).mode, 'unavailable');
  assert.equal(resolveLeadConfig({ endpoint: '/api/leads', privacyPolicyVersion: 'v1', privacyPolicyUrl: 'javascript:alert(1)' }).mode, 'unavailable');
});

test('demo validates locally without making a request', async () => {
  let calls = 0;
  const result = await submitLead(validDraft, { mode: 'demo' }, {
    fetcher: async () => { calls++; throw new Error('network must remain unused'); },
  });
  assert.deepEqual(result, { status: 'demo' });
  assert.equal(calls, 0);
});

test('invalid data and unavailable configuration cannot reach the endpoint', async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => { calls++; return new Response(null, { status: 201 }); };
  await assert.rejects(submitLead({ ...validDraft, consent: false }, liveConfig, { fetcher }), (error) => error instanceof LeadSubmissionError && error.code === 'invalid');
  await assert.rejects(submitLead(validDraft, { mode: 'unavailable', reason: 'missing policy' }, { fetcher }), (error) => error instanceof LeadSubmissionError && error.code === 'unavailable');
  assert.equal(calls, 0);
});

test('a valid 201 acceptance sends the normalized typed payload and returns its request ID', async () => {
  let payload: unknown;
  let requestUrl: unknown;
  let requestOptions: RequestInit | undefined;
  const result = await submitLead(validDraft, liveConfig, {
    fetcher: async (url, options) => {
      requestUrl = url;
      requestOptions = options;
      payload = JSON.parse(String(options?.body));
      return Response.json({ status: 'accepted', requestId: 'req-123' }, { status: 201 });
    },
  });
  assert.deepEqual(result, { status: 'accepted', requestId: 'req-123' });
  assert.equal(requestUrl, '/api/leads');
  assert.equal(requestOptions?.method, 'POST');
  assert.equal(requestOptions?.credentials, 'same-origin');
  assert.equal(requestOptions?.redirect, 'error');
  assert.ok(requestOptions?.signal instanceof AbortSignal);
  assert.deepEqual(payload, {
    schemaVersion: 1,
    source: 'finstake-web',
    service: 'personal',
    amountRub: 750000,
    termMonths: 36,
    comment: 'Хочу обсудить варианты',
    contact: { name: 'Анна Петрова', phone: '+79991234567', preferredChannel: 'phone' },
    consent: { accepted: true, policyVersion: '2026-10-26' },
  });
});

test('200, 204, malformed JSON, missing IDs and unaccepted statuses never count as accepted', async () => {
  const cases = [
    () => Response.json({ status: 'accepted', requestId: 'req-123' }, { status: 200 }),
    () => new Response(null, { status: 204 }),
    () => new Response('broken-json', { status: 201 }),
    () => Response.json({ status: 'accepted' }, { status: 201 }),
    () => Response.json({ status: 'accepted', requestId: ' ' }, { status: 201 }),
    () => Response.json({ status: 'pending', requestId: 'req-123' }, { status: 201 }),
    () => Response.json({ status: 'accepted', requestId: 123 }, { status: 201 }),
  ];
  for (const response of cases) {
    await assert.rejects(submitLead(validDraft, liveConfig, { fetcher: async () => response() }),
      (error) => error instanceof LeadSubmissionError && error.code === 'response');
  }
});

test('HTTP errors and fetch rejection produce explicit errors', async () => {
  await assert.rejects(submitLead(validDraft, liveConfig, { fetcher: async () => new Response(null, { status: 429 }) }),
    (error) => error instanceof LeadSubmissionError && error.code === 'http');
  await assert.rejects(submitLead(validDraft, liveConfig, { fetcher: async () => { throw new TypeError('offline'); } }),
    (error) => error instanceof LeadSubmissionError && error.code === 'network');
});

test('timeout aborts the actual in-flight request', async () => {
  let aborted = false;
  await assert.rejects(submitLead(validDraft, liveConfig, {
    timeoutMs: 5,
    fetcher: async (_url, options) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener('abort', () => { aborted = true; reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
    }),
  }), (error) => error instanceof LeadSubmissionError && error.code === 'timeout');
  assert.equal(aborted, true);
});

test('caller cancellation aborts an in-flight request and is distinct from failure', async () => {
  const controller = new AbortController();
  const submission = submitLead(validDraft, liveConfig, {
    signal: controller.signal,
    fetcher: async (_url, options) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    }),
  });
  controller.abort();
  await assert.rejects(submission, (error) => error instanceof LeadSubmissionError && error.code === 'cancelled');
});
