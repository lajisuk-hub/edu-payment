// 교육별 안내 링크 만들기 (교육명·교육비를 담아 짧은 주소로)
import { ADMIN_KEY, saveJson, makeCode } from '../../lib/store';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const body = await req.json();
    if (body.key !== ADMIN_KEY) {
      return Response.json({ error: '권한이 없어요.' }, { status: 403 });
    }
    const course = (body.course || {});
    if (!course.title || !course.amount) {
      return Response.json({ error: '교육명과 교육비를 넣어주세요.' }, { status: 400 });
    }
    const code = makeCode();
    await saveJson(`courses/${code}.json`, {
      code,
      title: String(course.title),
      amount: Number(course.amount) || 0,
      note: String(course.note || ''),
      madeAt: new Date().toISOString(),
    });
    return Response.json({ code });
  } catch (err) {
    return Response.json({ error: '만드는 중 문제가 생겼어요: ' + err.message }, { status: 500 });
  }
}
