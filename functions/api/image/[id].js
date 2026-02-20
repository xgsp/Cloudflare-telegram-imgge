// 图片代理 API - 通过 ID 获取图片
export async function onRequest(context) {
  const { request, env, params } = context;
  const imageId = params.id;

  try {
    // 从 KV 获取图片信息
    const imageData = await env.IMAGE_DB.get(imageId);
    
    if (!imageData) {
      return new Response('Image not found', { status: 404 });
    }

    const image = JSON.parse(imageData);
    const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;

    // 获取 Telegram 文件
    const fileResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${image.telegram.fileId}`
    );
    const fileResult = await fileResponse.json();

    if (!fileResult.ok) {
      return new Response('Failed to get file', { status: 500 });
    }

    // 获取实际图片
    const imageUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileResult.result.file_path}`;
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      return new Response('Failed to fetch image', { status: 500 });
    }

    // 返回图片，添加缓存头
    return new Response(imageResponse.body, {
      headers: {
        'Content-Type': image.type || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
        'Content-Disposition': `inline; filename="${image.filename}"`,
      }
    });

  } catch (error) {
    return new Response('Internal Server Error', { status: 500 });
  }
}
