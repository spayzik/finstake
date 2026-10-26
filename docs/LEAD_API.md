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

## Explicit live configuration

Set all three public build-time environment variables and rebuild:

```dotenv
VITE_LEAD_ENDPOINT=/api/leads
VITE_PRIVACY_POLICY_VERSION=REPLACE_WITH_APPROVED_VERSION
VITE_PRIVACY_POLICY_URL=/REPLACE_WITH_PUBLISHED_POLICY
```

These are configuration placeholders, not legal documents. Do not enable live mode until the real operator, approved policy/consent wording, processing basis, retention, access controls and endpoint have been supplied and reviewed by the deployment owner. This repository does not invent an operator, legal address or policy. Environment variables prefixed with `VITE_` are public; never place secrets there.

The endpoint must be a root-relative path beginning `/api/`, containing only ASCII letters, digits, slashes, hyphens and underscores. Absolute URLs, protocol-relative URLs, dots, query strings, fragments, encoded characters and backslashes are rejected. Requests therefore go to the current origin. Policy URLs may be root-relative or HTTPS URLs, without embedded credentials. A configured endpoint with a missing/invalid policy version or URL produces an unavailable state and cannot send. Missing endpoint always means demo mode.

In live mode the checkbox requires explicit consent and the policy link opens the configured published document. The primary action becomes **«Отправить заявку»**. The `onPrivacy` callback is used only for the demo/unavailable explanatory note.

## Request

```ts
type ServiceType = 'personal' | 'business' | 'secured' | 'refinancing';
type CommunicationType = 'phone' | 'telegram' | 'whatsapp';

type LeadPayload = {
  schemaVersion: 1;
  source: 'finstake-web';
  service: ServiceType;
  amountRub: number;
  termMonths: 12 | 24 | 36 | 60 | 84 | 120 | null;
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

Non-2xx status codes, network rejection, response-contract errors and timeouts produce a visible error with manual retry. A timeout/network/invalid-response message means **acceptance is not confirmed**; the server may already have received data. Production server behavior should account for possible duplicate requests after manual retry. No persistence or idempotency claim is made by this client. Error text never includes server response bodies or entered personal data.

## Verification

```powershell
node --experimental-strip-types --test src/lib/lead.test.ts
npm test
npm run build
```

The core suite checks amount/service/term/comment validation, phone/name/channel/consent validation, live configuration gating, local-only demo behavior, normalized request payloads, strict acceptance, HTTP/network failures, timeout and cancellation. Network-boundary tests use controlled `Response` objects and an injected fetch function; they do not contact a real endpoint. No live backend or production policy is supplied or verified by these tests.
