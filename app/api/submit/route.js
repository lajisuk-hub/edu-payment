// 접수 저장 + 원장님 카톡으로 바로 알림
import { saveJson, makeCode } from '../../lib/store';
import { sendKakaoMemo, kakaoReady } from '../../lib/kakao';

export const runtime = 'nodejs';
export const maxDuration = 30;

const won = (n) => (Number(n) || 0).toLocaleString('ko-KR');

export async function POST(req) {
  try {
    const b = await req.json();

    if (!b.courseTitle) {
      return Response.json({ error: '교육 정보가 없어요.' }, { status: 400 });
    }
    if (b.wantInvoice) {
      if (!b.email) return Response.json({ error: '계산서 받을 메일 주소를 넣어주세요.' }, { status: 400 });
      if (!b.payDate) return Response.json({ error: '이체한 날짜를 골라주세요.' }, { status: 400 });
    }

    const id = `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${makeCode(5)}`;
    const rec = {
      id,
      courseCode: b.courseCode || '',
      courseTitle: b.courseTitle,
      amount: Number(b.amount) || 0,
      payerName: b.payerName || '',
      phone: b.phone || '',
      wantInvoice: Boolean(b.wantInvoice),
      payDate: b.payDate || '',
      email: b.email || '',
      bizNo: b.bizNo || '',
      orgName: b.orgName || '',
      ceo: b.ceo || '',
      address: b.address || '',
      upte: b.upte || '',
      jongmok: b.jongmok || '',
      proofUrl: b.proofUrl || '',
      status: b.wantInvoice ? '발급대기' : '계산서없음',
      createdAt: new Date().toISOString(),
    };

    await saveJson(`subs/${id}.json`, rec);

    // 카톡으로 정리해서 보내기 (실패해도 접수는 저장된 상태로 둔다)
    let kakao = 'skip';
    if (kakaoReady()) {
      const lines = b.wantInvoice
        ? [
            '[전자계산서 발급신청]',
            `교육: ${rec.courseTitle}`,
            `기관: ${rec.orgName || '-'}`,
            `고유번호: ${rec.bizNo || '-'}`,
            `대표자: ${rec.ceo || '-'}`,
            `주소: ${rec.address || '-'}`,
            `금액: ${won(rec.amount)}원`,
            `이체일: ${rec.payDate}`,
            `메일: ${rec.email}`,
            rec.payerName ? `입금자: ${rec.payerName}` : '',
            rec.phone ? `연락처: ${rec.phone}` : '',
          ].filter(Boolean)
        : [
            '[교육비 이체 확인]',
            `교육: ${rec.courseTitle}`,
            `금액: ${won(rec.amount)}원`,
            rec.payerName ? `입금자: ${rec.payerName}` : '',
            rec.phone ? `연락처: ${rec.phone}` : '',
            '계산서 신청 없음',
          ].filter(Boolean);
      try {
        await sendKakaoMemo(lines.join('\n'));
        kakao = 'sent';
      } catch (err) {
        console.error('카카오 전송 실패:', err.message);
        kakao = 'fail';
      }
    }

    return Response.json({ ok: true, id, kakao });
  } catch (err) {
    return Response.json({ error: '접수 중 문제가 생겼어요: ' + err.message }, { status: 500 });
  }
}
