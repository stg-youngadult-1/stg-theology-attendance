// services/GoogleSheetsData.js

import {SHEETS_CONFIG, DEFAULT_REQUEST_OPTIONS} from './sheetsConfig.js';
import googleSheetsAuth from './GoogleSheetsAuth.js';
import {getDataRows, getHeader} from "./model.js";

/**
 * Google Sheets 데이터 조회를 담당하는 클래스
 * 인증된 상태에서 스프레드시트 데이터를 가져오고 처리
 */
class GoogleSheetsData {
    constructor(authInstance = googleSheetsAuth) {
        this.auth = authInstance;
    }

    /**
     * API 요청 헬퍼 메서드
     * @param {string} url - 요청 URL
     * @returns {Promise<Object>} API 응답 데이터
     */
    async makeApiRequest(url) {
        try {
            // 토큰 유효성 확인 및 필요시 갱신
            await this.auth.ensureValidToken();

            const response = await fetch(url, {
                headers: this.auth.getAuthHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                // 401 에러인 경우 인증 재시도
                if (response.status === 401) {
                    console.log('🔄 401 오류 - 인증 재시도');
                    this.auth.clearAuthentication();
                    await this.auth.authenticate();

                    // 재인증 후 재시도
                    const retryResponse = await fetch(url, {
                        headers: this.auth.getAuthHeaders()
                    });

                    if (!retryResponse.ok) {
                        const retryErrorData = await retryResponse.json().catch(() => ({}));
                        throw new Error(`API 요청 재시도 실패: ${retryResponse.status} - ${retryErrorData.error?.message || retryResponse.statusText}`);
                    }

                    return await retryResponse.json();
                }

                throw new Error(`API 요청 실패: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API 요청 중 오류:', error);
            throw error;
        }
    }

    /**
     * 스프레드시트 데이터 조회
     * @param {string} spreadsheetId - 스프레드시트 ID
     * @param {string} sheetName - 시트명
     * @param {string} range - 데이터 범위
     * @returns {Promise<Array<Array<string>>>} 스프레드시트 데이터 배열
     */
    async getSheetData(
        spreadsheetId = SHEETS_CONFIG.spreadsheetId,
        sheetName = SHEETS_CONFIG.sheetName,
        range = SHEETS_CONFIG.range
    ) {
        try {
            console.log(`📊 데이터 조회 시작: ${sheetName}!${range}`);

            const encodedSheetName = encodeURIComponent(sheetName);
            const encodedRange = encodeURIComponent(range);

            const queryParams = new URLSearchParams({
                valueRenderOption: DEFAULT_REQUEST_OPTIONS.valueRenderOption,
                dateTimeRenderOption: DEFAULT_REQUEST_OPTIONS.dateTimeRenderOption
            });

            const url = `${SHEETS_CONFIG.api.baseUrl}/${spreadsheetId}/values/${encodedSheetName}!${encodedRange}?${queryParams}`;

            const data = await this.makeApiRequest(url);

            if (!data.values || data.values.length === 0) {
                console.warn('⚠️ 조회된 데이터가 없습니다.');
                return [];
            }

            console.log(`✅ 데이터 조회 완료: ${data.values.length}행`);
            return data.values;
        } catch (error) {
            console.error('❌ 데이터 조회 실패:', error.message);
            throw new Error(`스프레드시트 데이터 조회 실패: ${error.message}`);
        }
    }

    /**
     * 여러 범위의 데이터를 한 번에 조회
     * @param {string} spreadsheetId - 스프레드시트 ID
     * @param {Array<string>} ranges - 범위 배열 (예: ['Sheet1!A1:C10', 'Sheet2!A1:B5'])
     * @returns {Promise<Object>} 범위별 데이터 객체
     */
    async getBatchData(spreadsheetId = SHEETS_CONFIG.spreadsheetId, ranges) {
        try {
            console.log(`📊 배치 데이터 조회 시작: ${ranges.length}개 범위`);

            const encodedRanges = ranges.map(range => encodeURIComponent(range));
            const queryParams = new URLSearchParams({
                valueRenderOption: DEFAULT_REQUEST_OPTIONS.valueRenderOption,
                dateTimeRenderOption: DEFAULT_REQUEST_OPTIONS.dateTimeRenderOption
            });

            // 각 범위를 쿼리 파라미터로 추가
            encodedRanges.forEach(range => queryParams.append('ranges', range));

            const url = `${SHEETS_CONFIG.api.baseUrl}/${spreadsheetId}/values:batchGet?${queryParams}`;

            const data = await this.makeApiRequest(url);

            const result = {};
            if (data.valueRanges) {
                data.valueRanges.forEach((valueRange, index) => {
                    const originalRange = ranges[index];
                    result[originalRange] = valueRange.values || [];
                });
            }

            console.log(`✅ 배치 데이터 조회 완료: ${Object.keys(result).length}개 범위`);
            return result;
        } catch (error) {
            console.error('❌ 배치 데이터 조회 실패:', error.message);
            throw new Error(`배치 데이터 조회 실패: ${error.message}`);
        }
    }

    /**
     * 스프레드시트 메타데이터 조회
     * @param {string} spreadsheetId - 스프레드시트 ID
     * @returns {Promise<Object>} 스프레드시트 메타데이터
     */
    async getSpreadsheetMetadata(spreadsheetId = SHEETS_CONFIG.spreadsheetId) {
        try {
            console.log(`📋 스프레드시트 메타데이터 조회: ${spreadsheetId}`);

            const url = `${SHEETS_CONFIG.api.baseUrl}/${spreadsheetId}`;
            const data = await this.makeApiRequest(url);

            console.log(`✅ 메타데이터 조회 완료: ${data.properties?.title}`);
            return data;
        } catch (error) {
            console.error('❌ 메타데이터 조회 실패:', error.message);
            throw new Error(`스프레드시트 메타데이터 조회 실패: ${error.message}`);
        }
    }

    /**
     * 스프레드시트 데이터를 조회하고 구조화된 형태로 반환
     * @param {string} spreadsheetId - 스프레드시트 ID
     * @param {string} sheetName - 시트명
     * @param {string} range - 데이터 범위
     * @returns {Promise<Object>} 구조화된 데이터 객체
     */
    async fetchSheetData(
        spreadsheetId = SHEETS_CONFIG.spreadsheetId,
        sheetName = SHEETS_CONFIG.sheetName,
        range = SHEETS_CONFIG.range
    ) {
        try {
            const values = await this.getSheetData(spreadsheetId, sheetName, range);

            if (!values || values.length === 0) {
                return {
                    rows: [],
                    headers: [],
                    dataRows: [],
                    totalRows: 0,
                    dataRowCount: 0,
                    hasData: false,
                    range,
                    sheetName,
                    spreadsheetId
                };
            }

            // 첫 번째 행을 헤더로 처리
            const headers = await getHeader(values);
            const dataRows = await getDataRows(values, headers.length);

            const result = {
                rows: values,
                headers,
                dataRows,
                totalRows: values.length,
                dataRowCount: dataRows.length,
                hasData: true,
                range,
                sheetName,
                spreadsheetId,
                lastUpdated: new Date().toISOString()
            };

            console.log(`📋 데이터 처리 완료:`, {
                totalRows: result.totalRows,
                dataRows: result.dataRowCount,
                headers: result.headers.length,
                sheetName: result.sheetName
            });

            return result;
        } catch (error) {
            console.error('❌ 데이터 가져오기 실패:', error);
            throw error;
        }
    }

    /**
     * 특정 셀의 값 조회
     * @param {string} spreadsheetId - 스프레드시트 ID
     * @param {string} sheetName - 시트명
     * @param {string} cellAddress - 셀 주소 (예: 'A1')
     * @returns {Promise<string>} 셀 값
     */
    async getCellValue(
        spreadsheetId = SHEETS_CONFIG.spreadsheetId,
        sheetName = SHEETS_CONFIG.sheetName,
        cellAddress
    ) {
        try {
            const range = `${sheetName}!${cellAddress}`;
            const values = await this.getSheetData(spreadsheetId, sheetName, cellAddress);

            return values[0]?.[0] || '';
        } catch (error) {
            console.error('❌ 셀 값 조회 실패:', error.message);
            throw new Error(`셀 값 조회 실패: ${error.message}`);
        }
    }

    /**
     * 데이터를 CSV 형태로 변환
     * @param {Array<Array<string>>} data - 스프레드시트 데이터
     * @param {string} delimiter - 구분자 (기본값: ',')
     * @returns {string} CSV 문자열
     */
    convertToCSV(data, delimiter = ',') {
        if (!data || data.length === 0) return '';

        return data.map(row =>
            row.map(cell => {
                // 셀에 구분자, 줄바꿈, 따옴표가 있으면 따옴표로 감싸기
                const cellStr = String(cell || '');
                if (cellStr.includes(delimiter) || cellStr.includes('\n') || cellStr.includes('"')) {
                    return `"${cellStr.replace(/"/g, '""')}"`;
                }
                return cellStr;
            }).join(delimiter)
        ).join('\n');
    }

    /**
     * 데이터를 JSON 형태로 변환 (헤더를 키로 사용)
     * @param {Array<Array<string>>} data - 스프레드시트 데이터
     * @returns {Array<Object>} JSON 배열
     */
    convertToJSON(data) {
        if (!data || data.length === 0) return [];

        const headers = data[0];
        const rows = data.slice(1);

        return rows.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index] || '';
            });
            return obj;
        });
    }

    /**
     * 연결 상태 테스트
     * @returns {Promise<boolean>} 연결 성공 여부
     */
    async testConnection() {
        try {
            console.log('🔍 연결 상태 테스트 중...');
            await this.getSpreadsheetMetadata();
            console.log('✅ 연결 상태 테스트 성공');
            return true;
        } catch (error) {
            console.error('❌ 연결 상태 테스트 실패:', error.message);
            return false;
        }
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
const googleSheetsData = new GoogleSheetsData();

export default googleSheetsData;
export {GoogleSheetsData};