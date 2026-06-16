import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const functions = [
  'upsert-house',
  'update-profile',
  'cast-vote',
  'get-my-votes',
  'admin-update-house',
]

const root_dir = join(process.cwd(), 'supabase', 'functions')
const shared_dir = join(root_dir, '_shared')
const out_dir = join(process.cwd(), '.edge-deploy')
mkdirSync(out_dir, { recursive: true })

const shared_files = readdirSync(shared_dir)
  .filter((entry) => entry.endsWith('.ts'))
  .map((entry) => ({
    name: `_shared/${entry}`,
    content: readFileSync(join(shared_dir, entry), 'utf8'),
  }))

for (const fn_name of functions) {
  const fn_dir = join(root_dir, fn_name)
  let index_content = readFileSync(join(fn_dir, 'index.ts'), 'utf8')
  index_content = index_content.replaceAll('from "../_shared/', 'from "./_shared/')

  const payload = {
    name: fn_name,
    entrypoint_path: 'index.ts',
    verify_jwt: false,
    files: [{ name: 'index.ts', content: index_content }, ...shared_files],
  }

  writeFileSync(join(out_dir, `${fn_name}.json`), JSON.stringify(payload), 'utf8')
  console.log(`prepared ${fn_name}`)
}
