# FinStake — Design Engineering

Decision record · 26 October 2026 · implementation owned by this project.

## Product and scope
FinStake is an independent credit brokerage and advisory agency for individuals and businesses. The primary task is to understand the service and request a human consultation. FinStake does not lend, approve credit or guarantee outcomes. No rates, amounts approved, partners, statistics, testimonials, employee identities or legal details are invented.

The workspace was empty, without a Git repository, existing frontend, original logo or supplied screenshot files. React + TypeScript + Vite, plain CSS, Lucide line icons and Motion are the bounded implementation. No framework migration, shadcn setup, component registry imports, CRM, AI, account system or calculator. The typographic FinStake wordmark is an interim treatment, not an asserted reproduction of an original logo.

## Research ledger
| Source | Date | Actual access | Observation / decision |
|---|---|---|---|
| User references A/B/C | 2026-10-26 | Detailed written descriptions; original images unavailable | A dominates: white left content, daylight architecture right, three translucent service panels. B only contributes density and varied scale; C contributes light compact content and clear sequence. Pixel fidelity cannot be claimed. |
| https://refero.design/ via Refero MCP style/screen search | 2026-10-26 | BLOCKED: NO_SUBSCRIPTION | No private screenshots, IDs or style claims used. |
| https://21st.dev/community/components/explore/landing-page-components | 2026-10-26 | Rendered browser screenshot inspected | Image and text asymmetry can create depth. Reject shader/glow and dashboard statistics. No component source adopted. |
| https://kokonutui.com/ | 2026-10-26 | Rendered browser screenshot inspected | Restrained dividers, precise small labels, deliberate spacing. Do not import its dark theme or playful widgets. |
| https://lusion.co/projects/ | 2026-10-26 | Rendered browser screenshot inspected after loader | Strong typographic hierarchy and image rhythm. FinStake uses bounded type scale, natural scrolling and no loader/WebGL. |
| https://motion.dev/docs/react and /docs/react-use-reduced-motion | 2026-10-26 | Official documentation read | One animation engine; MotionConfig reducedMotion=user, one-time reveals, state transitions. |
| https://animejs.com/documentation/timeline/ | 2026-10-26 | Official documentation read | Timeline choreography considered, not needed alongside Motion. |
| https://gsap.com/docs/v3/ | 2026-10-26 | Official documentation read | Additional animation engine not justified. |

