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

const releaseInput = {
  endpoint: '/api/leads', privacyPolicyVersion: 'policy-20261027', privacyPolicyUrl: '/privacy',
  liveSwitch: 'technical-enabled', releaseId: 'synthetic-release-01', deploymentOrigin: 'https://finstake.test',
  operatorName: 'Синтетический оператор для тестов', leadConsentVersion: 'lead-20261027',
  leadConsentUrl: '/legal/lead-consent', withdrawalUrl: '/privacy/withdraw',
};
const liveConfig = resolveLeadConfig(releaseInput);

test('receipt display accepts only a positive safe integer number', async () => {
  for (const value of [0,-1,1.5,'7',7]) {
    const result=await submitLead(validDraft,liveConfig,{fetcher:async()=>new Response(JSON.stringify({status:'accepted',requestId:'synthetic-receipt',requestNumber:value}),{status:201})});
    assert.equal(result.status,'accepted');
    if(result.status==='accepted') assert.equal(result.requestNumber,value===7?7:undefined);
  }
});

test('only the configured bot and opaque start token can be shown after acceptance', async () => {
  for (const url of ['https://t.me/finstake_helperbot?start=' + 'x'.repeat(43), 'javascript:alert(1)', 'https://t.me/other_bot?start=' + 'x'.repeat(43)]) {
    const result = await submitLead(validDraft, liveConfig, { fetcher: async () => new Response(JSON.stringify({status:'accepted', requestId:'synthetic-id', telegramUrl:url}), {status:201}) });
    assert.equal(result.status, 'accepted');
    if (result.status === 'accepted') assert.equal(result.telegramUrl, url.startsWith('https://t.me/finstake_helperbot?') ? url : undefined);
  }
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

test('live mode requires a same-origin API path and all release prerequisites', () => {
  assert.equal(resolveLeadConfig({}).mode, 'demo');
  assert.equal(liveConfig.mode, 'live');
  for (const endpoint of ['https://other.example/api/leads', '//other.example/api/leads', '/api/../leads', '/api/%2e%2e/leads', '/api/leads#x', '/api\\leads']) {
    assert.equal(resolveLeadConfig({ endpoint, privacyPolicyVersion: 'v1', privacyPolicyUrl: '/privacy' }).mode, 'unavailable', endpoint);
  }
  assert.equal(resolveLeadConfig({ endpoint: '/api/leads' }).mode, 'unavailable');
  assert.equal(resolveLeadConfig({ endpoint: '/api/leads', privacyPolicyVersion: 'v1', privacyPolicyUrl: 'javascript:alert(1)' }).mode, 'unavailable');
});

test('unpaired marketing settings, unsafe endpoints and forged live configs cannot send', async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => { calls++; return Response.json({ status: 'accepted', requestId: 'not-used' }, { status: 201 }); };
  for (const patch of [
    { marketingConsentVersion: 'marketing-01' }, { marketingConsentUrl: '/legal/marketing' },
    { marketingConsentVersion: 'marketing-01', marketingConsentUrl: '/privacy' },
    { endpoint: '/api//leads' }, { operatorName: 'REQUIRES_OWNER_INPUT' },
  ]) {
    const config = resolveLeadConfig({ ...releaseInput, ...patch });
    assert.equal(config.mode, 'unavailable');
    await assert.rejects(submitLead(validDraft, config, { fetcher }));
  }
  assert.equal(liveConfig.mode, 'live');
  if (liveConfig.mode !== 'live') throw new Error('fixture must resolve live');
  await assert.rejects(submitLead(validDraft, { ...liveConfig, leadConsentUrl: '//other.test/path' }, { fetcher }));
  await assert.rejects(submitLead({ ...validDraft, marketingConsent: true }, liveConfig, { fetcher }));
  assert.equal(calls, 0);
});

test('a late valid response after cancellation never reports acceptance', async () => {
  const controller = new AbortController();
  await assert.rejects(submitLead(validDraft, liveConfig, {
    signal: controller.signal,
    fetcher: async () => { controller.abort(); return Response.json({ status: 'accepted', requestId: 'late' }, { status: 201 }); },
  }), (error) => error instanceof LeadSubmissionError && error.code === 'cancelled');
});

test('timeout covers an unfinished response body, with no automatic retry', async () => {
  let calls = 0;
  await assert.rejects(submitLead(validDraft, liveConfig, {
    timeoutMs: 5,
    fetcher: async (_url, options) => {
      calls++;
      return { ok: true, status: 201, json: () => new Promise((_resolve, reject) => {
        options?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
      }) } as Response;
    },
  }), (error) => error instanceof LeadSubmissionError && error.code === 'timeout');
  assert.equal(calls, 1);
});

test('actual browser origin mismatch blocks even a forged otherwise complete live config', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'location');
  let calls = 0;
  try {
    Object.defineProperty(globalThis, 'location', { configurable: true, value: { origin: 'https://wrong-origin.test' } });
    assert.equal(resolveLeadConfig(releaseInput).mode, 'unavailable');
    await assert.rejects(submitLead(validDraft, liveConfig, { fetcher: async () => {
      calls++;
      return Response.json({ status: 'accepted', requestId: 'not-used' }, { status: 201 });
    } }), (error) => error instanceof LeadSubmissionError && error.code === 'unavailable');
    assert.equal(calls, 0);
    assert.equal(resolveLeadConfig({ ...releaseInput, endpoint: undefined }).mode, 'demo');
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'location', descriptor);
    else Reflect.deleteProperty(globalThis, 'location');
  }
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
    consent: { accepted: true, policyVersion: 'policy-20261027' },
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

