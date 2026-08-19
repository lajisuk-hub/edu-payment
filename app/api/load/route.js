// 참가자 화면에서 교육 정보 + 공통 설정 함께 불러오기
import { readJson, SETTINGS_PATH, emptySettings } from '../../lib/store';

export const runtime = 'nodejs';

export async function GET(req) {
  try {
    const code = new URL(req.url).searchParams.get('c') || '';
    if (!/^[a-z0-9]{4,12}$/.test(code)) {
      return Response.json({ error: '주소가 올바르지 않아요.' }, { status: 400 });
    }
    const course = await readJson(`courses/${code}.json`);
    if (!course) {
      return Response.json({ error: '이 주소의 안내를 찾지 못했어요.' }, { status: 404 });
    }
    const settings = { ...emptySettings(), ...((await readJson(SETTINGS_PATH)) || {}) };
    return Response.json({ course, settings });
  } catch (err) {
    return Response.json({ error: '오류가 났어요: ' + err.message }, { status: 500 });
  }
}
