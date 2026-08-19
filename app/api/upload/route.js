// 고유번호증·통장사본 사진을 보관함에 올리기 위한 창구
import { handleUpload } from '@vercel/blob/client';

export const runtime = 'nodejs';
export const maxDuration = 30;

const UPLOAD_KEY = 'edu-payment';

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (clientPayload !== UPLOAD_KEY) throw new Error('올릴 권한이 없어요.');
        return {
          allowedContentTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'application/pdf'],
          maximumSizeInBytes: 20 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}
