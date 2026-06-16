import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.argv[2]
if (!root) {
  console.error('Usage: node bundle-edge-function.mjs <function-dir>')
  process.exit(1)
}

const shared_dir = join(root, '..', '_shared')
const files = []

function add_file(abs_path, name) {
  files.push({ name, content: readFileSync(abs_path, 'utf8') })
}

add_file(join(root, 'index.ts'), 'index.ts')

for (const entry of readdirSync(shared_dir)) {
  const abs = join(shared_dir, entry)
  if (statSync(abs).isFile() && entry.endsWith('.ts')) {
    add_file(abs, `_shared/${entry}`)
  }
}

console.log(JSON.stringify({ function_dir: relative(process.cwd(), root), files }))
