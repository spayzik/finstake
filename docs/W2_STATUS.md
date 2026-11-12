# W2 — verified test deployment, 12 November 2026

Scope: existing React form → hosted PHP API → MySQL → real Telegram → CRM topic 2 → manager status. Public homepage remains demo; /w2-test/ requires a 15-minute authenticated session and permits only the reserved synthetic fixture. poll.php accepts only the configured test account. Legal drafts remain unpublished; no public real-data GO claimed.

Observed on hosting:
- Migrations 001–004 applied to isolated uwvfflmr_finstake_w2. Private config is outside www, mode 600; parent directory mode 700. One-use token-upload handler removed after saving the Owner-entered token.
- Website test submission without mandatory checkbox was blocked in UI. With checkbox, hosted API accepted and form displayed receipt; Telegram start payload was exercised in Telegram Web, followed by three real callback answers and a completed screening notification.
- Website request display number 5: 750000 RUB / 360 months / source finstake-web. A browser timeout did not show success; manual retry confirmed the same saved operation. Database readback showed one matching record.
- Bot-only request number 4: explicit test acknowledgement → business → 1000000 RUB → three questions. Group card showed source Bot / other and selected parameters, without names/phones/comments/documents.
- Real manager action changed number 4 NEW → IN_PROGRESS → CLOSED; number 2 IN_PROGRESS → COMPLETED. The DB and topic showed final states. Unauthorized/stale/replayed/concurrent revision handling is covered by local HTTP regression, not a second live user claim.
- Telegram API intermittently timed out from hosting; incoming webhook also timed out. Actual active delivery uses official getUpdates in bounded cron cycles (six polls, eight-second sleeps, flock). It is NOT a successful incoming-webhook E2E. Connection reuse, six-second transport deadline, shorter retry delays and priority callback acknowledgements reduce latency; network outages can still delay replies.

Local gates: npm test 33 PASS; npm run build PASS; HTTP SQLite/mock suite PASS; same flow including bot-only numbering/consents/source/dedup PASS on a fresh local MariaDB through PDO MySQL; session expiry/key-rotation checks PASS. Hosted CI NOT_RUN. Physical mobile device NOT_RUN. Independent Chief acceptance PENDING.

No merge performed. Operator details/retention/localization approval and public live release remain external requirements. Existing long IDs are retained internally; display numbers are increasing and may have gaps after DB rollback/bulk allocation.
