import { fetchAPI } from './client'

export async function lookupASIN(asin, marketplace = 'US') {
  const res = await fetchAPI(`/api/asin/${asin}?marketplace=${marketplace}`)
  if (res.status === 404) {
    const err = await res.json()
    throw new Error(err.detail || 'Product not found')
  }
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Lookup failed')
  }
  const data = await res.json()
  return data.product
}
