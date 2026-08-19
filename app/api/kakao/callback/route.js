// 카카오 연결 마무리 — 받은 열쇠를 보관함에 저장한다
import { saveRefreshToken } from '../../../lib/kakao';

export const runtime = 'nodejs';

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const page = (msg) =>
    new Response(
      `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
       <body style="font-family:system-ui;padding:40px;text-align:center;background:#fffaf0;color:#4a3b2f">
       <h2 style="color:#f7b500">${msg}</h2>
       <p><a href="/admin" style="color:#4a3b2f">관리자 화면으로 돌아가기</a></p></body>`,
      { headers: { 'content-type': 'text/html; charset=utf-8' } }
    );

  if (!code) return page('연결이 취소됐어요.');

  try {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.KAKAO_REST_KEY,
      redirect_uri: `${url.origin}/api/kakao/callback`,
      code,
    });
    if (process.env.KAKAO_CLIENT_SECRET) body.set('client_secret', process.env.KAKAO_CLIENT_SECRET);
    const res = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body,
    });
    const data = await res.json();
    if (!res.ok || !data.refresh_token) {
      return page('연결에 실패했어요. 다시 시도해 주세요.');
    }
    await saveRefreshToken(data.refresh_token);
    return page('카카오톡 연결이 끝났어요! 이제 신청이 들어오면 바로 카톡으로 옵니다.');
  } catch (err) {
    return page('오류가 났어요: ' + err.message);
  }
}
