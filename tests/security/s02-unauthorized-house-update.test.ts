import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

// @vitest-environment node

const PROBE_PATH = resolve(process.cwd(), 'tests/security/probes/s02-probe.mjs')

describe('S02 — update não autorizado em houses (integração Supabase)', () => {
  it(
    'deve rejeitar update de casa alheia; falha se vulnerabilidade estiver ativa',
    () => {
      let exit_code = 0
      let stdout = ''
      let stderr = ''

      try {
        stdout = execFileSync('node', [PROBE_PATH], {
          encoding: 'utf8',
          cwd: process.cwd(),
          env: { ...process.env },
          stdio: ['ignore', 'pipe', 'pipe'],
          timeout: 25_000,
        })
      } catch (error) {
        const exec_error = error as NodeJS.ErrnoException & {
          status?: number
          stdout?: string
          stderr?: string
        }
        exit_code = exec_error.status ?? 1
        stdout = exec_error.stdout ?? ''
        stderr = exec_error.stderr ?? ''
      }

      if (exit_code === 2) {
        console.warn('[S02] Probe ignorado:', stderr || stdout)
        return
      }

      if (exit_code === 1) {
        let detail = stderr.trim()
        try {
          const parsed = JSON.parse(detail) as { message?: string; house_id?: string }
          detail = `${parsed.message ?? detail} (casa: ${parsed.house_id ?? '?'})`
        } catch {
          // mantém stderr bruto
        }
        expect.fail(`VULNERABILIDADE S02 CONFIRMADA: ${detail}`)
      }

      expect(exit_code).toBe(0)
      expect(stderr).not.toMatch(/VULNERABLE/)
    },
    30_000,
  )
})
