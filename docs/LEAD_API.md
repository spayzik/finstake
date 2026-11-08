# Lead form contract

The page ships in **demo mode**. With no `VITE_LEAD_ENDPOINT`, both steps run locally and `submitLead` makes no network request. There is no analytics event, console logging, cookie, browser storage or persistence of the entered form data. The data remains in React component memory until the dialog is unmounted. Returning to step 1 preserves the current draft; reopening the dialog starts a new draft.

The demo notice appears before either step. The final action is **«Проверить данные»**, and the result is **«Данные проверены. Это деморежим — заявка не отправлена.»** The demo checkbox acknowledges demo behavior; it is not a substitute for the approved legal consent required in a live deployment.

## Component integration

```tsx
import { LeadForm } from './components/LeadForm';
import type { ServiceType } from './lib/lead';

// The parent owns the native dialog and unmounts this component on close.
// The h2 inside LeadForm has id="lead-form-title" for aria-labelledby.
<LeadForm
  initialService={'personal' satisfies ServiceType}
  onClose={closeLeadDialog}
  onPrivacy={openDemoDataInformation}
/>
```

The parent must mount only one form at a time. Native `dialog.showModal()` provides focus containment; the parent restores focus to the invoking control. Closing/unmounting aborts the active request. Aborting cannot recall data already received by a server.

Revision 2 adds optional `initialValues?: Pick<LeadDraft, 'amount' | 'term' | 'comment'>`. The local credit calculator uses this to prefill the current calculation without a request or persistent storage. Opening a normal enquiry clears that prefill. No API schema change is required; supported calculator terms match the existing form's term options.

## Technical live interlock — not legal approval

**Real collection remains BLOCKED.** Complete [GO_LIVE_LEGAL_GATE](compliance/GO_LIVE_LEGAL_GATE.md), Owner/legal decisions and Chief acceptance first. These public build settings are a technical interlock, not evidence of legal approval, document publication or RF hosting. A modified client can bypass them; the server must enforce its own release gate. Never put secrets into `VITE_*`.

| Setting | Requirement after external acceptance |
|---|---|
| `VITE_LEAD_ENDPOINT` | Same-origin `/api/` path, nonempty ASCII slug segments; no dots, query, fragment, encoding, backslash, duplicate slash or redirect |
| `VITE_LEAD_LIVE_SWITCH` | Exactly `technical-enabled`; deliberately does not say approved/compliant |
| `VITE_LEAD_RELEASE_ID` | Identifier of the externally controlled release/change record, not a self-issued legal certificate |
| `VITE_LEAD_DEPLOYMENT_ORIGIN` | Exact HTTPS origin, no trailing slash/path/credentials/query; must match actual browser origin; `github.io` and its subdomains blocked |
| `VITE_LEAD_OPERATOR_NAME` | Real public operator name, no placeholder or control characters; not a made-up company or only an assumed brand |
| `VITE_PRIVACY_POLICY_VERSION`, `VITE_PRIVACY_POLICY_URL` | Published policy version and root-relative document URL |
| `VITE_LEAD_CONSENT_VERSION`, `VITE_LEAD_CONSENT_URL` | Separate published lead consent version and URL, distinct from policy |
| `VITE_LEAD_WITHDRAWAL_URL` | Real same-origin published instructions/route to the working rights/withdrawal channel; never fake local success |
| `VITE_MARKETING_CONSENT_VERSION`, `VITE_MARKETING_CONSENT_URL` | Optional pair; absent means no marketing UI. If present, both must be valid and consent must be a third separate document |

Identifiers use ASCII letters/digits/underscore/hyphen, max 100. Published paths use ASCII slug segments, optionally `.html`, max 500; external URLs, query/fragment/encoding/dot segments are rejected. Obvious draft/REQUIRES_OWNER_INPUT/REPLACE/EXAMPLE/TBD/TODO values are rejected. Operator display name max 300. These checks do not fetch/validate the actual document or establish operator identity. Deployment owner must verify real content, status, accessibility, approved versions/hashes and server whitelist. A SPA fallback returning the home page with status 200 is not a published consent.

No endpoint always means demo, even if other settings exist. Endpoint with incomplete/invalid prerequisites means unavailable and zero requests. Legacy three-setting activation is intentionally rejected. Do not populate production environment values as part of this Agent A delivery.

In live mode the required initially unchecked checkbox names the operator and links the separate consent. Policy and withdrawal links are separate. Marketing appears only when its optional pair is configured, is unchecked/non-required, and refusal never prevents a lead. The preferred contact channel does not grant advertising permission. If Owner needs channel-specific opt-ins, extend the contract/UI under Chief review before marketing goes live. Demo acknowledgment is not a legal consent and never sends data.

**Agent C integration pending:** `App.tsx` still resolves the legacy settings and owns footer/privacy content. Its policy/footer/configuration must be aligned with this interlock and real legal routes before live acceptance. Agent A did not edit that reserved file. The README/local `scripts/qa-server.mjs` legacy live recipe is no longer sufficient; it is not a production endpoint or legal document. See [AUDIT_AND_INTEGRATION](compliance/AUDIT_AND_INTEGRATION.md).

## Request

```ts
type ServiceType = 'personal' | 'business' | 'secured' | 'refinancing';
type CommunicationType = 'phone' | 'telegram' | 'whatsapp';

type LeadPayload = {
  schemaVersion: 1;
  source: 'finstake-web';
  service: ServiceType;
  amountRub: number;
  termMonths: 12 | 24 | 36 | 60 | 84 | 120 | 180 | 240 | 300 | 360 | null;
  comment: string;
  contact: {
    name: string;
    phone: string; // normalized international +digits form
    preferredChannel: CommunicationType;
  };
  consent: { accepted: true; policyVersion: string };
};
```

