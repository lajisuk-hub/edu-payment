// 카카오 연결을 완전히 끊는다.
// 한 번 끊어야 다시 연결할 때 동의 화면이 새로 뜬다(선택 항목 체크를 다시 받기 위해).
import { list, del } from '@vercel/blob';
import { ADMIN_KEY, readJson } from '../../../lib/store';

export const runtime = 'nodejs';
export const maxDuration = 30;

const TOKEN_PATH = process.env.KAKAO_TOKEN_PATH || '';

export async function GET(req) {
  const key = new URL(req.url).searchParams.get('key');
  if (key !== ADMIN_KEY) return Response.json({ error: '권한이 없어요.' }, { status: 403 });

  const steps = [];
  try {
    const saved = await readJson(TOKEN_PATH);
    if (saved && saved.refresh_token) {
      // 카카오 쪽 연결도 끊는다
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.KAKAO_REST_KEY,
        refresh_token: saved.refresh_token,
      });
      if (process.env.KAKAO_CLIENT_SECRET) body.set('client_secret', process.env.KAKAO_CLIENT_SECRET);
      const tokRes = await fetch('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded;charset=utf-8' },
        body,
      });
      const tok = await tokRes.json();
      if (tok.access_token) {
        const un = await fetch('https://kapi.kakao.com/v1/user/unlink', {
          method: 'POST',
          headers: { Authorization: `Bearer ${tok.access_token}` },
        });
        steps.push(un.ok ? '카카오 연결 끊음' : '카카오 연결 끊기 응답 ' + un.status);
      } else {
        steps.push('열쇠가 이미 만료됨');
      }
    } else {
      steps.push('저장된 연결 없음');
    }

    // 우리 쪽에 저장된 열쇠도 지운다
    const { blobs } = await list({ prefix: 'kakao/' });
    for (const b of blobs) await del(b.url);
    steps.push('저장된 열쇠 지움');

    return Response.json({ ok: true, steps });
  } catch (err) {
    return Response.json({ error: err.message, steps }, { status: 500 });
  }
}
