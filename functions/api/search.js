export async function onRequestGet({ request, env }) {
  // ✅ 鉴权
  const apiKey = request.headers.get('X-API-Key');
  if (!apiKey || apiKey !== env.UPLOAD_API_KEY) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.toLowerCase() || '';

    const list = await env.IMAGE_DB.list();
    const baseUrl = url.origin;

    const results = [];
    for (const { name } of list.keys) {
      const raw = await env.IMAGE_DB.get(name);
      const data = JSON.parse(raw);
      if (!query || data.name?.toLowerCase().includes(query)) {
        results.push({
          id: name,
          url: `${baseUrl}/api/image/${name}`,
          ...data
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
