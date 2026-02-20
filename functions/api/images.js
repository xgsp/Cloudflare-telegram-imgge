// 获取图片列表 API
export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const folder = url.searchParams.get('folder') || '';
    const tag = url.searchParams.get('tag') || '';

    // 获取所有图片
    const list = await env.IMAGE_DB.list();
    const images = [];

    for (const key of list.keys) {
      const data = await env.IMAGE_DB.get(key.name);
      if (data) {
        const imageData = JSON.parse(data);
        
        // 过滤
        if (folder && imageData.folder !== folder) continue;
        if (tag && !imageData.tags.includes(tag)) continue;
        
        images.push(imageData);
      }
    }

    // 按上传时间排序
    images.sort((a, b) => b.uploadTime - a.uploadTime);

    // 限制数量
    const limitedImages = images.slice(0, limit);

    return new Response(JSON.stringify({ 
      success: true, 
      data: limitedImages 
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
