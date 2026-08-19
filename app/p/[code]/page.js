'use client';

// 교육비 이체 안내 — 참가자(어린이집) 화면
// 안내 → 계좌 확인·이체 → 계산서 필요 여부 → 신청서 → 완료

import { useEffect, useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import Mascot from '../../components/Mascot';

const won = (n) => (Number(n) || 0).toLocaleString('ko-KR');

export default function PayPage({ params }) {
  const [state, setState] = useState('loading');
  const [course, setCourse] = useState(null);
  const [settings, setSettings] = useState(null);
  const [err, setErr] = useState('');

  const [step, setStep] = useState(0);          // 0안내 1계좌 2질문 3신청서 4완료
  const [copied, setCopied] = useState(false);
  const [want, setWant] = useState(null);        // true/false

  const [payerName, setPayerName] = useState('');
  const [phone, setPhone] = useState('');
  const [payDate, setPayDate] = useState('');
  const [email, setEmail] = useState('');

  const [proofUrl, setProofUrl] = useState('');
  const [reading, setReading] = useState('');
  const [bizNo, setBizNo] = useState('');
  const [orgName, setOrgName] = useState('');
  const [ceo, setCeo] = useState('');
  const [address, setAddress] = useState('');
  const [sending, setSending] = useState(false);

  const fileRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/load?c=${encodeURIComponent(params.code)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '안내를 찾지 못했어요.');
        setCourse(data.course);
        setSettings(data.settings);
        const t = new Date();
        const p = (n) => String(n).padStart(2, '0');
        setPayDate(`${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`);
        setState('ok');
      } catch (e) {
        setErr(e.message);
        setState('fail');
      }
    })();
  }, [params.code]);

  const copyAccount = async () => {
    try {
      await navigator.clipboard.writeText((settings.accountNo || '').replace(/\s/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      alert('복사가 안 됐어요. 계좌번호를 길게 눌러 복사해 주세요.');
    }
  };

  const onPickProof = async (e) => {
    const file = (e.target.files || [])[0];
    e.target.value = '';
    if (!file) return;
    setReading('사진을 올리는 중이에요...');
    try {
      const blob = await upload(`proofs/${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        clientPayload: 'edu-payment',
      });
      setProofUrl(blob.url);
      setReading('사진에서 내용을 읽는 중이에요...');
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: blob.url }),
      });
      const data = await res.json();
      if (res.ok && !data.skip) {
        if (data.bizNo) setBizNo(data.bizNo);
        if (data.name) setOrgName(data.name);
        if (data.ceo) setCeo(data.ceo);
        if (data.address) setAddress(data.address);
      }
      setReading('');
    } catch (e2) {
      setReading('');
      alert('사진을 올리지 못했어요. ' + e2.message);
    }
  };

  const submit = async (wantInvoice) => {
    if (wantInvoice) {
      if (!proofUrl) return alert('고유번호증(또는 사업자등록증) 사진을 올려주세요.');
      if (!email.trim()) return alert('계산서를 받으실 메일 주소를 적어주세요.');
      if (!payDate) return alert('이체하신 날짜를 골라주세요.');
    }
    setSending(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          courseCode: course.code,
          courseTitle: course.title,
          amount: course.amount,
          payerName, phone,
          wantInvoice,
          payDate: wantInvoice ? payDate : '',
          email: wantInvoice ? email.trim() : '',
          bizNo, orgName, ceo, address,
          proofUrl: wantInvoice ? proofUrl : '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '접수하지 못했어요.');
      setWant(wantInvoice);
      setStep(4);
      window.scrollTo({ top: 0 });
    } catch (e) {
      alert(e.message);
    } finally {
      setSending(false);
    }
  };

  if (state === 'loading') {
    return <div className="stage center" style={{ paddingTop: 80 }}>안내를 불러오는 중이에요...</div>;
  }
  if (state === 'fail') {
    return (
      <div className="stage">
        <div className="card center">
          <Mascot name="family" className="mascot-hero" alt="우리아이들 캐릭터" />
          <div className="step-title">안내를 찾지 못했어요</div>
          <p className="step-sub mt8">{err}</p>
        </div>
      </div>
    );
  }

  const total = 4;
  const pct = Math.round(((Math.min(step, 3) + 1) / total) * 100);

  return (
    <>
      <div className="stage">
        <div className="brandbar">
          <span className="logo-u">U</span>
          <span>영유아교육디자인연구소</span>
        </div>

        {step < 4 && (
          <div className="progress">
            <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
            <div className="progress-text">
              <span>{course.title}</span>
              <span><b>{Math.min(step, 3) + 1}</b> / {total}</span>
            </div>
          </div>
        )}

        {/* 1. 교육비 안내 */}
        {step === 0 && (
          <div className="card center">
            <Mascot name="family" className="mascot-hero" alt="우리아이들 캐릭터" />
            <div className="speech">교육비 안내드려요</div>
            <div className="step-title">{course.title}</div>
            <div className="pay-amount">
              <div className="label">교육비</div>
              <div className="value">{won(course.amount)}원</div>
            </div>
            {course.note && <p className="body-text mt14">{course.note}</p>}
            {settings.payNote && <div className="notice mt14">{settings.payNote}</div>}
          </div>
        )}

        {/* 2. 계좌 안내 */}
        {step === 1 && (
          <div className="card">
            <div className="step-kicker">🏦 입금 계좌</div>
            <div className="step-title">이 계좌로 이체해 주세요</div>
            <p className="step-sub">계좌번호를 눌러 복사할 수 있어요.</p>

            <div className="account-box">
              <div className="account-row"><span className="k">은행</span><span className="v">{settings.bank || '-'}</span></div>
              <div className="account-row"><span className="k">예금주</span><span className="v">{settings.holder || '-'}</span></div>
              <div className="account-no">{settings.accountNo || '계좌번호가 아직 등록되지 않았어요'}</div>
              <button className="btn" onClick={copyAccount}>
                {copied ? '복사했어요!' : '계좌번호 복사하기'}
              </button>
              <div className="account-row mt14" style={{ justifyContent: 'center' }}>
                <span className="k" style={{ width: 'auto' }}>보내실 금액</span>
                <span className="v">{won(course.amount)}원</span>
              </div>
            </div>

            {settings.bankPhoto && (
              <>
                <div className="divider" />
                <div className="step-sub">📄 통장사본</div>
                <img className="bank-photo" src={settings.bankPhoto} alt="통장사본" />
              </>
            )}

            <div className="notice mt14">
              이체하실 때 <strong>어린이집 이름</strong>으로 보내주시면 확인이 빨라요.
            </div>
          </div>
        )}

        {/* 3. 계산서 필요 여부 */}
        {step === 2 && (
          <div className="card">
            <div className="center">
              <Mascot name="girl" className="mascot-hero" style={{ width: 104 }} alt="사랑이" />
            </div>
            <div className="step-kicker">🧾 서류 확인</div>
            <div className="step-title">전자계산서가 필요하신가요?</div>
            <p className="step-sub">필요하신 경우에만 신청서를 작성하시면 됩니다.</p>

            <div className="field mt14">
              <label>입금하신 분 이름 (선택)</label>
              <input value={payerName} onChange={(e) => setPayerName(e.target.value)} placeholder="예: ○○어린이집 또는 홍길동" />
            </div>
            <div className="field">
              <label>연락처 (선택)</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" />
            </div>

            <div className="choices">
              <button type="button" className="choice" onClick={() => { setWant(true); setStep(3); window.scrollTo({top:0}); }}>
                <span className="mark">✓</span>
                <span>
                  <span className="choice-main">전자계산서가 필요해요</span>
                  <span className="choice-sub">고유번호증 사진과 메일 주소를 받습니다</span>
                </span>
              </button>
              <button type="button" className="choice" disabled={sending} onClick={() => submit(false)}>
                <span className="mark">✓</span>
                <span>
                  <span className="choice-main">{sending ? '보내는 중...' : '필요 없어요'}</span>
                  <span className="choice-sub">이체 확인만 하고 마칩니다</span>
                </span>
              </button>
            </div>
          </div>
        )}

        {/* 4. 계산서 신청서 */}
        {step === 3 && (
          <div className="card">
            <div className="step-kicker">📝 계산서 신청</div>
            <div className="step-title">전자계산서 발급 신청</div>
            <p className="step-sub">고유번호증 사진을 올리면 내용이 자동으로 채워져요.</p>

            <div className="field mt14">
              <label>고유번호증(또는 사업자등록증) 사진 <span className="req">*</span></label>
              <label className="add-btn" style={{ display: 'block', textAlign: 'center' }}>
                {reading || (proofUrl ? '다른 사진으로 바꾸기' : '+ 사진 올리기')}
                <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={onPickProof} disabled={!!reading} style={{ display: 'none' }} />
              </label>
              {proofUrl && !reading && (
                proofUrl.toLowerCase().endsWith('.pdf')
                  ? <div className="readbox">PDF 파일이 올라갔어요. 아래 내용을 직접 확인해 주세요.</div>
                  : <img className="photo-preview" src={proofUrl} alt="올린 증명서" />
              )}
              {proofUrl && !reading && <div className="readbox">사진에서 읽은 내용이에요. 틀린 곳이 있으면 고쳐 주세요.</div>}
            </div>

            <div className="field">
              <label>고유번호(사업자등록번호) <span className="req">*</span></label>
              <input value={bizNo} onChange={(e) => setBizNo(e.target.value)} placeholder="000-00-00000" />
            </div>
            <div className="field">
              <label>기관명(상호) <span className="req">*</span></label>
              <input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="○○어린이집" />
            </div>
            <div className="field">
              <label>대표자 이름 <span className="req">*</span></label>
              <input value={ceo} onChange={(e) => setCeo(e.target.value)} placeholder="홍길동" />
            </div>
            <div className="field">
              <label>주소 <span className="req">*</span></label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="○○시 ○○구 ○○로 00" />
            </div>
            <div className="field">
              <label>계산서 받으실 메일 주소 <span className="req">*</span></label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
            </div>
            <div className="field">
              <label>이체하신 날짜 <span className="req">*</span></label>
              <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
            </div>

            <div className="notice blue">
              교육비 <strong>{won(course.amount)}원</strong> · {course.title}
            </div>

            <button className="btn mt14" onClick={() => submit(true)} disabled={sending || !!reading}>
              {sending ? '보내는 중...' : '신청서 보내기'}
            </button>
          </div>
        )}

        {/* 5. 완료 */}
        {step === 4 && (
          <div className="card">
            <div className="finale">
              <Mascot name="baby" className="mascot-hero" style={{ width: 116 }} alt="성장이" />
              <div className="big">{want ? '신청이 접수됐어요' : '이체 확인이 접수됐어요'}</div>
              <p className="sub">
                {want
                  ? '작성해 주신 내용으로 1~2일 내 확인 후\n메일로 관련 서류 전달드리겠습니다.'
                  : '확인 후 필요한 안내를 드리겠습니다.'}
              </p>
            </div>
            {settings.contact && <div className="notice mt14">{settings.contact}</div>}
            <div className="center signature">
              <Mascot name="family" style={{ width: 180, margin: '14px auto 6px', display: 'block' }} alt="우리아이들 캐릭터" />
              <strong>영유아교육디자인연구소</strong>
            </div>
          </div>
        )}

        {step < 4 && <div className="step-dots">{[0,1,2,3].map((i) => <i key={i} className={i === Math.min(step,3) ? 'on' : ''} />)}</div>}
      </div>

      {step < 3 && (
        <div className="navbar">
          <div className="navbar-inner">
            {step > 0 && <button className="btn ghost back" onClick={() => { setStep(step - 1); window.scrollTo({top:0}); }}>← 이전</button>}
            <button className="btn" onClick={() => { setStep(step + 1); window.scrollTo({top:0}); }}>
              {step === 0 ? '계좌 확인하기' : step === 1 ? '이체했어요' : '다음'} →
            </button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="navbar">
          <div className="navbar-inner">
            <button className="btn ghost back" onClick={() => { setStep(2); window.scrollTo({top:0}); }}>← 이전</button>
            <button className="btn" onClick={() => submit(true)} disabled={sending || !!reading}>
              {sending ? '보내는 중...' : '신청서 보내기'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
