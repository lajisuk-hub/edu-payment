// 관리자용 접수 목록 / 상태 바꾸기
import { ADMIN_KEY, readMany, readJson, saveJson } from '../../lib/store';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req) {
  try {
    const key = new URL(req.url).searchParams.get('key');
    if (key !== ADMIN_KEY) return Response.json({ error: '권한이 없어요.' }, { status: 403 });
    const items = await readMany('subs/');
    items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return Response.json({ items });
  } catch (err) {
    return Response.json({ error: '목록을 불러오지 못했어요: ' + err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    if (body.key !== ADMIN_KEY) return Response.json({ error: '권한이 없어요.' }, { status: 403 });
    const rec = await readJson(`subs/${body.id}.json`);
    if (!rec) return Response.json({ error: '접수 내용을 찾지 못했어요.' }, { status: 404 });
    rec.status = body.status || rec.status;
    rec.memo = body.memo !== undefined ? body.memo : rec.memo;
    await saveJson(`subs/${body.id}.json`, rec);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: '바꾸지 못했어요: ' + err.message }, { status: 500 });
  }
}
