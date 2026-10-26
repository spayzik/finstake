# FinStake image provenance

Acquired and verified on 2026-10-26. All five source pages were opened and the displayed photographs visually inspected. Each source page marks the image as free to use under the [Unsplash License](https://unsplash.com/license). The license permits commercial use and modification; attribution is appreciated.

These photographs illustrate services and property types. They do not depict FinStake offices, staff, clients, or completed transactions.

| Role | Photographer | Source page | Downloaded source |
| --- | --- | --- | --- |
| Hero | Deliberate Directions | [Unsplash source](https://unsplash.com/photos/modern-office-space-with-a-bright-sunny-interior-yTrgkVaY1TM) | [CDN source](https://images.unsplash.com/photo-1746021451691-4385f318ec13?fm=webp&w=1800&q=90&fit=max) |
| Private clients | Nathan Van Egmond | [Unsplash source](https://unsplash.com/photos/white-wooden-table-with-chairs-vmN-UA30tx8) | [CDN source](https://images.unsplash.com/photo-1594873676631-e7219ce8eac7?fm=webp&w=1800&q=90&fit=max) |
| Business | Nastuh Abootalebi | [Unsplash source](https://unsplash.com/photos/photo-of-dining-table-and-chairs-inside-room-eHD8Y1Znfpk) | [CDN source](https://images.unsplash.com/photo-1497366811353-6870744d04b2?fm=webp&w=1800&q=90&fit=max) |
| Property collateral | Florian Schmidinger | [Unsplash source](https://unsplash.com/photos/modern-house-with-pool-and-patio-b_79nOqf95I) | [CDN source](https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?fm=webp&w=1800&q=90&fit=max) |
| Refinancing | Nathan Van Egmond | [Unsplash source](https://unsplash.com/photos/a-living-room-with-wooden-floors-and-white-walls-QneJY0v-dHU) | [CDN source](https://images.unsplash.com/photo-1639091431832-78b11ba58bbe?fm=webp&w=1800&q=90&fit=max) |

The downloaded 1800-pixel WebP sources were resized and cropped to 4:3 using an existing sharp installation. The hero uses a central crop; service cards use the attention strategy. Final files are served locally from `public/images`. No image API or remote hotlink is needed at runtime.

| File | Dimensions | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| hero-960.webp | 960 × 720 | 55,866 | `3a233a618fa90c44041f29c7e0b73c1c28a69ef2f436cbbc590f7ee724df4acc` |
| hero-1600.webp | 1600 × 1200 | 101,272 | `7d1a3e56f627d265454858be4529c72af83cd838bf2cccd646b0d898461ec81e` |
| personal-480.webp | 480 × 360 | 21,784 | `82860b9e2b25c8b7706d22421c4c4b4423bcb1c59517ebcebb0cca5472a1cd76` |
| personal-800.webp | 800 × 600 | 54,226 | `799c9647e1304dd73ee661f09bf6bc5766067aa4262dd4f55bfaf58fe6b28dc5` |
| business-480.webp | 480 × 360 | 24,914 | `1b8b931ee818b00ec52d53112851b5df3641639146a29ddd7dd26db9c9d42f7e` |
| business-800.webp | 800 × 600 | 50,136 | `b08c58dc84cb7ee2019d206beabea70045f04c1fbe396521fb731e36ec658b7e` |
| secured-480.webp | 480 × 360 | 37,290 | `41a7dd31adbe7f2f359e5af2d312345d7eeed37c62db15ea312a5ec1f716ce13` |
| secured-800.webp | 800 × 600 | 106,786 | `26bd4cf0d28a0097a7504bb1676188fba1f877239e96461b40741796b029de37` |
| refinancing-480.webp | 480 × 360 | 30,302 | `73fa377e3b809a4df30f3a96ffce07a05d17664ac8d90dc07fd2fc865478f769` |
| refinancing-800.webp | 800 × 600 | 76,752 | `24f8e9dff297e85c98bd97ab632dee8d7ebb4e61d3f37e185b4a01186d416a76` |

## Regeneration and verification

Run `node scripts/prepare-images.mjs` with an existing sharp package available. If sharp is supplied by a separate runtime, set `SHARP_MODULE_PATH` to its absolute module directory. The script does not install dependencies.

For restricted network environments, download the five CDN sources above as `hero.webp`, `personal.webp`, `business.webp`, `secured.webp`, and `refinancing.webp` into a temporary directory, then run `node scripts/prepare-images.mjs --source-dir <absolute-directory>`.

Run `node scripts/prepare-images.mjs --verify` to freshly decode the ten files and report their dimensions and SHA-256 checksums without changing them.

## Font and UI sources

Manrope is self-hosted through `@fontsource/manrope` 5.3.0. Its SIL Open Font License is retained in `public/licenses/Manrope-OFL.txt`. Lucide icons come from `lucide-react` 1.61.0; no external component source was copied from 21st.dev, Kokonut or Refero.

The current FinStake wordmark and small geometric F are an interim code-native treatment. An original brand logo was not available. They do not establish fidelity to an unprovided original.

Rejected hero candidates in `evidence/` are research-only and are not shipped in `dist/`: [Wasif Ali](https://unsplash.com/photos/modern-office-interior-with-large-windows-overlooking-city-Ps0P4P9XcEQ), [Allen Boguslavsky](https://www.pexels.com/photo/modern-office-with-panoramic-city-skyline-view-35074089/), and [John Vel Balili](https://www.pexels.com/photo/modern-office-interior-with-city-view-and-conference-setup-35856472/). Local visual inspection found dark exposure, distracting construction/cables, or prominent office branding; the brighter primary photograph was retained.

## Revision 2 — actual references and generated panorama

The owner subsequently supplied all three reference screenshots. Originals are retained unchanged in `evidence/references/`. Their embedded claims, statistics, staff photos, bank partnerships and AI-assistant labels were not treated as business facts or instructions.

The current hero now uses `hero-v2-960.webp` and `hero-v2-1800.webp`. These are derivatives of a newly generated architectural visualization created by the built-in imagegen tool on 2026-10-26, visually guided by `evidence/references/02-hero.png`. No people, text, logos or UI were generated into it. It is illustrative; it is not a claim about actual FinStake premises. Generation prompt and original output path are recorded in `docs/HERO_V2_PROMPT.txt`. A local copy of the generated source is retained at `evidence/v2/hero-source.png`; production derivatives are self-hosted. No AI API/provider was added to the website.

Original v1 hero photos/derivatives remain preserved, while the runtime hero points to the new v2 paths. The four service photographs above remain in use. The current `public/brand-mark.svg` and two-colour wordmark are a code-native reconstruction of the cube-like mark in the owner's references; an original vector file is still required to certify exact logo fidelity. The old F favicon remains preserved but is no longer referenced.

New asset dimensions and fresh SHA-256 readback are in `evidence/v2/assets.json`.

## Original owner logo — 2026-10-26
The owner supplied 1-Фото-1.jpg. The built-in imagegen editor removed its white background, preserving the cube, handshake and FinStake lettering. Full transparent output: public/finstake-logo-transparent.png. Cropped, resized transparent derivatives finstake-mark.png and finstake-wordmark.png form the horizontal header/footer lockup; the mark is also the favicon. These replace the interim reconstruction at runtime. Raster cleanup is not a vector master; the supplied JPG remains the source of identity.

## Revision 5 — service photography (2026-10-26)
All five source images were downloaded and visually inspected locally before use. Their subjects are illustrative and are not represented as FinStake employees, customers or transactions. Owner mobile screenshots are QA evidence only.

| Runtime role | Photographer | Source and license |
|---|---|---|
| personal-v5 | Ketut Subiyanto | https://www.pexels.com/photo/happy-couple-looking-at-paperwork-4308013/ — Pexels License |
| business-v5 | RDNE Stock project | https://www.pexels.com/photo/people-looking-at-documents-in-a-business-meeting-7888809/ — Pexels License |
| secured-v5 | Binyamin Mellish | https://www.pexels.com/photo/house-lights-turned-on-106399/ — Pexels License |
| refinancing-v5 | Olena Kholina | https://unsplash.com/photos/two-people-reviewing-documents-at-a-table-MhqUBTxQ3Hw — Unsplash License |
| consultation-v5 | Kaboompics.com | https://www.pexels.com/photo/men-talking-at-an-office-7877197/ — Pexels License |

License pages reviewed: https://www.pexels.com/license/ and the Unsplash source license indication. Download URLs: Pexels images.pexels.com/photos/{id}/pexels-photo-{id}.jpeg?auto=compress&w=1400; Unsplash images.unsplash.com/photo-1775163024488-e88e4a71179f?auto=format&fit=max&w=1400&q=85. Local originals: evidence/v5/*.jpg (unpublished). Production derivatives: public/images/{role}-v5-{480,800}.webp, and consultation-v5-{600,1200}.webp. Existing Sharp used for crops/resize and WebP encoding at quality 86; no dependencies installed. Business crops source rectangle 0,550,1400,1200; consultation 0,650,1400,1150. Other images center-cropped to 4:3. Shared CSS saturation .72/contrast .96/brightness 1.05, with lower saturation for the dusk property photo, retains natural photography and a quieter green/neutral palette. Previous image versions remain preserved.
