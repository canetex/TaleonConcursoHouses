import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { expect } from 'vitest'

export interface ProbeResult {
  exit_code: number
  stdout: string
  stderr: string
}

export function run_security_probe(probe_relative_path: string): ProbeResult {
  const probe_path = resolve(process.cwd(), probe_relative_path)
  let exit_code = 0
  let stdout = ''
  let stderr = ''

  try {
    stdout = execFileSync('node', [probe_path], {
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

  return { exit_code, stdout, stderr }
}

export function assert_probe_expects_rejection(
  probe_relative_path: string,
  vulnerability_label: string,
): void {
  const { exit_code, stdout, stderr } = run_security_probe(probe_relative_path)

  if (exit_code === 2) {
    console.warn(`[${vulnerability_label}] Probe ignorado:`, stderr || stdout)
    return
  }

  if (exit_code === 1) {
    let detail = stderr.trim()
    try {
      const parsed = JSON.parse(detail) as { message?: string }
      detail = parsed.message ?? detail
    } catch {
      // mantém stderr bruto
    }
    expect.fail(`VULNERABILIDADE ${vulnerability_label} CONFIRMADA: ${detail}`)
  }

  expect(exit_code).toBe(0)
}
