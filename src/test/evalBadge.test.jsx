import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import EvalScoreBadge from '../components/EvalScoreBadge'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../api/eval', () => ({
  scoreImage: vi.fn(),
}))

import { scoreImage } from '../api/eval'

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('EvalScoreBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing visible when imageUrl is null', () => {
    const { container } = render(
      <EvalScoreBadge imageUrl={null} prompt="A product on white background" />
    )

    // Status is 'idle' → component returns null
    expect(container.firstChild).toBeNull()

    // scoreImage should never be called when imageUrl is absent
    expect(scoreImage).not.toHaveBeenCalled()
  })

  it('shows loading state when imageUrl and prompt are provided', async () => {
    // scoreImage returns a promise that never resolves (pending forever)
    scoreImage.mockReturnValue(new Promise(() => {}))

    render(
      <EvalScoreBadge
        imageUrl="https://example.com/image.webp"
        prompt="A product on white background"
        contentType="listing_main"
      />
    )

    // The loading badge should appear after the effect fires
    await waitFor(() => {
      expect(screen.getByText(/scoring image/i)).toBeInTheDocument()
    })

    expect(scoreImage).toHaveBeenCalledOnce()
    expect(scoreImage).toHaveBeenCalledWith(
      'https://example.com/image.webp',
      'A product on white background',
      'listing_main'
    )
  })

  it('shows score badge with composite score after scoreImage resolves', async () => {
    const mockResult = {
      composite: 4.2,
      passed: true,
      dimensions: [],
      strengths: [],
      improvements: [],
    }

    scoreImage.mockResolvedValue(mockResult)

    render(
      <EvalScoreBadge
        imageUrl="https://example.com/image.webp"
        prompt="A clean product shot"
        contentType="listing_main"
      />
    )

    // Wait for the scored badge to appear showing composite score
    await waitFor(() => {
      expect(screen.getByText('4.2/5')).toBeInTheDocument()
    })

    // Should show PASS since passed: true
    expect(screen.getByText(/✓ PASS/)).toBeInTheDocument()

    // Loading text should be gone
    expect(screen.queryByText(/scoring image/i)).not.toBeInTheDocument()
  })
})
