export async function onRequestPost({ request, env }) {
  // ✅ 鉴权检查
  const apiKey = request.headers.get('X-API-Key');
  if (!apiKey || apiKey !== env.UPLOAD_API_KEY) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const caption = formData.get('caption') || ''; // ✅ 说明文字，可选

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ✅ 以照片形式上传（sendPhoto），附带说明文字
    const tgForm = new FormData();
    tgForm.append('photo', file);
    if (caption) {
      tgForm.append('caption', caption);
    }

    const tgRes = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto?chat_id=${env.TELEGRAM_CHAT_ID}`,
      { method: 'POST', body: tgForm }
    );

    const tgData = await tgRes.json();

    if (!tgData.ok) {
      // ✅ 如果照片上传失败（比如格式不支持），自动降级用 sendDocument
      const tgForm2 = new FormData();
      tgForm2.append('document', file);
      if (caption) {
        tgForm2.append('caption', caption);
      }

      const tgRes2 = await fetch(
        `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendDocument?chat_id=${env.TELEGRAM_CHAT_ID}`,
        { method: 'POST', body: tgForm2 }
      );

      const tgData2 = await tgRes2.json();

      if (!tgData2.ok) {
        return new Response(JSON.stringify({ error: 'Telegram upload failed', detail: tgData2 }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 用 document 的 file_id
      const fileId = tgData2.result.document.file_id;
      const msgId = tgData2.result.message_id;
      const id = crypto.randomUUID();

      await env.IMAGE_DB.put(id, JSON.stringify({
        fileId,
        msgId,
        name: file.name || id,
        caption,
        size: file.size,
        type: 'document',
        uploadedAt: Date.now()
      }));

      const baseUrl = new URL(request.url).origin;
      const imageUrl = `${baseUrl}/api/image/${id}`;

      return new Response(JSON.stringify({
        url: imageUrl,
        markdown: `![image](${imageUrl})`,
        html: `<img src="${imageUrl}" alt="${caption}">`,
        bbcode: `[img]${imageUrl}[/img]`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ✅ 照片上传成功，取最大尺寸
    const photos = tgData.result.photo;
    const fileId = photos[photos.length - 1].file_id;
    const msgId = tgData.result.message_id;

    const id = crypto.randomUUID();
    await env.IMAGE_DB.put(id, JSON.stringify({
      fileId,
      msgId,
      name: file.name || id,
      caption,
      size: file.size,
      type: 'photo',
      uploadedAt: Date.now()
    }));

    const baseUrl = new URL(request.url).origin;
    const imageUrl = `${baseUrl}/api/image/${id}`;

    return new Response(JSON.stringify({
      url: imageUrl,
      markdown: `![image](${imageUrl})`,
      html: `<img src="${imageUrl}" alt="${caption}">`,
      bbcode: `[img]${imageUrl}[/img]`
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
