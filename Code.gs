/**
 * Maple Wedding - Google Apps Script Webhook (전체 버전)
 *
 * 처리하는 요청 2가지 (js/main.js 기준)
 *  1) 참석의사(RSVP)  : { timestamp, side, name, attend, count, meal, message }  → 시트에 한 줄 추가
 *  2) 사진 올리기     : { action: 'upload_photos', folderId, uploaderName, files: [{ name, type, base64 }] }
 *                       → 드라이브 폴더 안에 "업로더 성함" 하위 폴더를 만들고(있으면 재사용) 그 안에 저장
 *
 * 배포: 배포 > 배포 관리 > 연필(수정) > 버전 "새 버전" > 배포
 *       (실행 사용자: 나 / 액세스 권한: 모든 사용자)
 *       → "새 배포"가 아니라 기존 배포를 수정해야 /exec URL이 바뀌지 않습니다.
 */

// ===== 설정 =====
// 스크립트가 시트에 연결된(컨테이너 바인딩) 경우 비워둬도 됩니다.
// 단독 스크립트라면 스프레드시트 URL의 /d/ 와 /edit 사이 ID를 넣으세요.
const SPREADSHEET_ID = '';
const RSVP_SHEET_NAME = '참석의사';
const RSVP_HEADERS = ['제출시각', '구분', '성함', '참석여부', '인원', '식사여부', '메시지'];

// 클라이언트가 folderId를 안 보냈을 때 사용할 기본 폴더 (main.js의 DRIVE_FOLDER_ID와 동일)
const DEFAULT_FOLDER_ID = '1SFKJ1G5HZtnxrUwhXN2D9l_iAAqIqab-';

// ===== 진입점 =====
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);

    const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const data = JSON.parse(raw);

    let result;
    if (data.action === 'upload_photos') {
      result = handlePhotoUpload_(data);
    } else {
      result = handleRsvp_(data);
    }
    return json_({ ok: true, result: result });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

// 브라우저로 /exec 열었을 때 동작 확인용
function doGet() {
  return json_({ ok: true, message: 'Maple Wedding webhook is running.' });
}

// ===== RSVP =====
function handleRsvp_(data) {
  const sheet = getRsvpSheet_();
  const row = [
    data.timestamp || new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    data.side || '',
    data.name || '',
    data.attend || '',
    data.count || '',
    data.meal || '',
    data.message || '',
  ];
  sheet.appendRow(row);
  return { saved: 'rsvp', row: sheet.getLastRow() };
}

function getRsvpSheet_() {
  const ss = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('스프레드시트를 찾을 수 없습니다. SPREADSHEET_ID를 설정하세요.');

  let sheet = ss.getSheetByName(RSVP_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(RSVP_SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(RSVP_HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ===== 사진 업로드 =====
function handlePhotoUpload_(data) {
  const files = Array.isArray(data.files) ? data.files : [];
  if (!files.length) return { saved: 0 };

  const rootFolder = DriveApp.getFolderById(data.folderId || DEFAULT_FOLDER_ID);
  const uploaderName = sanitizeName_(data.uploaderName) || '이름없음';
  const targetFolder = getOrCreateSubFolder_(rootFolder, uploaderName);

  const stamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyyMMdd_HHmmss');
  const saved = [];

  files.forEach(function (f, i) {
    if (!f || !f.base64) return;
    const bytes = Utilities.base64Decode(f.base64);
    const fileName = stamp + '_' + (i + 1) + '_' + sanitizeName_(f.name || 'photo.jpg');
    const blob = Utilities.newBlob(bytes, f.type || 'application/octet-stream', fileName);
    const file = targetFolder.createFile(blob);
    saved.push(file.getName());
  });

  return { saved: saved.length, folder: uploaderName, files: saved };
}

function getOrCreateSubFolder_(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

// 드라이브 폴더/파일명에 쓰기 위험한 문자 제거
function sanitizeName_(s) {
  return String(s || '')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

// ===== 공통 =====
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * (선택) 에디터에서 한 번 실행해 드라이브/시트 권한 승인 + 동작 테스트
 */
function testAll() {
  Logger.log(handleRsvp_({ side: '신랑측', name: '테스트', attend: '참석', count: '1명', meal: '식사 예정', message: 'test' }));
  const tinyPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  Logger.log(handlePhotoUpload_({ uploaderName: '테스트', files: [{ name: 'test.png', type: 'image/png', base64: tinyPng }] }));
}
