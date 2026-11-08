const sessions = new Map();
const globalCalls = [];
let active = 0;

function json(value, status = 200, headers = {}) {
  return Response.json(value, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

function chatSession(request) {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.last > 1800000 && !session.busy) sessions.delete(id);
  }
  const cookie = request.headers.get('cookie')?.match(/(?:^|;\s*)shijie_session=([a-f0-9-]{36})(?:;|$)/);
  let id = cookie?.[1], session = sessions.get(id);
  if (!session) {
    if (sessions.size >= 200) {
      const free = [...sessions].find(([, value]) => !value.busy);
      if (!free) throw new AppError('BUSY', '请稍后再试。', 429);
      sessions.delete(free[0]);
    }
    id = crypto.randomUUID();
    session = { history: [], calls: [], busy: false };
    sessions.set(id, session);
  }
  session.last = now;
  return { session, headers: { 'Set-Cookie': 'shijie_session=' + id + '; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=1800' } };
}

async function handleApi(request, env, ctx, url) {
  const origin = request.headers.get('origin');
  if ((origin && origin !== url.origin) || request.headers.get('sec-fetch-site') === 'cross-site') {
    return json({error:'不支持跨站请求。'}, 403);
  }
  if (url.pathname === '/api/status' && request.method === 'GET') {
    return json({configured: Boolean(env.DEEPSEEK_API_KEY)});
  }
  const { session, headers } = chatSession(request);
  if (url.pathname === '/api/chat/history' && request.method === 'GET') return json({messages: session.history}, 200, headers);
  if (url.pathname === '/api/chat/reset' && request.method === 'POST') {
    if (session.busy) return json({error:'请先停止当前回答。'},409);
    session.history = [];
    return json({ok:true},200,headers);
  }
  if (url.pathname !== '/api/chat' || request.method !== 'POST') return json({error:'页面不存在。'},404);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return json({error:'请求格式不正确。'},415);
  const chunks = [];
  let bytes = 0;
  if (request.body) {
    for await (const chunk of request.body) {
      bytes += chunk.length;
      if (bytes > 12000) return json({error:'问题有点长，请缩短后再试。'},413);
      chunks.push(chunk);
    }
  }
  let data;
  try { data = JSON.parse(await new Blob(chunks).text()); } catch { return json({error:'请求格式不正确。'},400); }
  if (typeof data?.message !== 'string' || !data.message.trim() || data.message.length > 1200) return json({error:'请输入 1—1200 字的问题。'},400);
  const message = data.message.trim();
  const context = contextOf(data.context);
  if (!env.DEEPSEEK_API_KEY) return json({error:'助手还在准备中。'},503);
  if (session.busy) return json({error:'请先停止当前回答。'},409);
  const now = Date.now();
  while (globalCalls.length && now - globalCalls[0] >= 60000) globalCalls.shift();
  session.calls = session.calls.filter(t => now - t < 60000);
  if (session.calls.length >= 12 || globalCalls.length >= 30 || active >= 3) return json({error:'先歇一小会儿，稍后再继续问吧。'},429);
  session.calls.push(now); globalCalls.push(now); session.busy = true; active++;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(),65000);
  const onAbort = () => controller.abort();
  request.signal.addEventListener('abort',onAbort,{once:true});
  const stream = new ReadableStream({
    start(output) {
      const encoder = new TextEncoder();
      const emit = (type, fields = {}) => {
        if (!controller.signal.aborted) output.enqueue(encoder.encode('data: ' + JSON.stringify({type,...fields}) + '\n\n'));
      };
      ctx.waitUntil((async () => {
        try {
          emit('status',{message:'正在读你的问题…'});
          const config = {key:env.DEEPSEEK_API_KEY,model:env.DEEPSEEK_MODEL || 'deepseek-flash'};
          const answer = await answerQuestion(message,context,session.history.slice(-12),config,controller,emit);
          session.history.push({role:'user',content:message},{role:'assistant',content:answer});
          session.history = session.history.slice(-20);
          emit('done');
        } catch (error) {
          emit('error',{code:error.code || 'UPSTREAM',message:error instanceof AppError ? error.message : '助手暂时连接不上，请稍后再试。'});
        } finally {
          clearTimeout(timeout);
          request.signal.removeEventListener('abort',onAbort);
          session.busy = false; active--;
          try { output.close(); } catch {}
        }
      })());
    },
    cancel() { controller.abort(); }
  });
  return new Response(stream,{headers:{...headers,'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform'}});
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      try { return await handleApi(request,env,ctx,url); }
      catch (e) { return json({error:e instanceof AppError ? e.message : '暂时无法处理，请稍后再试。'},e instanceof AppError ? e.status : 500); }
    }
    if (url.pathname === '/favicon.ico') return new Response(null,{status:204});
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response('页面不存在。',{status:404});
  }
};