test('30-year terms survive lead validation and preserve the selected duration', async () => {
  const draft = { ...validDraft, term: '360' };
  assert.deepEqual(validateDetails(draft), {});
  let payload: { termMonths: number } | undefined;
  await submitLead(draft, liveConfig, { fetcher: async (_url, options) => {
    payload = JSON.parse(String(options?.body));
    return new Response(JSON.stringify({ status: 'accepted', requestId: 'long-term-test' }), { status: 201 });
  } });
  assert.equal(payload?.termMonths, 360);
});


test('legacy three-setting activation is unavailable, never a live legal release', () => {
  assert.equal(resolveLeadConfig({ endpoint: '/api/leads', privacyPolicyVersion: 'v1', privacyPolicyUrl: '/privacy' }).mode, 'unavailable');
});

test('each missing technical release prerequisite fails closed', () => {
  for (const field of Object.keys(releaseInput)) {
    if (field === 'endpoint') continue;
    const input = { ...releaseInput, [field]: undefined };
    assert.equal(resolveLeadConfig(input).mode, 'unavailable', field);
  }
  assert.equal(resolveLeadConfig({ ...releaseInput, liveSwitch: 'approved' }).mode, 'unavailable');
});

test('draft, external, tracking and bundled document URLs never enable collection', () => {
  for (const url of ['/docs/PRIVACY_POLICY_DRAFT.md', '/REQUIRES_OWNER_INPUT', '//other.test/consent', 'https://other.test/consent', '/consent?name=x', '/consent#x', '/legal/../consent', '/legal/%2fconsent', '/legal\\consent']) {
    assert.equal(resolveLeadConfig({ ...releaseInput, leadConsentUrl: url }).mode, 'unavailable', url);
  }
  assert.equal(resolveLeadConfig({ ...releaseInput, leadConsentUrl: releaseInput.privacyPolicyUrl }).mode, 'unavailable');
  assert.equal(resolveLeadConfig({ ...releaseInput, leadConsentVersion: 'REQUIRES_OWNER_INPUT' }).mode, 'unavailable');
  for (const deploymentOrigin of ['http://finstake.test', 'https://spayzik.github.io', 'https://finstake.test/path']) {
    assert.equal(resolveLeadConfig({ ...releaseInput, deploymentOrigin }).mode, 'unavailable');
  }
});

test('separate consent version is transmitted without changing schemaVersion 1 body', async () => {
  let headers: HeadersInit | undefined;
  let body: { consent: unknown } | undefined;
  await submitLead(validDraft, liveConfig, { fetcher: async (_url, options) => {
    headers = options?.headers; body = JSON.parse(String(options?.body));
    return Response.json({ status: 'accepted', requestId: 'consent-test' }, { status: 201 });
  } });
  assert.deepEqual(body?.consent, { accepted: true, policyVersion: 'policy-20261027' });
  assert.equal(new Headers(headers).get('X-Lead-Consent-Version'), 'lead-20261027');
  assert.equal(new Headers(headers).get('X-Lead-Release-Id'), 'synthetic-release-01');
});

test('marketing defaults to refusal and is independent of required lead consent', async () => {
  const config = resolveLeadConfig({ ...releaseInput, marketingConsentVersion: 'marketing-01', marketingConsentUrl: '/legal/marketing' });
  for (const marketingConsent of [undefined, false, true]) {
    let header: string | null = null;
    await submitLead({ ...validDraft, marketingConsent }, config, { fetcher: async (_url, options) => {
      header = new Headers(options?.headers).get('X-Lead-Marketing-Consent');
      return Response.json({ status: 'accepted', requestId: 'marketing-test' }, { status: 201 });
    } });
    assert.equal(header, marketingConsent === true ? 'granted' : 'not-granted');
  }
  let calls = 0;
  await assert.rejects(submitLead({ ...validDraft, consent: false, marketingConsent: true }, config, { fetcher: async () => { calls++; return Response.json({ status: 'accepted', requestId: 'no' }, { status: 201 }); } }));
  assert.equal(calls, 0);
});

test('an explicitly supplied operation key is sent unchanged to the server', async () => {
  let sent: string | null = null;
  const key = '00000000-0000-4000-8000-000000000001';
  await submitLead(validDraft, liveConfig, { idempotencyKey: key, fetcher: async (_url, options) => {
    sent = new Headers(options?.headers).get('Idempotency-Key');
    return Response.json({ status: 'accepted', requestId: 'test' }, { status: 201 });
  } });
  assert.equal(sent, key);
});

test('a timed-out attempt and manual retry carry the same operation key', async () => {
  const seen: Array<string | null> = [];
  const key = '00000000-0000-4000-8000-000000000001';
  await assert.rejects(submitLead(validDraft, liveConfig, { idempotencyKey: key, timeoutMs: 5,
    fetcher: async (_url, options) => {
      seen.push(new Headers(options?.headers).get('Idempotency-Key'));
      return new Promise((_resolve, reject) => options?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true }));
    },
  }), (error) => error instanceof LeadSubmissionError && error.code === 'timeout');
  const result = await submitLead(validDraft, liveConfig, { idempotencyKey: key, fetcher: async (_url, options) => {
    seen.push(new Headers(options?.headers).get('Idempotency-Key'));
    return Response.json({ status: 'accepted', requestId: 'test' }, { status: 201 });
  } });
  assert.deepEqual(seen, [key, key]);
  assert.equal(result.status, 'accepted');
});

test('conflict and invalid responses are not accepted', async () => {
  for (const status of [409, 422]) {
    await assert.rejects(submitLead(validDraft, liveConfig, { fetcher: async () => new Response(null, { status }) }),
      (error) => error instanceof LeadSubmissionError && error.code === 'http');
  }
});
