// 카카오톡 "나에게 보내기"로 접수 내용을 원장님께 바로 보낸다.
// 카카오는 한 번에 200자까지만 보낼 수 있어서, 길면 나눠 보낸다.
import { saveJson, readJson } from './store';

const TOKEN_PATH = process.env.KAKAO_TOKEN_PATH || '';

export function kakaoReady() {
  return Boolean(process.env.KAKAO_REST_KEY && TOKEN_PATH);
}

export async function saveRefreshToken(token, scope) {
  await saveJson(TOKEN_PATH, {
    refresh_token: token,
    scope: scope || '',
    savedAt: new Date().toISOString(),
  });
}

async function getAccessToken() {
  const saved = await readJson(TOKEN_PATH);
  if (!saved || !saved.refresh_token) throw new Error('카카오 연결이 아직 안 되어 있어요.');

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: process.env.KAKAO_REST_KEY,
    refresh_token: saved.refresh_token,
  });
  // 카카오 앱에서 클라이언트 시크릿을 켜 두면 이 값도 같이 보내야 한다
  if (process.env.KAKAO_CLIENT_SECRET) body.set('client_secret', process.env.KAKAO_CLIENT_SECRET);
  const res = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body,
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error('카카오 연결이 만료됐어요. 관리자 화면에서 다시 연결해 주세요.');
  }
  // 새 갱신열쇠를 주면 갈아끼운다 (그래야 계속 쓸 수 있다)
  if (data.refresh_token && data.refresh_token !== saved.refresh_token) {
    await saveRefreshToken(data.refresh_token, saved.scope);
  }
  return data.access_token;
}

function chunk(text, size = 180) {
  const lines = text.split('\n');
  const out = [];
  let cur = '';
  for (const line of lines) {
    if ((cur + line).length + 1 > size) {
      if (cur) out.push(cur);
      cur = line;
    } else {
      cur = cur ? `${cur}\n${line}` : line;
    }
  }
  if (cur) out.push(cur);
  return out;
}

export async function sendKakaoMemo(text) {
  const access = await getAccessToken();
  const parts = chunk(text);
  for (let i = 0; i < parts.length; i += 1) {
    const template = {
      object_type: 'text',
      text: parts.length > 1 ? `${parts[i]}\n(${i + 1}/${parts.length})` : parts[i],
      link: {},
    };
    const res = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access}`,
        'content-type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: new URLSearchParams({ template_object: JSON.stringify(template) }),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error('카카오 보내기 실패: ' + detail.slice(0, 200));
    }
  }
}
