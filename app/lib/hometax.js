// 홈택스 "전자계산서 대량 업로드" 양식 그대로 엑셀 파일을 만든다.
// 실제 홈택스 양식(전자계산서-일반, 46개 항목, 7행부터 자료 입력)에 맞춘 것.

export const HEADERS = [
  '전자(세금)계산서 종류\n(05::일반)',
  '작성일자\n(8자리,\n(YYYYMMDD 형식)',
  '공급받는자 등록번호\n("-" 없이 입력)',
  '공급받는자 \n종사업장번호',
  '공급받는자 상호',
  '공급받는자 성명',
  '공급받는자 사업장주소',
  '공급받는자 업태',
  '공급받는자 종목',
  '공급받는자 이메일1',
  '공급받는자 이메일2',
  '공급가액',
  '비고',
  '일자1\n(2자리, 작성년월 제외)', '품목1', '규격1', '수량1', '단가1', '공급가액1', '품목비고1',
  '일자2\n(2자리, 작성년월 제외)', '품목2', '규격2', '수량2', '단가2', '공급가액2', '품목비고2',
  '일자3\n(2자리, 작성년월 제외)', '품목3', '규격3', '수량3', '단가3', '공급가액3', '품목비고3',
  '일자4\n(2자리, 작성년월 제외)', '품목4', '규격4', '수량4', '단가4', '공급가액4', '품목비고4',
  '현금', '수표', '어음', '외상미수금',
  '영수(01),\n청구(02)',
];

const NOTICE = [
  '엑셀 대량 업로드 양식(전자계산서-일반)',
  '★주황색으로 표시된 부분은 필수입력항목으로 반드시 입력하셔야 합니다.\n★아래 항목설명을 참고하여 작성하시기 바랍니다.',
  '★실제 업로드할 DATA는 7행부터 입력하여야 합니다. 최대 1000건까지 입력이 가능합니다.',
  '★전자(세금)계산서 종류는 반드시 입력하셔야 합니다. ★품목은 1건이상 입력해야 합니다.',
];

const digits = (s) => String(s || '').replace(/[^0-9]/g, '');

// 접수 1건 → 양식 한 줄
export function toRow(rec) {
  const row = new Array(HEADERS.length).fill('');
  const ymd = String(rec.payDate || '').replace(/-/g, '');
  const amount = Number(rec.amount) || 0;

  row[0] = '05';
  row[1] = ymd;
  row[2] = digits(rec.bizNo);
  row[4] = rec.orgName || '';
  row[5] = rec.ceo || '';
  row[6] = rec.address || '';
  row[7] = rec.upte || '';
  row[8] = rec.jongmok || '';
  row[9] = rec.email || '';
  row[11] = amount;
  row[13] = ymd.slice(6, 8);
  row[14] = rec.courseTitle || '교육비';
  row[16] = 1;
  row[17] = amount;
  row[18] = amount;
  row[41] = amount;   // 현금
  row[45] = '01';     // 영수 (이미 입금받음)
  return row;
}

// 홈택스에 그대로 올릴 수 있는 엑셀 파일 만들기
export async function downloadHometaxExcel(records, fileName) {
  const XLSX = await import('xlsx');
  const aoa = [
    [NOTICE[0]],
    [NOTICE[1]],
    [NOTICE[2]],
    [NOTICE[3]],
    [],
    HEADERS,
    ...records.map(toRow),
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '엑셀업로드양식');
  XLSX.writeFile(wb, fileName);
}
