'use client';

// 관리자 화면 — 원장님만 쓰는 곳
// ① 계좌·통장사본 설정 ② 교육별 안내 링크 만들기 ③ 접수 목록 + 홈택스 파일 ④ 카톡 연결

import { useEffect, useState } from 'react';
import { upload } from '@vercel/blob/client';
import Mascot from '../components/Mascot';
import { downloadHometaxExcel } from '../lib/hometax';

const PASSWORD = '1234';
const won = (n) => (Number(n) || 0).toLocaleString('ko-KR');

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState('');

  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [upBusy, setUpBusy] = useState('');

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [link, setLink] = useState('');
  const [making, setMaking] = useState(false);
  const [copyLabel, setCopyLabel] = useState('링크 복사하기');

  const [subs, setSubs] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [picked, setPicked] = useState({});

  useEffect(() => {
    if (sessionStorage.getItem('edu-payment-unlocked') === 'y') setUnlocked(true);
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    (async () => {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data.settings);
      loadSubs();
    })();
  }, [unlocked]);

  const loadSubs = async () => {
    setLoadingSubs(true);
    try {
      const res = await fetch(`/api/subs?key=${PASSWORD}`);
      const data = await res.json();
      if (res.ok) setSubs(data.items || []);
    } finally {
      setLoadingSubs(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key: PASSWORD, settings }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('저장했어요.');
    } catch (e) {
      alert('저장하지 못했어요: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const onPickBankPhoto = async (e) => {
    const file = (e.target.files || [])[0];
    e.target.value = '';
    if (!file) return;
    setUpBusy('통장사본을 올리는 중이에요...');
    try {
      const blob = await upload(`bank/${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        clientPayload: 'edu-payment',
      });
      setSettings((s) => ({ ...s, bankPhoto: blob.url }));
    } catch (e2) {
      alert('올리지 못했어요: ' + e2.message);
    } finally {
      setUpBusy('');
    }
  };

  const makeLink = async () => {
    if (!title.trim() || !amount) return alert('교육명과 교육비를 넣어주세요.');
    setMaking(true);
    try {
      const res = await fetch('/api/link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key: PASSWORD, course: { title: title.trim(), amount, note } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLink(`${window.location.origin}/p/${data.code}`);
    } catch (e) {
      alert('만들지 못했어요: ' + e.message);
    } finally {
      setMaking(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopyLabel('복사됐어요!');
      setTimeout(() => setCopyLabel('링크 복사하기'), 1600);
    } catch (e) {
      alert('복사가 안 됐어요. 링크를 직접 눌러 복사해 주세요.');
    }
  };

  const setStatus = async (id, status) => {
    await fetch('/api/subs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: PASSWORD, id, status }),
    });
    loadSubs();
  };

  const downloadExcel = async () => {
    const targets = subs.filter((s) => s.wantInvoice && picked[s.id]);
    if (!targets.length) return alert('먼저 내려받을 신청을 골라주세요(왼쪽 네모 클릭).');
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    await downloadHometaxExcel(targets, `홈택스_전자계산서_일괄발급_${today}.xlsx`);
  };

  if (!unlocked) {
    return (
      <div className="admin">
        <div className="section gate center">
          <Mascot name="book" style={{ width: 96, margin: '0 auto 8px', display: 'block' }} alt="기록이" />
          <div className="section-title" style={{ justifyContent: 'center', borderBottom: 'none' }}>관리자 확인</div>
          <div className="field">
            <input
              type="password" value={pw} onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && pw === PASSWORD) { setUnlocked(true); sessionStorage.setItem('edu-payment-unlocked','y'); } }}
              placeholder="비밀번호"
            />
          </div>
          <button className="btn" onClick={() => {
            if (pw === PASSWORD) { setUnlocked(true); sessionStorage.setItem('edu-payment-unlocked','y'); }
            else alert('비밀번호가 달라요.');
          }}>들어가기</button>
        </div>
      </div>
    );
  }

  if (!settings) return <div className="admin center" style={{ paddingTop: 60 }}>불러오는 중이에요...</div>;

  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));
  const waiting = subs.filter((s) => s.wantInvoice && s.status === '발급대기');

  return (
    <div className="admin">
      <div className="admin-head">
        <Mascot name="family" style={{ width: 210, margin: '0 auto 6px', display: 'block' }} alt="우리아이들" />
        <h1>교육비 이체 안내 관리</h1>
        <p>계좌를 한 번 등록해 두고, 교육마다 링크만 만들어 보내면 됩니다.</p>
      </div>

      <div className="section">
        <div className="section-title"><span className="no">1</span>계좌 · 통장사본 (한 번만 등록)</div>
        <div className="field-row">
          <div className="field">
            <label>은행</label>
            <input value={settings.bank} onChange={(e) => set('bank', e.target.value)} placeholder="예: 국민은행" />
          </div>
          <div className="field">
            <label>예금주</label>
            <input value={settings.holder} onChange={(e) => set('holder', e.target.value)} placeholder="예: 라지숙" />
          </div>
        </div>
        <div className="field">
          <label>계좌번호</label>
          <input value={settings.accountNo} onChange={(e) => set('accountNo', e.target.value)} placeholder="예: 123456-01-234567" />
        </div>
        <div className="field">
          <label>통장사본 사진</label>
          <label className="add-btn" style={{ display: 'block', textAlign: 'center' }}>
            {upBusy || (settings.bankPhoto ? '다른 사진으로 바꾸기' : '+ 통장사본 올리기')}
            <input type="file" accept="image/*" onChange={onPickBankPhoto} disabled={!!upBusy} style={{ display: 'none' }} />
          </label>
          {settings.bankPhoto && <img className="photo-preview" src={settings.bankPhoto} alt="통장사본" />}
        </div>
        <div className="field">
          <label>입금 안내 문구 (선택)</label>
          <textarea value={settings.payNote} onChange={(e) => set('payNote', e.target.value)} style={{ minHeight: 70 }}
            placeholder={'예: 교육 시작 3일 전까지 입금 부탁드립니다.'} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>마지막 화면 연락처 안내 (선택)</label>
          <textarea value={settings.contact} onChange={(e) => set('contact', e.target.value)} style={{ minHeight: 60 }}
            placeholder={'예: 궁금한 점은 010-0000-0000 으로 연락 주세요.'} />
        </div>
        <button className="btn mt14" onClick={saveSettings} disabled={saving}>
          {saving ? '저장하는 중...' : '계좌 정보 저장하기'}
        </button>
      </div>

      <div className="section">
        <div className="section-title"><span className="no">2</span>교육별 안내 링크 만들기</div>
        <div className="field">
          <label>교육명 <span className="req">*</span></label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 2026년 하반기 사례발표 교육" />
        </div>
        <div className="field">
          <label>교육비(원) <span className="req">*</span></label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="300000" />
        </div>
        <div className="field">
          <label>안내 문구 (선택)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} style={{ minHeight: 70 }}
            placeholder={'예: 8월 19일 사례발표 교육 참가비입니다.'} />
        </div>
        <button className="btn" onClick={makeLink} disabled={making}>
          {making ? '만드는 중...' : '안내 링크 만들기'}
        </button>
        {link && (
          <div className="result-box">
            <div className="result-label">이 링크를 보내세요</div>
            <div className="link-box">{link}</div>
            <div className="btn-row">
              <button className="btn sm green" onClick={copyLink}>{copyLabel}</button>
              <button className="btn sm ghost" onClick={() => window.open(link, '_blank')}>미리보기</button>
            </div>
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-title"><span className="no">3</span>접수 목록 · 홈택스 파일</div>
        <div className="btn-row" style={{ marginBottom: 12 }}>
          <button className="btn sm ghost" onClick={loadSubs} disabled={loadingSubs}>
            {loadingSubs ? '불러오는 중...' : '새로고침'}
          </button>
          <button className="btn sm green" onClick={downloadExcel}>홈택스 업로드 파일 내려받기</button>
        </div>
        <div className="tiny-note" style={{ marginTop: 0 }}>
          발급할 신청을 왼쪽 네모로 고른 뒤 내려받으면, 홈택스 <strong>전자계산서 대량 업로드 양식</strong> 그대로 만들어집니다.
          <br />
          홈택스 → 전자(세금)계산서 → 발급 → 건별/대량 발급 → 엑셀 업로드에 그 파일을 올리시면 돼요.
        </div>

        <div className="tiny-note">
          전체 {subs.length}건 · 발급 기다리는 신청 <strong>{waiting.length}건</strong>
        </div>

        <div className="table-wrap">
          <table className="subs">
            <thead>
              <tr>
                <th style={{ width: 30 }}></th>
                <th>접수일</th>
                <th>교육 / 금액</th>
                <th>기관 · 고유번호</th>
                <th>대표자 · 주소</th>
                <th>메일 · 이체일</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id}>
                  <td>
                    {s.wantInvoice && (
                      <input
                        type="checkbox"
                        checked={!!picked[s.id]}
                        onChange={(e) => setPicked((p) => ({ ...p, [s.id]: e.target.checked }))}
                      />
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{String(s.createdAt || '').slice(0, 10)}</td>
                  <td>
                    {s.courseTitle}
                    <br />
                    <b>{won(s.amount)}원</b>
                    {s.payerName ? <><br /><span style={{ color: '#8b7b6b' }}>입금자 {s.payerName}</span></> : null}
                  </td>
                  <td>
                    {s.orgName || '-'}
                    <br />
                    <span style={{ color: '#8b7b6b' }}>{s.bizNo || '-'}</span>
                    {s.proofUrl ? <><br /><a href={s.proofUrl} target="_blank" rel="noreferrer">증명서 보기</a></> : null}
                  </td>
                  <td>
                    {s.ceo || '-'}
                    <br />
                    <span style={{ color: '#8b7b6b' }}>{s.address || '-'}</span>
                  </td>
                  <td>
                    {s.email || '-'}
                    <br />
                    <span style={{ color: '#8b7b6b' }}>{s.payDate || '-'}</span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span className={`pill ${s.status === '발급완료' ? 'done' : s.wantInvoice ? 'wait' : 'none'}`}>
                      {s.status}
                    </span>
                    {s.wantInvoice && s.status !== '발급완료' && (
                      <><br /><button className="link-del" style={{ marginTop: 6 }} onClick={() => setStatus(s.id, '발급완료')}>발급완료로</button></>
                    )}
                  </td>
                </tr>
              ))}
              {!subs.length && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#8b7b6b', padding: 24 }}>아직 접수가 없어요.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section">
        <div className="section-title"><span className="no">4</span>카카오톡으로 알림 받기</div>
        <div className="tiny-note" style={{ marginTop: 0 }}>
          아래 버튼을 눌러 <strong>원장님 카카오 계정으로 한 번만 연결</strong>해 두면,
          신청이 들어올 때마다 정리된 내용이 <strong>나와의 채팅</strong>으로 바로 옵니다.
        </div>
        <a className="btn mt14" href="/api/kakao/login" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
          카카오톡 연결하기
        </a>
      </div>

      <p className="tiny-note center">비밀번호 1234 · 이 화면은 원장님만 쓰세요.</p>
    </div>
  );
}
