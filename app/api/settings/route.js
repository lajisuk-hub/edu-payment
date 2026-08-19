// 계좌·통장사본 등 공통 설정 읽기/저장
import { SETTINGS_PATH, ADMIN_KEY, saveJson, readJson, emptySettings } from '../../lib/store';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const data = (await readJson(SETTINGS_PATH)) || emptySettings();
    return Response.json({ settings: { ...emptySettings(), ...data } });
  } catch (err) {
    return Response.json({ settings: emptySettings() });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    if (body.key !== ADMIN_KEY) {
      return Response.json({ error: '권한이 없어요.' }, { status: 403 });
    }
    const settings = { ...emptySettings(), ...(body.settings || {}) };
    await saveJson(SETTINGS_PATH, settings);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: '저장 중 문제가 생겼어요: ' + err.message }, { status: 500 });
  }
}
