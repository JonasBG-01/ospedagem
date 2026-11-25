import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { extname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectDirectory = fileURLToPath(new URL('../', import.meta.url))
const imageDirectory = join(projectDirectory, 'public', 'images')
const publicDirectory = join(projectDirectory, 'public')
const imageExtensions = new Set(['.avif', '.bmp', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp'])

async function findImages(directory, root = directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async entry => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return findImages(path, root)
    if (!entry.isFile() || !imageExtensions.has(extname(entry.name).toLowerCase())) return []
    return [`/images/${relative(root, path).split(sep).join('/')}`]
  }))
  return nested.flat()
}

await mkdir(imageDirectory, { recursive: true })
const images = (await findImages(imageDirectory)).sort((a, b) => a.localeCompare(b))
await writeFile(join(publicDirectory, 'images-manifest.json'), `${JSON.stringify(images, null, 2)}\n`)
