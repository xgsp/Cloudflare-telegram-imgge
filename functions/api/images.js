// 获取图片列表 API（支持分页）
export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
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

    // 分页
    const total = images.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const pagedImages = images.slice(start, start + limit);

    return new Response(JSON.stringify({ 
      success: true, 
      data: pagedImages,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
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
