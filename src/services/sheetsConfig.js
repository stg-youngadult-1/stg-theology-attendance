// services/sheetsConfig.js

const SHEETS_API = {
    baseUrl: 'https://sheets.googleapis.com/v4/spreadsheets',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/spreadsheets'
}

// 다중 스프레드시트 설정
const SHEETS_CONFIGS = {
    // 기본 출석부 (기존 설정)
    attendance: {
        spreadsheetId: '1-gUVumU_3rU82Y1tY9cX9PUe10zJsMlDmw6chxc03nY',
        sheetName: '출석부 웹페이지 DB',
        range: 'A1:P500'
    }
    // 추가 스프레드시트 설정은 여기에 추가
    // example: {
    //     spreadsheetId: 'another-spreadsheet-id',
    //     sheetName: '다른 시트',
    //     range: 'A1:Z200'
    // }
};

/**
 * 특정 sheetId에 해당하는 설정을 가져옵니다
 * @param {string} sheetId - 시트 ID
 * @returns {Object} 시트 설정 객체
 */
export const getSheetConfig = (sheetId) => {
    const config = SHEETS_CONFIGS[sheetId];
    if (!config) {
        throw new Error(`❌ Sheet configuration not found for sheetId: ${sheetId}`);
    }

    return {
        ...config,
        api: SHEETS_API // API 설정은 공통으로 사용
    };
};

// 서비스 계정 자격 증명
// 실제 운영 환경에서는 환경변수나 별도 보안 저장소에서 관리해야 함
export const SERVICE_ACCOUNT_CREDENTIALS = JSON.parse(import.meta.env.VITE_SERVICE_ACCOUNT_CREDENTIALS);

// 기본 요청 옵션
export const DEFAULT_REQUEST_OPTIONS = {
    valueRenderOption: 'FORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING'
};