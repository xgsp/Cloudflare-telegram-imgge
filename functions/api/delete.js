export async function onRequestDelete({ request, env, params }) {
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
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const raw = await env.IMAGE_DB.get(id);
    if (!raw) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { msgId } = JSON.parse(raw);

    // 同步删除 Telegram 消息
    await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/deleteMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          message_id: msgId
        })
      }
    );

    // 删除 KV 记录
    await env.IMAGE_DB.delete(id);

    return new Response(JSON.stringify({ success: true }), {
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
