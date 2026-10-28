import assert from 'node:assert/strict';
import test from 'node:test';
import { createPreparedAnalytics } from './analytics.ts';

test('default analytics does not invoke a sink for any known events', () => {
  const calls: string[] = [];
  const analytics = createPreparedAnalytics({ sink: event => calls.push(event) });
  for (const event of ['page_view', 'service_click', 'cta_click', 'form_open', 'form_start', 'messenger_click']) {
    assert.equal(analytics.record(event), false);
  }
  assert.deepEqual(calls, []);
});

test('explicitly enabled test sink receives only constant allowed events, never payload or acceptance', () => {
  const calls: string[] = [];
  const analytics = createPreparedAnalytics({ enabled: true, sink: (...args) => { assert.equal(args.length, 1); calls.push(args[0]); } });
  assert.equal(analytics.record('form_open'), true);
  assert.equal(analytics.record('lead_accepted'), false);
  assert.equal(analytics.record('phone_79990000000'), false);
  assert.equal(analytics.record({ phone: 'synthetic-only' }), false);
  assert.equal(analytics.record('form_open?utm_content=synthetic'), false);
  assert.deepEqual(calls, ['form_open']);
});

test('no sink means no tracking, even when explicitly enabled', () => {
  assert.equal(createPreparedAnalytics({ enabled: true }).record('form_start'), false);
});
