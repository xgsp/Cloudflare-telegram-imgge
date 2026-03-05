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
    const list = await env.IMAGE_DB.list();
    const baseUrl = new URL(request.url).origin;

    const images = await Promise.all(
      list.keys.map(async ({ name }) => {
        const raw = await env.IMAGE_DB.get(name);
        const data = JSON.parse(raw);
        return {
          id: name,
          url: `${baseUrl}/api/image/${name}`,
          ...data
        };
      })
    );

    return new Response(JSON.stringify({ images }), {
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