## Concepts and selection
1. **Light architecture (selected by agent under user's delegated art direction):** calm split hero, office photograph melting into white, staggered advisory panels, compact four-column benefits, image-led services. Strongest match to A and to a consultation business.
2. Editorial advisory: dominant narrow type columns and full-width architectural strips. More editorial authority, less immediate explanation of the offer.
3. Structured service directory: denser service-first composition. Fast scanning, weaker first-screen personality.

## Reference lock
Keep: white canvas; dark restrained typography; rare forest/emerald accents; natural daylight photography; asymmetric hero with three panels; simple linear process; human consultation. Secondary details may refine border/radius/section rhythm only. Avoid generic SaaS glass grids, giant 3D logos, neon, fake dashboards, rates, credit approval badges, robots and invented proof.

## Tokens and typography
| Role | Token |
|---|---|
| Canvas | #FAFBFC |
| Surface | #FFFFFF |
| Ink | #121A22 |
| Body | #364350 |
| Muted | #687584 |
| Brand | #083F37 |
| Accent | #079A74 |
| Border | #E4E9EC |

One family: self-hosted Manrope, Cyrillic and Latin; 400, 500, 600, 700, 800. H1 60px desktop / 46px tablet / 38px phone; H2 40 / 34 / 30; H3 23; body 15–17; smallest useful labels 12–14. Headings have tight but natural tracking and line height 1.12–1.2; body 1.65. No decorative mixed-font headline fragments.

Spacing: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96. Container 1240px with 48px desktop, 32px tablet and 20px mobile gutters. Sections use 80–104px rather than uniform card rows. Radius: buttons 8px, cards 14px, major image 18px. Fine borders, minimal shadow; translucent panels only over hero photography.

## Components and states
Dark brand primary buttons, clear text secondary actions, visible hover/active/focus. Minimum touch controls 44px. Four services each have a distinct real photo, short description and arrow. Service actions open the lead form with the relevant service selected. Navigation anchors lead to actual content; mobile menu closes on selection and Escape. FAQ uses semantic buttons, aria-expanded, keyboard access and one open answer at a time.

The consultation opens a native modal dialog with focus containment, Escape, close and return to trigger. Two short steps preserve state in memory. Inline validation, pending, retryable failure and confirmed success are separate. Default demo never makes requests, logs personal data or stores it persistently. An actual server acceptance is required for success. Personal data is never sent to third-party services. No first-contact document uploads. A live policy/operator and terms are deployment prerequisites; the demo explains their absence honestly.

## Images
Real licensed Unsplash photography, self-hosted WebP responsive derivatives where network access permits. Track exact source URLs, author and license in ASSETS.md. Stock architecture is illustrative, never represented as FinStake premises. All image boxes have stable aspect ratios, descriptive alt text and deliberate crops. Hero loads eagerly; lower images lazy. No AI people, money decorations, plastic 3D art or fabricated employee portraits.

## Motion
Motion is the only animation engine. Hero entrance: 500–600ms opacity + 14px translate, text and CTA finish within 750ms. Panels stagger within the same budget and never loop. Section reveals once, 450ms; process numbers reveal in sequence. Hover feedback 180–220ms, photo scale maximum 1.025. Form/FAQ transitions 220–280ms. No scroll hijacking, cursor replacement, parallax, perpetual floating or WebGL. Reduced motion removes transforms and scrolling animation; content stays usable.

## Responsive and accessibility
Desktop: full nav, split hero, benefits strip, four image cards, four-step timeline. Tablet: compact menu, two-column services, hero panels stay bounded. Phone: title and CTA first, photo with compact panels below, stacked benefits, single-column service list, vertical timeline, full-width form. No essential horizontal scroll. Long Russian labels wrap naturally.

Semantic landmarks, single h1, skip link, labels and described errors, visible keyboard focus, 44px controls, aria live updates and decorative icons hidden from assistive tech. Browser zoom, reduced motion, empty fields and long text included in QA. Color is not the only state signal.

## Visual acceptance and verification
Inspect actual rendered desktop, tablet and phone; save representative screenshots in evidence/. Check image loading/cropping, first-screen balance, content hierarchy, no overflow, mobile nav, anchors, FAQ keyboard, modal focus, form validation/back/demo, reduced motion and console. Build success alone is insufficient. Record exact observed outcomes and any NOT_RUN in evidence/QA.md after implementation. Production API, real legal approval and original-logo fidelity remain unverified until supplied.

## Implementation and QA decisions

Implemented on 2026-10-26. Final scale uses a responsive 62px-max H1 (35–48px on phone), 32–40px section titles, compact 19–21px service titles and 13–15px useful content. Small uppercase eyebrows and image captions are secondary, never essential actions. The four-card desktop layout constrains the service title scale; no heading is forced to overrun its card.

Rendered checks covered 320, 390, 768, 1024, 1240 and 1280px viewport widths. At 1440px overflow was measured but the app's native screenshot clipped the right edge; this is not full visual proof. `evidence/QA.md` records screenshots, corrected defects, test outcomes and exact limits. The consultation caption is opaque white; translucency remains concentrated in the hero. An explicit modal Tab boundary guard supplements native dialog behavior. A same-origin API adapter rejects redirects and confirms only validated HTTP 201 acceptance; the default build remains local-only demo.

## Revision 2 — supplied visual references and service positioning

User steering on 2026-10-26 supersedes the original restrictions on a calculator, rare green and hero-only translucency. All three actual attached images have now been inspected and retained in `evidence/references/`. Reference 02 owns the panoramic-office hero and dimensional glass panels. Reference 01 owns compact surfaces and brighter emerald primary actions. Reference 03 contributes saturated emerald/teal and depth, while the page remains light; do not copy its giant logo, dark canvas, unverified statistics or AI-assistant claims.

Final revision tokens: ink #0B1520; body #344654; muted #596F7B; deep green #064E40; emerald #009E78; bright accent #13C79A; pale mint #E9FAF3; canvas #F3F8FA. Emerald gradients are now purposeful on primary actions and small highlights, not random backgrounds. White glass surfaces use a fine light edge, a mint reflection and restrained shadow. Three hero panels have fixed perspective; on hover-capable desktop their angle settles subtly. No perpetual movement. Reduced motion removes movement and preserves all controls.

Owner-confirmed commercial model: no advance payment; payment after the client receives financing. Explain the shared incentive without inventing a fee percentage. Position the service as end-to-end analysis, individual selection, document preparation and support through receiving the credit. Greater financing is a goal explored through analysis, never a guaranteed increase or fictitious approval. The creditor still sets final terms; keep this factual explanation discreet and clear.

The new hero is an AI-generated architectural visualization based on the user's hero reference, generated with the built-in imagegen tool, with no people or baked-in interface. It is illustrative and not presented as FinStake premises. Existing original stock service photographs are retained. The cube-like logo is reconstructed as code-native geometry from the supplied brand reference; vector fidelity cannot be certified from a screenshot.

Calculator scope confirmed by user: ordinary local calculation, no bank-offer showcase and no OpenAI API. Amount, term and annual nominal rate are entered by the user; annuity/differentiated schedules, interest and total payments are calculated locally. Fees, insurance and brokerage fees are excluded and labeled. Results are not bank offers or approval predictions. Passing a result into the lead form must preserve amount, term and calculation context, without sending data. No AI label, live rates or fake bank logos. Bankipartners publicly describes partner API tools, but this project has no authenticated offer feed; no scraper or private endpoint is invented.

Bounded revision plan: preserve original v1 assets/evidence; add generated v2 hero, reconstructed brand mark, richer glass/motion styling and revised copy; test calculator mathematics before implementing it; add an inline calculator and prefilled enquiry; repeat build, tests, desktop/tablet/phone and keyboard checks. Keep production lead submission in demo mode.

### Owner logo update — 2026-10-26
Use the owner-supplied cube/handshake and original FinStake lettering. Remove white background, retain a complete transparent asset, and compose mark plus lettering horizontally for readable responsive navigation. Replace the interim reconstructed logo in both header and footer and use the original mark for the favicon.
