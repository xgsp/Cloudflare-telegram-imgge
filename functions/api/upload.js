export async function onRequestPost({ request, env }) {
  const apiKey = request.headers.get('X-API-Key');
  if (!apiKey || apiKey !== env.UPLOAD_API_KEY) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const caption = formData.get('caption') || '';

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // ══ 第1层：MIME 类型白名单 ══════════════════════════════
    const ALLOWED_MIME = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/quicktime', 'video/x-matroska', 'video/webm'
    ];
    const mimeType = file.type || '';
    if (!ALLOWED_MIME.includes(mimeType)) {
      return new Response(JSON.stringify({ error: `不支持的文件类型: ${mimeType}` }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // ══ 第2层：魔数校验（读真实文件头）═════════════════════
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer, 0, 16);

    const realType = detectFileType(bytes);
    if (!realType) {
      return new Response(JSON.stringify({ error: '文件内容与声明类型不符，拒绝上传' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const mimeCategory = mimeType.split('/')[0];
    if (realType !== mimeCategory) {
      return new Response(JSON.stringify({ error: `文件伪装检测：声明为 ${mimeType} 但实际是 ${realType}，拒绝上传` }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // ══ 重新构造 File 对象 ══════════════════════════════════
    const realFile = new File([arrayBuffer], file.name, { type: mimeType });
    const isVideo = mimeCategory === 'video';
    const isGif   = mimeType === 'image/gif';

    // ══ 根据类型选择 Telegram 接口 ═════════════════════════
    let apiMethod = '';
    let fileField  = '';
    if (isVideo) {
      apiMethod = 'sendVideo';
      fileField  = 'video';
    } else if (isGif) {
      // GIF 走 sendAnimation，保持动态效果
      apiMethod = 'sendAnimation';
      fileField  = 'animation';
    } else {
      apiMethod = 'sendPhoto';
      fileField  = 'photo';
    }

    const tgForm = new FormData();
    tgForm.append(fileField, realFile);
    if (caption) tgForm.append('caption', caption);

    const tgRes = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${apiMethod}?chat_id=${env.TELEGRAM_CHAT_ID}`,
      { method: 'POST', body: tgForm }
    );
    const tgData = await tgRes.json();

    if (!tgData.ok) {
      return new Response(JSON.stringify({ error: 'Telegram 上传失败', detail: tgData }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    // ══ 取 file_id ════════════════════════════════════════
    let fileId = '';
    let type   = '';
    if (isVideo) {
      fileId = tgData.result.video.file_id;
      type   = 'video';
    } else if (isGif) {
      fileId = tgData.result.animation.file_id;
      type   = 'photo';
    } else {
      const photos = tgData.result.photo;
      fileId = photos[photos.length - 1].file_id;
      type   = 'photo';
    }

    const msgId = tgData.result.message_id;
    const id    = crypto.randomUUID();
    await env.IMAGE_DB.put(id, JSON.stringify({
      fileId, msgId, name: file.name || id, caption,
      size: file.size, type,
      ext: (file.name || '').split('.').pop().toLowerCase(),
      uploadedAt: Date.now()
    }));

    const msgUrl = `https://t.me/${env.TELEGRAM_CHANNEL_USERNAME}/${msgId}`;
    let returnUrl = msgUrl;

    // 视频 20MB 以内返回代理直链，超过返回 t.me 链接
    if (isVideo) {
      const ext = (file.name || '').split('.').pop().toLowerCase();
      const videoExt = ['mp4', 'mov', 'mkv', 'webm'].includes(ext) ? ext : 'mp4';
      if (file.size <= 20 * 1024 * 1024) {
        const baseUrl = new URL(request.url).origin;
        returnUrl = `${baseUrl}/api/image/${id}.${videoExt}`;
      }
    }

    return new Response(JSON.stringify({ url: returnUrl }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ══ 魔数检测函数 ════════════════════════════════════════════
function detectFileType(bytes) {
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'image';

  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'image';

  // GIF: 47 49 46 38
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return 'image';

  // WebP: 52 49 46 46 ?? ?? ?? ?? 57 45 42 50
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'image';

  // MP4: ftyp box (offset 4-7)
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) return 'video';

  // MOV (QuickTime)
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70 &&
      bytes[8] === 0x71 && bytes[9] === 0x74) return 'video';

  // MKV/WebM: 1A 45 DF A3
  if (bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3) return 'video';

  return null;
}
