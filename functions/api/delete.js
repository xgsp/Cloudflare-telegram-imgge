// 删除图片 API
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { id } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: '缺少图片 ID' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 从 KV 获取图片信息
    const imageData = await env.IMAGE_DB.get(id);
    
    if (imageData) {
      const image = JSON.parse(imageData);
      
      // 如果有 Telegram 消息 ID，尝试删除 Telegram 消息
      if (image.telegram && image.telegram.messageId) {
        const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
        const CHAT_ID = env.TELEGRAM_CHAT_ID;
        
        if (BOT_TOKEN && CHAT_ID) {
          try {
            // 调用 Telegram API 删除消息
            await fetch(
              `https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: CHAT_ID,
                  message_id: image.telegram.messageId
                })
              }
            );
            // 注意：即使 Telegram 删除失败，我们也继续删除 KV 记录
          } catch (telegramError) {
            console.error('删除 Telegram 消息失败:', telegramError);
          }
        }
      }
    }

    // 从 KV 删除记录
    await env.IMAGE_DB.delete(id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
