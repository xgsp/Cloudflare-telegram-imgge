export async function onRequestPost({ request, env }) {
  // ✅ 鉴权
  const apiKey = request.headers.get('X-API-Key');
  if (!apiKey || apiKey !== env.UPLOAD_API_KEY) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { content } = await request.json();

    if (!content) {
      return new Response(JSON.stringify({ error: 'No content provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 从内容中提取所有 t.me 链接
    // 支持格式：
    //   https://t.me/频道/19        （公开频道）
    //   https://t.me/c/1002370158691/19       （私有频道）
    const publicPattern = /https:\/\/t\.me\/([a-zA-Z0-9_]+)\/(\d+)/g;
    const privatePattern = /https:\/\/t\.me\/c\/(\d+)\/(\d+)/g;

    const deleteJobs = [];

    // 公开频道链接
    let match;
    while ((match = publicPattern.exec(content)) !== null) {
      const msgId = parseInt(match[2]);
      deleteJobs.push(msgId);
    }

    // 私有频道链接
    while ((match = privatePattern.exec(content)) !== null) {
      const msgId = parseInt(match[2]);
      deleteJobs.push(msgId);
    }

    if (deleteJobs.length === 0) {
      return new Response(JSON.stringify({ success: true, deleted: 0, message: 'No t.me links found' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 去重
    const uniqueMsgIds = [...new Set(deleteJobs)];

    // 逐一删除 Telegram 消息
    const results = await Promise.all(
      uniqueMsgIds.map(async (msgId) => {
        const res = await fetch(
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
        const data = await res.json();
        return { msgId, ok: data.ok, error: data.description || null };
      })
    );

    // 同步删除 KV 中对应记录
    const kvList = await env.IMAGE_DB.list();
    for (const { name } of kvList.keys) {
      const raw = await env.IMAGE_DB.get(name);
      if (!raw) continue;
      const record = JSON.parse(raw);
      if (uniqueMsgIds.includes(record.msgId)) {
        await env.IMAGE_DB.delete(name);
      }
    }

    const deletedCount = results.filter(r => r.ok).length;

    return new Response(JSON.stringify({
      success: true,
      deleted: deletedCount,
      results
    }), {
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
