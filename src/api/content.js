import { fetchAPI, safeJson } from './client'

/**
 * Generate Amazon-compliant copy for an A+ Content, Brand Story,
 * or Storefront Designer module.
 *
 * @param {object} params
 * @param {string} params.asin        - 10-char ASIN
 * @param {string} params.pageType    - 'aplus' | 'brand_story' | 'storefront'
 * @param {string} params.moduleType  - module/widget id e.g. 'single-image-highlights'
 * @param {string} [params.marketplace] - defaults to 'US'
 *
 * @returns {Promise<{headline, body, highlights, specs, qa_pairs}>}
 */
export async function generateModuleContent({ asin, pageType, moduleType, marketplace = 'US' }) {
  const res = await fetchAPI('/api/content/generate', {
    method: 'POST',
    body: JSON.stringify({
      asin,
      page_type: pageType,
      module_type: moduleType,
      marketplace,
    }),
  })

  if (!res.ok) {
    const err = await safeJson(res)
    throw new Error(
      typeof err?.detail === 'string'
        ? err.detail
        : `Content generation failed (${res.status})`
    )
  }

  return safeJson(res)
}
