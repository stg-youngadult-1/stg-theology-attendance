// services/sheetsConfig.js

// Google Sheets 관련 설정
export const SHEETS_CONFIG = {
    // 스프레드시트 ID
    spreadsheetId: '1-gUVumU_3rU82Y1tY9cX9PUe10zJsMlDmw6chxc03nY',

    // 시트명
    sheetName: '출석부 웹페이지 DB',

    // 데이터 범위
    range: 'A1:P500',

    // API 관련 설정
    api: {
        baseUrl: 'https://sheets.googleapis.com/v4/spreadsheets',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scope: 'https://www.googleapis.com/auth/spreadsheets'
    }
};

// 서비스 계정 자격 증명
// 실제 운영 환경에서는 환경변수나 별도 보안 저장소에서 관리해야 함
export const SERVICE_ACCOUNT_CREDENTIALS = JSON.parse(import.meta.env.VITE_SERVICE_ACCOUNT_CREDENTIALS);

// 기본 요청 옵션
export const DEFAULT_REQUEST_OPTIONS = {
    valueRenderOption: 'FORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING'
};