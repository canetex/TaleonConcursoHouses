/**
 * Gera payload JSON para deploy MCP de uma Edge Function com dependências _shared.
 * Uso: node scripts/build-edge-deploy-payload.mjs upsert-house
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..', 'supabase', 'functions')
const fn_name = process.argv[2]

if (!fn_name) {
  console.error('Uso: node scripts/build-edge-deploy-payload.mjs <function-name>')
  process.exit(1)
}

const shared_dir = join(root, '_shared')
const shared_files = readdirSync(shared_dir)
  .filter((f) => f.endsWith('.ts'))
  .map((f) => ({
    name: `_shared/${f}`,
    content: readFileSync(join(shared_dir, f), 'utf8'),
  }))

const index_path = join(root, fn_name, 'index.ts')
let index_content = readFileSync(index_path, 'utf8')
index_content = index_content.replace(/\.\.\/_shared\//g, './_shared/')

const files = [{ name: 'index.ts', content: index_content }, ...shared_files]

const verify_jwt_false = new Set([
  'discord-auth',
  'validate-character',
  'resolve-image-url',
  'house-wiki-coords',
  'upsert-house',
  'cast-vote',
  'update-profile',
  'get-my-votes',
  'admin-update-house',
  'get-contest-phase',
])

console.log(
  JSON.stringify({
    name: fn_name,
    entrypoint_path: 'index.ts',
    verify_jwt: !verify_jwt_false.has(fn_name),
    files,
  }),
)
