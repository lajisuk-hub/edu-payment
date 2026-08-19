// 카카오톡이 잘 오는지 시험 삼아 한 통 보내본다 (관리자만)
import { ADMIN_KEY } from '../../../lib/store';
import { sendKakaoMemo, kakaoReady } from '../../../lib/kakao';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req) {
  const key = new URL(req.url).searchParams.get('key');
  if (key !== ADMIN_KEY) return Response.json({ error: '권한이 없어요.' }, { status: 403 });
  if (!kakaoReady()) return Response.json({ error: '카카오 설정(열쇠)이 아직 없어요.' }, { status: 500 });

  try {
    await sendKakaoMemo('[시험] 카카오톡 알림이 잘 오고 있어요. 이 메시지가 보이면 연결 완료입니다.');
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
