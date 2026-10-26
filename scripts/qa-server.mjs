/**
 * Local synthetic API fixture for browser QA only. This is not a production
 * backend, a legal policy, or a real application intake service. Request data
 * is held in memory only for one response and is never logged or forwarded.
 */
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

process.env.VITE_LEAD_ENDPOINT = '/api/leads';
process.env.VITE_PRIVACY_POLICY_VERSION = 'local-qa-only';
process.env.VITE_PRIVACY_POLICY_URL = '/qa-policy';

const host = '127.0.0.1';
const port = 4188;
const bodyLimit = 16 * 1024;
const root = fileURLToPath(new URL('../', import.meta.url));

const vite = await createServer({
  root,
  server: {
    host,
    middlewareMode: true,
    hmr: { host, port: 24188 },
  },
  plugins: [{
    name: 'local-synthetic-api-fixture-banner',
    transformIndexHtml: {
      order: 'post',
      handler() {
        return [{
          tag: 'div',
          attrs: {
            role: 'note',
            style: 'position:fixed;z-index:9999;bottom:0;inset-inline:0;padding:9px 16px;text-align:center;background:#fff2b9;color:#3c3521;border-top:1px solid #d8c987;font:600 13px/1.4 system-ui,sans-serif;pointer-events:none',
          },
          children: 'Локальный тест API · синтетические данные · не реальная заявка',
          injectTo: 'body',
        }];
      },
    },
  }],
});

function json(response, status, body) {
  if (response.destroyed || response.writableEnded) return;
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(body));
}

const server = http.createServer((request, response) => {
  const path = new URL(request.url ?? '/', `http://${host}:${port}`).pathname;
  if (path === '/qa-policy') {
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end('<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Локальная тестовая заглушка</title><body style="font:16px/1.7 system-ui,sans-serif;max-width:660px;padding:32px;margin:auto"><h1>Только локальная проверка интерфейса</h1><p>Это тестовая заглушка, а не юридическая политика обработки данных. Используйте только синтетические данные.</p><p>Заявка не передаётся реальному оператору, кредиторам или внешним сервисам. Локальный тестовый сервер обрабатывает запрос в оперативной памяти и не сохраняет его.</p><p>Ответ LOCAL-QA-001 — синтетическое подтверждение для проверки интерфейса, а не реальная заявка.</p></body></html>');
    return;
  }
  if (path === '/api/leads') {
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      json(response, 405, { status: 'fixture-method-not-allowed' });
      return;
    }
    if (Number(request.headers['content-length'] ?? 0) > bodyLimit) {
      request.resume();
      json(response, 413, { status: 'fixture-body-too-large' });
      return;
    }
    let size = 0;
    let rejected = false;
    const chunks = [];
    request.on('data', (chunk) => {
      if (rejected) return;
      size += chunk.length;
      if (size > bodyLimit) {
        rejected = true;
        chunks.length = 0;
        json(response, 413, { status: 'fixture-body-too-large' });
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      if (rejected) return;
      let payload;
      try { payload = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { json(response, 400, { status: 'fixture-invalid-json' }); return; }
      chunks.length = 0;
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        json(response, 400, { status: 'fixture-invalid-payload' });
        return;
      }
      const scenario = payload.comment;
      payload = undefined;
      const timer = setTimeout(() => {
        if (scenario === 'qa:error') json(response, 503, { status: 'fixture-service-unavailable' });
        else if (scenario === 'qa:invalid') json(response, 200, { status: 'accepted' });
        else json(response, 201, { status: 'accepted', requestId: 'LOCAL-QA-001' });
      }, scenario === 'qa:error' || scenario === 'qa:invalid' ? 1200 : 1500);
      response.once('close', () => clearTimeout(timer));
    });
    request.on('error', () => {
      chunks.length = 0;
      json(response, 400, { status: 'fixture-request-error' });
    });
    return;
  }
  vite.middlewares(request, response, () => {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end('Local QA fixture: route not found.');
  });
});

server.listen(port, host, () => {
  process.stdout.write(`Synthetic local QA fixture: http://${host}:${port}\n`);
});

let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  server.close();
  await vite.close();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
