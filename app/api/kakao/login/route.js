// 카카오톡 연결 시작 (원장님이 한 번만 누르면 된다)
export const runtime = 'nodejs';

export async function GET(req) {
  if (!process.env.KAKAO_REST_KEY) {
    return new Response('카카오 앱 열쇠(KAKAO_REST_KEY)가 아직 등록되지 않았어요.', { status: 500 });
  }
  const origin = new URL(req.url).origin;
  const params = new URLSearchParams({
    client_id: process.env.KAKAO_REST_KEY,
    redirect_uri: `${origin}/api/kakao/callback`,
    response_type: 'code',
    scope: 'talk_message',
  });
  return Response.redirect(`https://kauth.kakao.com/oauth/authorize?${params}`, 302);
}
