/**
 * Maple Wedding - Google Apps Script Webhook (전체 버전)
 *
 * 처리하는 요청 (Next.js 서버의 src/lib/gas.ts 기준)
 *  1) 참석의사(RSVP)  : POST { timestamp, side, name, attend, count, meal }  → '참석의사' 시트에 한 줄 추가
 *  2) 방명록 등록     : POST { action: 'guestbook_add', id, timestamp(ISO), name, contact, message }
 *                       → '방명록' 시트에 한 줄 추가
 *  3) 방명록 삭제     : POST { action: 'guestbook_delete', id, name, contact }
 *                       → 성함·연락처 뒷자리가 일치하면 해당 행 삭제
 *  4) 방명록 조회     : GET ?action=guestbook_list
 *                       → { entries: [{ id, name, message, timestamp(ISO) }] } 등록시각 최신순 (연락처는 내려주지 않음)
 *  5) 사진 올리기     : POST { action: 'upload_photos', folderId, uploaderName, files: [{ name, type, base64 }] }
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
const RSVP_HEADERS = ['구분', '성함', '참석여부', '인원', '식사여부', '등록일시'];

const GUESTBOOK_SHEET_NAME = '방명록';
const GUESTBOOK_HEADERS = ['ID', '성함', '연락처 뒷자리', '메시지', '등록일시'];
const GUESTBOOK_COL = { ID: 0, NAME: 1, CONTACT: 2, MESSAGE: 3, TIME: 4 };
// 등록시각은 Date 로 저장해 시트에서도 정렬되게 하고, 나머지는 텍스트 서식으로 고정한다.
// (연락처 '0123' 의 앞자리 0 이 숫자로 바뀌어 사라지거나, '=' 로 시작하는 메시지가 수식으로 해석되는 것을 막는다)
const GUESTBOOK_NUMBER_FORMATS = [['@', '@', '@', '@', 'yyyy-mm-dd hh:mm:ss']];

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
    } else if (data.action === 'guestbook_add') {
      result = handleGuestbookAdd_(data);
    } else if (data.action === 'guestbook_delete') {
      result = handleGuestbookDelete_(data);
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

// ?action=guestbook_list 이면 방명록 목록, 그 외에는 브라우저로 /exec 열었을 때 동작 확인용 응답
function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : '';
  if (action === 'guestbook_list') {
    try {
      return json_({ ok: true, result: listGuestbook_() });
    } catch (err) {
      console.error(err);
      return json_({ ok: false, error: String(err && err.message ? err.message : err) });
    }
  }
  return json_({ ok: true, message: 'Maple Wedding webhook is running.' });
}

// ===== RSVP =====
function handleRsvp_(data) {
  const sheet = getOrCreateSheet_(RSVP_SHEET_NAME, RSVP_HEADERS);
  const row = [
    data.side || '',
    data.name || '',
    data.attend || '',
    toCount_(data.count),
    data.meal || '',
    data.timestamp || new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
  ];
  sheet.appendRow(row);
  return { saved: 'rsvp', row: sheet.getLastRow() };
}

// 시트에서 합계·필터를 바로 쓸 수 있도록 인원은 '3명' 같은 단위 없이 숫자만 저장한다.
function toCount_(value) {
  const digits = String(value === undefined || value === null ? '' : value).replace(/[^0-9]/g, '');
  return digits ? Number(digits) : '';
}

// ===== 방명록 =====
function handleGuestbookAdd_(data) {
  const sheet = getOrCreateSheet_(GUESTBOOK_SHEET_NAME, GUESTBOOK_HEADERS);
  const parsed = data.timestamp ? new Date(data.timestamp) : new Date();
  const createdAt = isNaN(parsed.getTime()) ? new Date() : parsed;
  const id = data.id ? String(data.id) : Utilities.getUuid();

  // appendRow 는 값을 자동 변환하므로, 서식을 먼저 지정한 빈 행에 setValues 로 쓴다.
  const range = sheet.getRange(sheet.getLastRow() + 1, 1, 1, GUESTBOOK_HEADERS.length);
  range.setNumberFormats(GUESTBOOK_NUMBER_FORMATS);
  range.setValues([[
    id,
    String(data.name || ''),
    String(data.contact || ''),
    String(data.message || ''),
    createdAt,
  ]]);
  return { saved: 'guestbook', id: id, row: range.getRow() };
}

function listGuestbook_() {
  const sheet = getOrCreateSheet_(GUESTBOOK_SHEET_NAME, GUESTBOOK_HEADERS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { entries: [] };

  const rows = sheet.getRange(2, 1, lastRow - 1, GUESTBOOK_HEADERS.length).getValues();
  const entries = rows
    .filter(function (row) { return row[GUESTBOOK_COL.ID] !== ''; })
    .map(function (row) {
      const time = toDate_(row[GUESTBOOK_COL.TIME]);
      return {
        id: String(row[GUESTBOOK_COL.ID]),
        name: String(row[GUESTBOOK_COL.NAME]),
        message: String(row[GUESTBOOK_COL.MESSAGE]),
        timestamp: time ? time.toISOString() : '',
        sortKey: time ? time.getTime() : 0,
      };
    })
    .sort(function (a, b) { return b.sortKey - a.sortKey; })
    .map(function (entry) {
      return { id: entry.id, name: entry.name, message: entry.message, timestamp: entry.timestamp };
    });
  return { entries: entries };
}

// 연락처를 클라이언트에 내려주지 않으므로 본인 확인은 여기서 한다.
function handleGuestbookDelete_(data) {
  const sheet = getOrCreateSheet_(GUESTBOOK_SHEET_NAME, GUESTBOOK_HEADERS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2 || !data.id) return { deleted: false, reason: 'not_found' };

  const rows = sheet.getRange(2, 1, lastRow - 1, GUESTBOOK_HEADERS.length).getValues();
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[GUESTBOOK_COL.ID]) !== String(data.id)) continue;

    const nameMatched = String(row[GUESTBOOK_COL.NAME]).trim() === String(data.name || '').trim();
    const contactMatched = String(row[GUESTBOOK_COL.CONTACT]).trim() === String(data.contact || '').trim();
    if (!nameMatched || !contactMatched) return { deleted: false, reason: 'mismatch' };

    sheet.deleteRow(i + 2);
    return { deleted: true };
  }
  return { deleted: false, reason: 'not_found' };
}

// 시트에 직접 입력한 행은 문자열일 수 있으므로 Date 가 아니면 파싱을 시도한다.
function toDate_(value) {
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (!value) return null;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// ===== 시트 공통 =====
function getOrCreateSheet_(name, headers) {
  const ss = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('스프레드시트를 찾을 수 없습니다. SPREADSHEET_ID를 설정하세요.');

  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
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
  Logger.log(handleRsvp_({ side: '신랑측', name: '테스트', attend: '참석', count: 1, meal: '식사 예정' }));
  const added = handleGuestbookAdd_({ name: '테스트', contact: '0123', message: '방명록 테스트' });
  Logger.log(added);
  Logger.log(listGuestbook_());
  Logger.log(handleGuestbookDelete_({ id: added.id, name: '테스트', contact: '0123' }));
  const tinyPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  Logger.log(handlePhotoUpload_({ uploaderName: '테스트', files: [{ name: 'test.png', type: 'image/png', base64: tinyPng }] }));
}