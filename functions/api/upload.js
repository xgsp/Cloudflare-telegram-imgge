// 图片上传 API

// 支持的图片 MIME 类型白名单
export const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff'
];

// 文件大小限制：50MB
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

// 检查文件类型是否在白名单中
export function isAllowedType(mimeType) {
  return ALLOWED_TYPES.includes(mimeType);
}

// 生成唯一 ID
export function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const tags = formData.get('tags') || '';
    const folder = formData.get('folder') || 'default';

    if (!file) {
      return new Response(JSON.stringify({ success: false, error: '没有文件' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查文件类型
    if (!isAllowedType(file.type)) {
      return new Response(JSON.stringify({ success: false, error: '只支持图片文件（JPEG、PNG、GIF、WebP、SVG、BMP、TIFF）' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ success: false, error: '文件大小超过 50MB 限制' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取配置
    const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return new Response(JSON.stringify({ success: false, error: '配置错误：缺少 Bot Token 或 Chat ID' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 上传到 Telegram（使用 sendDocument 避免图片尺寸和大小限制）
    const telegramFormData = new FormData();
    telegramFormData.append('chat_id', CHAT_ID);
    telegramFormData.append('document', file);

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
      {
        method: 'POST',
        body: telegramFormData
      }
    );

    const telegramResult = await telegramResponse.json();

    if (!telegramResult.ok) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Telegram 上传失败：' + (telegramResult.description || '未知错误')
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取文件信息（从 document 对象提取 file_id）
    const fileId = telegramResult.result.document.file_id;
    const messageId = telegramResult.result.message_id;

    // 生成唯一 ID
    const imageId = generateId();
    const timestamp = Date.now();

    // 构建代理 URL（不暴露 Bot Token）
    // 自动使用当前请求的域名（支持 pages.dev 和自定义域名）
    const url = new URL(request.url);
    const imageUrl = `${url.protocol}//${url.host}/api/image/${imageId}`;

    // 保存到 KV
    const imageData = {
      id: imageId,
      url: imageUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
      uploadTime: timestamp,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      folder: folder,
      telegram: {
        fileId: fileId,
        messageId: messageId
      }
    };

    await env.IMAGE_DB.put(imageId, JSON.stringify(imageData));

    return new Response(JSON.stringify({ 
      success: true, 
      data: imageData 
    }), {
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
