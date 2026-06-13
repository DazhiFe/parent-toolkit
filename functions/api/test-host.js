export async function onRequest(context) {
  const { request } = context
  const url = new URL(request.url)
  return new Response(JSON.stringify({
    hostname: url.hostname,
    host: request.headers.get('host'),
    url: request.url,
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
