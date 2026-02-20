// 搜索图片 API
export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';

    if (!query) {
      return new Response(JSON.stringify({ success: true, data: [] }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取所有图片
    const list = await env.IMAGE_DB.list();
    const images = [];

    for (const key of list.keys) {
      const data = await env.IMAGE_DB.get(key.name);
      if (data) {
        const imageData = JSON.parse(data);
        
        // 搜索文件名或标签
        const queryLower = query.toLowerCase();
        const matchFilename = imageData.filename.toLowerCase().includes(queryLower);
        const matchTags = imageData.tags.some(tag => tag.toLowerCase().includes(queryLower));
        
        if (matchFilename || matchTags) {
          images.push(imageData);
        }
      }
    }

    // 按上传时间排序
    images.sort((a, b) => b.uploadTime - a.uploadTime);

    return new Response(JSON.stringify({ 
      success: true, 
      data: images 
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
