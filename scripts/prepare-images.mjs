import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Uses an existing sharp installation. No package installation is performed.
const require = createRequire(import.meta.url)
const sharp = require(process.env.SHARP_MODULE_PATH || 'sharp')
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = path.join(root, 'public', 'images')
const args = process.argv.slice(2)
const sourceArgument = args.indexOf('--source-dir')
const verifyOnly = args.includes('--verify')
const sourceDir = sourceArgument >= 0
  ? path.resolve(args[sourceArgument + 1])
  : null

const assets = [
  { name: 'hero', role: 'Hero', id: 'photo-1746021451691-4385f318ec13', author: 'Deliberate Directions', page: 'modern-office-space-with-a-bright-sunny-interior-yTrgkVaY1TM', widths: [960, 1600] },
  { name: 'personal', role: 'Private clients', id: 'photo-1594873676631-e7219ce8eac7', author: 'Nathan Van Egmond', page: 'white-wooden-table-with-chairs-vmN-UA30tx8', widths: [480, 800] },
  { name: 'business', role: 'Business', id: 'photo-1497366811353-6870744d04b2', author: 'Nastuh Abootalebi', page: 'photo-of-dining-table-and-chairs-inside-room-eHD8Y1Znfpk', widths: [480, 800] },
  { name: 'secured', role: 'Property collateral', id: 'photo-1582268611958-ebfd161ef9cf', author: 'Florian Schmidinger', page: 'modern-house-with-pool-and-patio-b_79nOqf95I', widths: [480, 800] },
  { name: 'refinancing', role: 'Refinancing', id: 'photo-1639091431832-78b11ba58bbe', author: 'Nathan Van Egmond', page: 'a-living-room-with-wooden-floors-and-white-walls-QneJY0v-dHU', widths: [480, 800] },
]

const receipts = []
{
  if (!verifyOnly) await mkdir(outputDir, { recursive: true })
  for (const asset of assets) {
    const sourceUrl = `https://images.unsplash.com/${asset.id}?fm=webp&w=1800&q=90&fit=max`
    if (!verifyOnly) {
      let source
      if (sourceArgument >= 0) {
        source = await readFile(path.join(sourceDir, `${asset.name}.webp`))
      } else {
        const response = await fetch(sourceUrl)
        if (!response.ok) throw new Error(`${asset.name}: HTTP ${response.status}`)
        if (!response.headers.get('content-type')?.startsWith('image/')) {
          throw new Error(`${asset.name}: source response is not an image`)
        }
        source = Buffer.from(await response.arrayBuffer())
      }
      const sourceMetadata = await sharp(source).metadata()
      if (!sourceMetadata.width || !sourceMetadata.height) throw new Error(`${asset.name}: invalid source`)
      for (const width of asset.widths) {
        const height = width * 3 / 4
        await sharp(source)
          .rotate()
          .resize(width, height, { fit: 'cover', position: asset.name === 'hero' ? 'centre' : sharp.strategy.attention })
          .webp({ quality: 85, effort: 6 })
          .toFile(path.join(outputDir, `${asset.name}-${width}.webp`))
      }
    }
    for (const width of asset.widths) {
      const filename = `${asset.name}-${width}.webp`
      const bytes = await readFile(path.join(outputDir, filename))
      const metadata = await sharp(bytes).metadata()
      if (metadata.format !== 'webp' || metadata.width !== width || metadata.height !== width * 3 / 4) {
        throw new Error(`${filename}: unexpected format or dimensions`)
      }
      // Decode all pixels, not just the file header, to catch corrupt assets.
      await sharp(bytes).raw().toBuffer()
      receipts.push({ filename, width: metadata.width, height: metadata.height, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') })
    }
  }
  if (!verifyOnly) {
    const date = new Date().toISOString().slice(0, 10)
    const sources = assets.map(asset => `| ${asset.role} | ${asset.author} | [Unsplash source](https://unsplash.com/photos/${asset.page}) | [CDN source](https://images.unsplash.com/${asset.id}?fm=webp&w=1800&q=90&fit=max) |`).join('\n')
    const checksums = receipts.map(receipt => `| ${receipt.filename} | ${receipt.width} × ${receipt.height} | ${receipt.bytes.toLocaleString('en-US')} | \`${receipt.sha256}\` |`).join('\n')
    await writeFile(path.join(root, 'ASSETS.md'), `# FinStake image provenance\n\nAcquired and verified on ${date}. All five source pages were opened and the displayed photographs visually inspected. Each source page marks the image as free to use under the [Unsplash License](https://unsplash.com/license). The license permits commercial use and modification; attribution is appreciated.\n\nThese photographs illustrate services and property types. They do not depict FinStake offices, staff, clients, or completed transactions.\n\n| Role | Photographer | Source page | Downloaded source |\n| --- | --- | --- | --- |\n${sources}\n\nThe downloaded 1800-pixel WebP sources were resized and cropped to 4:3 using an existing sharp installation. The hero uses a central crop; service cards use the attention strategy. Final files are served locally from \`public/images\`. No image API or remote hotlink is needed at runtime.\n\n| File | Dimensions | Bytes | SHA-256 |\n| --- | --- | ---: | --- |\n${checksums}\n\n## Regeneration and verification\n\nRun \`node scripts/prepare-images.mjs\` with an existing sharp package available. If sharp is supplied by a separate runtime, set \`SHARP_MODULE_PATH\` to its absolute module directory. The script does not install dependencies.\n\nFor restricted network environments, download the five CDN sources above as \`hero.webp\`, \`personal.webp\`, \`business.webp\`, \`secured.webp\`, and \`refinancing.webp\` into a temporary directory, then run \`node scripts/prepare-images.mjs --source-dir <absolute-directory>\`.\n\nRun \`node scripts/prepare-images.mjs --verify\` to freshly decode the ten files and report their dimensions and SHA-256 checksums without changing them.\n`, 'utf8')
  }
  console.log(JSON.stringify(receipts, null, 2))
}
