// 测试环境变量配置
export async function onRequestGet(context) {
  const { env } = context;

  const config = {
    hasBotToken: !!env.TELEGRAM_BOT_TOKEN,
    hasChatId: !!env.TELEGRAM_CHAT_ID,
    hasImageDB: !!env.IMAGE_DB,
    botTokenLength: env.TELEGRAM_BOT_TOKEN ? env.TELEGRAM_BOT_TOKEN.length : 0,
    chatIdValue: env.TELEGRAM_CHAT_ID || 'undefined'
  };

  return new Response(JSON.stringify({ 
    success: true, 
    config 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
