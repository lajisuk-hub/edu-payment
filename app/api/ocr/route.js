// 고유번호증(또는 사업자등록증) 사진에서 필요한 정보를 읽어낸다.
// 결과는 따옴표 때문에 깨지지 않도록 줄 단위 표시로 주고받는다.

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODEL = 'claude-sonnet-5';

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url || !/^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//i.test(url)) {
      return Response.json({ error: '사진 주소가 올바르지 않아요.' }, { status: 400 });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: 'AI 열쇠가 설정되지 않았어요.' }, { status: 500 });
    }

    const imgRes = await fetch(url);
    if (!imgRes.ok) return Response.json({ error: '사진을 불러오지 못했어요.' }, { status: 502 });
    const type = imgRes.headers.get('content-type') || 'image/jpeg';
    if (!type.startsWith('image/')) {
      return Response.json({ error: 'pdf', skip: true });
    }
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const b64 = buf.toString('base64');

    const prompt = [
      '이 사진은 한국의 고유번호증 또는 사업자등록증이다.',
      '아래 항목을 찾아 그대로 옮겨 적어라. 없으면 빈칸으로 둔다.',
      '따옴표는 쓰지 말고, 아래 형식의 여섯 줄만 출력한다.',
      '',
      '등록번호: (숫자와 하이픈만)',
      '상호: (기관명·단체명)',
      '대표자: (대표자 또는 대표자명)',
      '주소: (사업장 소재지 전체)',
      '업태: (없으면 빈칸)',
      '종목: (없으면 빈칸)',
    ].join('\n');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 700,
        thinking: { type: 'disabled' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: type.split(';')[0], data: b64 } },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error('Anthropic 오류:', (await res.text()).slice(0, 400));
      return Response.json({ error: '사진을 읽지 못했어요. 직접 입력해 주세요.' }, { status: 502 });
    }

    const data = await res.json();
    const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
    const pick = (label) => {
      const m = text.match(new RegExp(`${label}\s*[:：]\s*(.*)`));
      return m ? m[1].trim() : '';
    };

    return Response.json({
      bizNo: pick('등록번호'),
      name: pick('상호'),
      ceo: pick('대표자'),
      address: pick('주소'),
      upte: pick('업태'),
      jongmok: pick('종목'),
    });
  } catch (err) {
    return Response.json({ error: '오류가 났어요: ' + err.message }, { status: 500 });
  }
}
