import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateCopy } from '../api/copywriter'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../api/client', () => ({
  fetchAPI: vi.fn(),
  safeJson: vi.fn(),
}))

import { fetchAPI, safeJson } from '../api/client'

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('generateCopy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('splits comma-separated keywords into an array and posts them correctly', async () => {
    // Arrange — mock a successful response
    const mockResponse = { ok: true, status: 200 }
    fetchAPI.mockResolvedValue(mockResponse)
    safeJson.mockResolvedValue({
      title: 'Great Product',
      bullets: ['bullet1', 'bullet2'],
      description: 'A great product description.',
    })

    // Act
    const result = await generateCopy({
      asin: 'B001234567',
      marketplace: 'US',
      language: 'English',
      tone: 'professional',
      keywords: 'keyword one, keyword two , keyword three',
    })

    // Assert — fetchAPI was called with the split keyword array
    expect(fetchAPI).toHaveBeenCalledOnce()
    const [path, options] = fetchAPI.mock.calls[0]
    expect(path).toBe('/api/copywriter/generate')
    expect(options.method).toBe('POST')

    const body = JSON.parse(options.body)
    expect(body.keywords).toEqual(['keyword one', 'keyword two', 'keyword three'])
    expect(body.asin).toBe('B001234567')
    expect(result.title).toBe('Great Product')
  })

  it('throws an error with code asin_lookup_failed when detail.code matches', async () => {
    // Arrange — mock a 422 response with asin_lookup_failed code
    const mockResponse = { ok: false, status: 422 }
    fetchAPI.mockResolvedValue(mockResponse)
    safeJson.mockResolvedValue({
      detail: {
        code: 'asin_lookup_failed',
        message: 'Could not look up ASIN B000INVALID on marketplace US',
      },
    })

    // Act & Assert
    await expect(
      generateCopy({
        asin: 'B000INVALID',
        marketplace: 'US',
        language: 'English',
        tone: 'professional',
        keywords: 'some keyword',
      })
    ).rejects.toMatchObject({
      message: 'Could not look up ASIN B000INVALID on marketplace US',
      code: 'asin_lookup_failed',
    })
  })

  it('throws a generic error message on other failures', async () => {
    // Arrange — mock a 500 response with a plain string detail
    const mockResponse = { ok: false, status: 500 }
    fetchAPI.mockResolvedValue(mockResponse)
    safeJson.mockResolvedValue({
      detail: 'Internal server error',
    })

    // Act & Assert
    await expect(
      generateCopy({
        asin: 'B001234567',
        marketplace: 'US',
        language: 'English',
        tone: 'professional',
        keywords: 'test',
      })
    ).rejects.toThrow('Internal server error')
  })

  it('throws a fallback error with status code when detail is absent', async () => {
    // Arrange — mock a 503 with no useful body
    const mockResponse = { ok: false, status: 503 }
    fetchAPI.mockResolvedValue(mockResponse)
    safeJson.mockResolvedValue(null)

    // Act & Assert
    await expect(
      generateCopy({
        asin: 'B001234567',
        marketplace: 'US',
        language: 'English',
        tone: 'professional',
        keywords: 'test',
      })
    ).rejects.toThrow('Copy generation failed (503)')
  })
})
