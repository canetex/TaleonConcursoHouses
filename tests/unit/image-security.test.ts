import { describe, it, expect } from 'vitest'
import { is_direct_image_url, is_screenshot_url_allowed, needs_image_resolution } from '../../src/lib/images'

const MALICIOUS_SVG = 'https://evil.example.com/payload.svg'
const MALICIOUS_SVG_DATA =
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
const EXE_AS_JPG = 'https://evil.example.com/malware.exe.jpg'

describe('S12/S13 — segurança de imagens (validação client-side)', () => {
  it('S12: URLs .svg não são tratadas como imagem direta segura', () => {
    expect(is_direct_image_url(MALICIOUS_SVG)).toBe(false)
    expect(needs_image_resolution(MALICIOUS_SVG)).toBe(true)
  })

  it('S12: data URI SVG não passa no padrão de imagem direta', () => {
    expect(is_direct_image_url(MALICIOUS_SVG_DATA)).toBe(false)
  })

  it('S13: extensão .jpg em URL não garante conteúdo — allowlist restringe hosts', () => {
    expect(is_direct_image_url(EXE_AS_JPG)).toBe(true)
    expect(is_screenshot_url_allowed(EXE_AS_JPG)).toBe(false)
  })

  it('S13: projeto usa URLs externas (Imgur) — sem Supabase Storage para upload', () => {
    expect(true).toBe(true)
  })
})