`POST` uses `Content-Type: application/json`, `Accept: application/json`, `credentials: 'same-origin'` and `redirect: 'error'`. Redirect responses are rejected; the browser must not forward a POST body to a redirected destination, including a third-party destination via a 307/308 response. No external service is contacted by the adapter. The client aborts a request after 12 seconds, including an unfinished response body. The client synchronously guards against simultaneous form submissions; controls are disabled while pending. It does not automatically retry.

### Additive consent headers — server integration required

The schemaVersion 1 JSON body above is preserved, including `consent.policyVersion` (policy, not the separate consent). The prepared client additionally sends:

```http
X-Lead-Consent-Version: <published separate consent version>
X-Lead-Release-Id: <technical release record ID>
```

Only when marketing is configured, also `X-Lead-Marketing-Version` and `X-Lead-Marketing-Consent: granted|not-granted`. Undefined/unchecked means `not-granted`; marketing true without configured published marketing text is rejected before fetch. No PDF, BKI access or creditor-transfer consent is encoded by these headers. Existing servers must not silently ignore them and start collecting: Chief/backend must implement and verify the additive metadata contract before live release.

Server must reject missing/unknown/inactive required versions/releases and invalid consent values. Bind receipt to its immutable published text/hash, operator, specific purpose, affirmative action, server UTC time, requestId and separately marketing choice. Client-supplied flags/versions are claims, not sufficient server evidence on their own; client time is not authoritative. Keep restricted evidence storage and approved retention, not raw form bodies in logs. A checkbox does not establish identity and is not automatically the statutory written form when that form is required.

Client validation requires:

- A known service, a whole-ruble amount greater than zero and at most 1,000,000,000. Spaces, nonbreaking spaces and narrow nonbreaking spaces may separate digits. Signs, fractions, exponents, currency text and nonfinite values are rejected.
- An optional supported term and a comment of at most 1,000 characters.
- A name of 2–80 characters containing at least two letters; letters, marks, spaces, apostrophes and hyphens are accepted.
- A telephone number in international format (10–15 digits, nonzero country prefix), or a 10-digit Russian number / 11-digit Russian number starting `7` or `8`. Formatting spaces, parentheses and hyphens are allowed; letters are rejected. This checks format only, not ownership or deliverability.
- A supported preferred channel and the checked consent/acknowledgment box. Phone contact is available without choosing a messaging service.

The server must validate the full schema and values again. Client validation is a convenience and does not establish identity, fraud clearance, underwriting eligibility or consent compliance.

## Response and truthful states

**Only this actual response confirms acceptance:**

```http
HTTP/1.1 201 Created
Content-Type: application/json

{"status":"accepted","requestId":"server-generated-nonempty-id"}
```

The JSON must be an object with `status: 'accepted'` and a nonempty string `requestId`. A `200`, `202`, `204`, malformed body, missing/empty/nonstring ID or any other status is not acceptance. The UI shows the returned request ID only after validating this contract. It makes no promise of financing approval or response time.

Non-2xx status codes, network rejection, response-contract errors and timeouts produce a visible error with manual retry. A timeout/network/invalid-response message means **acceptance is not confirmed**; the server may already have received data. The form retains its idempotency key for an unchanged manual retry while open; a production server must implement and verify matching behavior. Error text never includes server response bodies or entered personal data.

The pending UI allows cancelling the wait; unmount also aborts. Cancellation does not recall an already delivered request or withdraw consent. No response arriving after an observed abort is shown as acceptance. The published withdrawal route must lead to an actual operator process with proportionate verification, separate marketing stop and documented response/deletion. No local button claims a completed withdrawal. In-memory edits are retained on errors/back; closing destroys component state. Never log entered data, place it in URLs, analytics, session replay or browser persistence. Review reverse-proxy/APM/CRM logs too.

## Isolated local synthetic test

The PHP router in `server/local-router.php` is a local-only test harness, not a deployable API. It rejects anything except its fixed synthetic name and phone and an empty comment, and uses test consent versions. With PHP 8, PDO SQLite and mbstring available, start it on `127.0.0.1:47839` with `FINSTAKE_TEST_DB` pointing to a disposable local SQLite file. Start Vite on `127.0.0.1:4187` with `VITE_LOCAL_SYNTHETIC=1`. The dev-only proxy forwards `/api/leads` to the harness. Use `Тест Тестов`, `+447700900123` and no comment; never enter real data. With no explicit switch the form remains demo. Production builds do not enable the local-test branch.

The form sends a random `Idempotency-Key`, retained in component memory for a manual retry of unchanged data after an uncertain response and replaced after an edit. Closing the form destroys the key. The local SQLite harness returns the original ID for the same key and payload, and 409 if the key is reused with different content. These local tests do not prove any production server's idempotency, persistence, consent evidence or deployment readiness.

Server duplicate handling remains **NOT IMPLEMENTED/NOT VERIFIED** here. Chief must choose/test an idempotency/deduplication approach before real collection; automatic retries have not been introduced. Apply rate/body limits, same-origin controls, secure storage and deletion from [SECURE_DEPLOYMENT](SECURE_DEPLOYMENT.md). A format-valid phone is not proof of ownership. Messaging preferences do not cause this adapter to transmit data to messaging providers.

## Verification

```powershell
node --experimental-strip-types --test src/lib/lead.test.ts
npm test
npm run build
```

The core suite checks amount/service/term/comment validation, phone/name/channel/consent validation, live configuration gating, local-only demo behavior, normalized request payloads, strict acceptance, HTTP/network failures, timeout and cancellation. Network-boundary tests use controlled `Response` objects and an injected fetch function; they do not contact a real endpoint. No live backend or production policy is supplied or verified by these tests.
