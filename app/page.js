'use client';

// 첫 화면 — 원장님용 안내 (참가자는 /p/코드 주소로 들어온다)
import Mascot from './components/Mascot';

export default function Home() {
  return (
    <div className="stage">
      <div className="card center">
        <Mascot name="family" className="mascot-hero" alt="우리아이들 캐릭터" />
        <div className="step-title">교육비 이체 안내</div>
        <p className="step-sub mt8">
          참가자에게 보낼 안내 링크는 관리자 화면에서 만드실 수 있어요.
        </p>
        <div className="mt20">
          <a className="btn" href="/admin" style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}>
            관리자 화면으로
          </a>
        </div>
      </div>
    </div>
  );
}
