export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export function preflight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  return null
}

// Fetch with retry on transient Gemini errors (429 rate-limit, 503 overload).
// Uses exponential backoff: 500ms, 1500ms, 3500ms.
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  { retries = 3 } = {},
): Promise<Response> {
  const delays = [500, 1500, 3500]
  let lastRes: Response | null = null
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, init)
    if (res.ok) return res
    // Only retry on transient statuses
    if (![429, 500, 502, 503, 504].includes(res.status)) return res
    lastRes = res
    if (i < retries) {
      await new Promise((r) => setTimeout(r, delays[i] ?? 3500))
    }
  }
  return lastRes!
}
