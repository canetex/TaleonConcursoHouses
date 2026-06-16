import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  is_direct_image_url,
  normalize_image_url,
  needs_image_resolution,
  resolve_image_url,
} from '../../src/lib/images'

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}))

import { supabase } from '../../src/lib/supabase'

describe('images', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('U04: URL png direta é reconhecida', () => {
    expect(is_direct_image_url('https://i.imgur.com/abc123.png')).toBe(true)
    expect(is_direct_image_url('https://example.com/photo.jpg')).toBe(true)
  })

  it('U05: álbum Imgur precisa de resolução', () => {
    expect(needs_image_resolution('https://imgur.com/a/opy6MOy')).toBe(true)
    expect(needs_image_resolution('https://i.imgur.com/abc.png')).toBe(false)
  })

  it('U06: normaliza página Imgur para URL direta', () => {
    expect(normalize_image_url('https://imgur.com/abc123')).toBe(
      'https://i.imgur.com/abc123.png',
    )
  })

  it('resolve URL direta sem chamar edge function', async () => {
    const url = await resolve_image_url('https://i.imgur.com/test.png')
    expect(url).toBe('https://i.imgur.com/test.png')
    expect(supabase.functions.invoke).not.toHaveBeenCalled()
  })

  it('resolve álbum via edge function', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { resolved_url: 'https://i.imgur.com/resolved.jpg' },
      error: null,
    } as never)

    const url = await resolve_image_url('https://imgur.com/a/abc')
    expect(url).toBe('https://i.imgur.com/resolved.jpg')
    expect(supabase.functions.invoke).toHaveBeenCalledWith('resolve-image-url', {
      body: { url: 'https://imgur.com/a/abc' },
    })
  })
})
