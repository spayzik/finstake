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

## Revision 3 — clear glass / guided assistance (2026-10-26)
Owner requests a more modern, transparent interface, a stronger hero, 30-year terms and a compact predefined-answer helper. Preserve the supplied logo, emerald identity, office photography, brokerage model and honest demo lead contract.

Reference inspection: 21st Liquid Glass Button (https://21st.dev/@designali-in/components/liquid-glass-button), visually inspected 2026-10-26: fine specular rim and restrained depth, adapted to surfaces without copying code. Kokonut homepage (https://kokonutui.com/), visually inspected same date: distinct type hierarchy and contained interactive examples, adapted to form controls and helper choices. Refero MCP returned NO_SUBSCRIPTION; no Refero screens inspected. Motion reduced-motion documentation reviewed.

Chosen direction: architectural clear glass. Keep office hero but frame it with rounded architecture, stronger green emphasis, clear layered panels and an explicit service path. Lower white fill opacity, use static 14–20px backdrop blur, fine bright edges and dark text. Avoid stacked opaque white gradients that produced the previous matte result. Other considered directions (dark banking dashboard, full-screen abstract AI graphics) conflict with the existing reference lock.

Implementation: shared term catalog through 360 months across calculation, lead selection and validation. Predefined-answer helper in bottom-right, user-controlled nonmodal panel; no AI identity, network requests, personal data entry or fake online-agent status. Questions expose factual service/process/payment answers with a consultation action. Closed welcome hint is dismissible, never auto-opens.

Motion: hero stagger completes within 750ms; interactive cards transform only 2–4px; helper 220ms opacity/translate and answer transitions; no perpetual effects. Honor reduced motion, keyboard Escape/focus restoration, visible focus and minimum 44px control targets. Mobile glass has lower blur; helper stays within visual viewport and is hidden behind modal forms. QA: desktop/tablet/mobile screenshot review, 360-month calculation and lead prefill, helper keyboard/dismiss/reopen, validation and production build.

Revision 3 validation: 19 Node tests pass; Pages build passes. Local browser inspected desktop, tablet (805px content viewport) and mobile (375px content viewport): no horizontal page overflow. Verified 360-month/12%/1m calculation (first payment 10,286.13 RUB), lead term prefill and preservation on back, inline empty-contact errors, helper predefined answer, Escape and trigger focus restoration. Representative screenshots are local in evidence/v3/. Reduced-motion branches reviewed in source; OS reduced-motion toggle not exercised in browser.

## Revision 4 — immersive architectural glass (2026-10-26)
The owner rejected revision 3 as matte, fragmented and too loosely spaced. New supplied screenshot codex-clipboard-1ce7845a-07fc-4dc9-b16c-da42c7f43a02.png was visually inspected: continuous office/city backdrop, generous hero scale, a single tall sculptural glass stack, pill actions, a lightly transparent lower panel and compact section rhythm. This supersedes revision 3's framed hero, separate frosted mini-plates and solid emerald buttons. Its approval, amounts, rates and AI claims are reference content, not business facts.

Lock: full-bleed 740px-scale hero with shorter, calmer headline; original office panorama; one layered clear-glass object at right carrying actual brokerage process information. Use thin polished edges, no heavy white fills or fog. Buttons use transparent charcoal/emerald tint, 8px blur and specular rim rather than flat saturated fill. Secondary actions are clear. Shared cyan/emerald daylight across the page replaces isolated tinted panels. Desktop section rhythm 48–56px, mobile 34–40px. Condense benefits into an unboxed line.

Live effect: pointer-driven subtle tilt through existing Motion springs, disabled for touch/reduced motion; a slow transform-only caustic light pass on hero, disabled under reduced motion and on phones. No WebGL dependency, scroll-jacking, rates/approval theater or new AI service. Keep working helper and 30-year calculation contract.

Visual QA must compare source AND built assets: desktop, tablet and phone; confirm standard backdrop-filter survives minification, preserve readable text over imagery, overflow/focus/forms/calculator checks. Existing 21st glass and Kokonut references were inspected in revision 3; the owner's new screenshot is dominant for this bounded correction. Refero remains blocked by NO_SUBSCRIPTION as recorded above. No external component code or new assets adopted.

Revision 4 verification: 19 tests pass and Pages build succeeds. Actual built preview inspected at desktop; computed crystal backdrop is blur(7px) saturate(1.18), primary button uses alpha 0.84/0.72 tint with only 1px blur, daylight-pass animation is present. Tablet 805px and phone 375px checked without horizontal overflow; mobile CTAs remain single-line/full-width. 360-month calculator prefill reached the lead dialog unchanged. Service-card spacing inspected; no browser console errors. Screenshots retained locally in evidence/v4/. Pointer response and reduced-motion handling are implemented through existing Motion springs/branches; OS preference toggle was not exercised.

## Revision 5 — mobile integrity and trust before contact (2026-10-26)
Owner supplied two actual iPhone/Telegram/Safari screenshots. Inspected failures: lower fee plate clipped by hero overflow and benefits immediately cover the sculpture; consultation image/caption horizontally cropped. Fix actual transformed bounds, not simply overflow hiding. Mobile hero gets a defined unscaled stage with scaled inner sculpture and full lower-plate clearance. Consultation grid/visual use min-width:0, explicit responsive image bounds and caption wrapping; no fake arrow implying an unavailable destination.

Service journey changes from immediate lead modal to accessible expandable service cards. Each card explains relevant tasks, how brokerage support works, and what to clarify before inviting contact. Add concise trust commitments grounded only in confirmed facts (individual analysis, agreed terms, postpayment, creditor decision); no invented outcomes, employees, ratings, partnerships or legal details. Preserve existing application adapter and demo disclosure.

Photography: replace mismatched room photos with independently licensed illustrative photographs selected for real financial planning, business discussion, property and document review. Use natural daylight, restrained CSS saturation/contrast and a subtle consistent green surface tint. Source images must be visually inspected and recorded in ASSETS.md. Stock people are illustrative, never represented as actual staff or clients. No new animation library. Accordion uses Motion height/opacity up to 240ms, reduced-motion instant. QA: 320/390/430 mobile widths, tablet/desktop; full sculpture clear of next section; photo caption within bounds; expand/collapse keyboard and contact only after service explanation.

Revision 5 QA: 19 tests and Pages build pass. Mobile content widths 305/375/415 (viewport presets 320/390/430 with scrollbar) have no horizontal overflow. Fee plate ends 45–51px before next section; consultation caption stays entirely inside image bounds and heading scroll width equals client width at the narrowest size. Enter expands service details with no dialog; Tab reaches contact after explanatory content; business contact opens the lead form with checked service=business. All four panels were opened and refinancing keyboard collapse checked. Tablet layout and new image crops inspected; all five runtime images loaded. Original screenshots and local checks in evidence/v5/; all ten new WebP assets decoded, dimensions/hashes recorded in evidence/v5/assets.json. No iOS hardware runtime was available; responsive browser checks use the supplied iOS screenshots as failure references.

## Revision 6 — bespoke generated imagery (2026-10-26)
Owner rejected the stock series and explicitly requested generation. Replaced all five runtime v5 image roles with individually generated photorealistic illustrative scenes. Common direction: sage/emerald accents, ivory stone, light oak, natural daylight and tactile materials; no staged people, logos, fake employees, money or invented approval claims. Original generated outputs visually inspected; 4:3 framing composed for safe service-card/mobile crops. v6 assets replace v5 paths, inherited stock desaturation filters removed, responsive dimensions preserved. Exact final prompts and built-in generation mode in docs/IMAGE_PROMPTS_V6.md. Source PNG copies in evidence/v6/, production WebP in public/images/. Existing mobile fixes and expandable-service contracts preserved.

Revision 6 QA: production Pages build passes; all ten WebP derivatives decoded and hashed in evidence/v6/assets.json. Desktop and 375px mobile content viewport inspected in the built preview: new images load, intended subjects remain visible in crops, consultation stays inside its bounds, and no horizontal page overflow. Screenshots saved in evidence/v6/. No business logic changed; prior 19-test result is from revision 5, not rerun for this image replacement.
