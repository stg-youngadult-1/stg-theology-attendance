// services/GoogleSheetsData.js

import {getSheetConfig, DEFAULT_REQUEST_OPTIONS} from './sheetsConfig.js';
import googleSheetsAuth from './GoogleSheetsAuth.js';
import {getDataRows, getHeader, isEqualStatus} from "./model.js";

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
     * @param {Object} options - fetch 옵션
     * @returns {Promise<Object>} API 응답 데이터
     */
    async makeApiRequest(url, options = {}) {
        try {
            // 토큰 유효성 확인 및 필요시 갱신
            await this.auth.ensureValidToken();

            const requestOptions = {
                headers: {
                    ...this.auth.getAuthHeaders(),
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            };

            const response = await fetch(url, requestOptions);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                // 401 에러인 경우 인증 재시도
                if (response.status === 401) {
                    console.log('🔄 401 오류 - 인증 재시도');
                    this.auth.clearAuthentication();
                    await this.auth.authenticate();

                    // 재인증 후 재시도
                    const retryRequestOptions = {
                        ...requestOptions,
                        headers: {
                            ...this.auth.getAuthHeaders(),
                            'Content-Type': 'application/json',
                            ...options.headers
                        }
                    };

                    const retryResponse = await fetch(url, retryRequestOptions);

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
        spreadsheetId = getSheetConfig('attendance').spreadsheetId,
        sheetName = getSheetConfig('attendance').sheetName,
        range = getSheetConfig('attendance').range
    ) {
        try {
            console.log(`📊 데이터 조회 시작: ${sheetName}!${range}`);

            const encodedSheetName = encodeURIComponent(sheetName);
            const encodedRange = encodeURIComponent(range);

            const queryParams = new URLSearchParams({
                valueRenderOption: DEFAULT_REQUEST_OPTIONS.valueRenderOption,
                dateTimeRenderOption: DEFAULT_REQUEST_OPTIONS.dateTimeRenderOption
            });

            const url = `${getSheetConfig('attendance').api.baseUrl}/${spreadsheetId}/values/${encodedSheetName}!${encodedRange}?${queryParams}`;

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
     * 특정 셀의 현재 값을 조회 (CAS용)
     * @param {string} spreadsheetId - 스프레드시트 ID
     * @param {string} sheetName - 시트명
     * @param {string} cellAddress - 셀 주소 (예: 'C3')
     * @returns {Promise<string>} 현재 셀 값
     */
    async getCurrentCellValue(
        spreadsheetId = getSheetConfig('attendance').spreadsheetId,
        sheetName = getSheetConfig('attendance').sheetName,
        cellAddress
    ) {
        try {
            console.log(`🔍 셀 값 조회: ${sheetName}!${cellAddress}`);

            const encodedSheetName = encodeURIComponent(sheetName);
            const encodedRange = encodeURIComponent(cellAddress);

            const queryParams = new URLSearchParams({
                valueRenderOption: DEFAULT_REQUEST_OPTIONS.valueRenderOption,
                dateTimeRenderOption: DEFAULT_REQUEST_OPTIONS.dateTimeRenderOption
            });

            const url = `${getSheetConfig('attendance').api.baseUrl}/${spreadsheetId}/values/${encodedSheetName}!${encodedRange}?${queryParams}`;
            const data = await this.makeApiRequest(url);

            const currentValue = data.values?.[0]?.[0] || '';
            console.log(`✅ 현재 셀 값: "${currentValue}"`);

            return currentValue;
        } catch (error) {
            console.error('❌ 셀 값 조회 실패:', error.message);
            throw new Error(`셀 값 조회 실패: ${error.message}`);
        }
    }

    /**
     * 단일 셀 값 업데이트
     * @param {string} spreadsheetId - 스프레드시트 ID
     * @param {string} sheetName - 시트명
     * @param {string} cellAddress - 셀 주소 (예: 'C3')
     * @param {string} value - 새로운 값
     * @returns {Promise<Object>} 업데이트 결과
     */
    async updateCell(
        spreadsheetId = getSheetConfig('attendance').spreadsheetId,
        sheetName = getSheetConfig('attendance').sheetName,
        cellAddress,
        value
    ) {
        try {
            console.log(`📝 셀 업데이트 시작: ${sheetName}!${cellAddress} = "${value}"`);

            const encodedSheetName = encodeURIComponent(sheetName);
            const encodedRange = encodeURIComponent(cellAddress);

            const url = `${getSheetConfig('attendance').api.baseUrl}/${spreadsheetId}/values/${encodedSheetName}!${encodedRange}`;

            const requestBody = {
                range: `${sheetName}!${cellAddress}`,
                majorDimension: "ROWS",
                values: [[value]]
            };

            const queryParams = new URLSearchParams({
                valueInputOption: 'USER_ENTERED', // 사용자가 입력한 것처럼 처리 (수식 등 지원)
                includeValuesInResponse: true,
                responseValueRenderOption: DEFAULT_REQUEST_OPTIONS.valueRenderOption,
                responseDateTimeRenderOption: DEFAULT_REQUEST_OPTIONS.dateTimeRenderOption
            });

            const data = await this.makeApiRequest(`${url}?${queryParams}`, {
                method: 'PUT',
                body: JSON.stringify(requestBody)
            });

            console.log(`✅ 셀 업데이트 완료: ${sheetName}!${cellAddress}`);
            return {
                success: true,
                updatedRange: data.updatedRange,
                updatedRows: data.updatedRows,
                updatedColumns: data.updatedColumns,
                updatedCells: data.updatedCells,
                updatedData: data.updatedData
            };
        } catch (error) {
            console.error('❌ 셀 업데이트 실패:', error.message);
            throw new Error(`셀 업데이트 실패: ${error.message}`);
        }
    }

    /**
     * CAS (Compare-And-Swap)를 사용한 안전한 셀 업데이트
     * @param {string} spreadsheetId - 스프레드시트 ID
     * @param {string} sheetName - 시트명
     * @param {string} cellAddress - 셀 주소
     * @param {string} newValue - 새로운 값
     * @param {string} expectedValue - 예상되는 현재 값
     * @returns {Promise<Object>} 업데이트 결과
     */
    async updateCellWithCAS(
        spreadsheetId = getSheetConfig('attendance').spreadsheetId,
        sheetName = getSheetConfig('attendance').sheetName,
        cellAddress,
        newValue,
        expectedValue
    ) {
        try {
            console.log(`🔒 CAS 업데이트 시작: ${sheetName}!${cellAddress}`);
            console.log(`   예상값: "${expectedValue}" → 새값: "${newValue}"`);

            // 1. 현재 값 조회
            const currentValue = await this.getCurrentCellValue(spreadsheetId, sheetName, cellAddress);

            // 2. 값 비교 - 빈 값 처리 고려
            const normalizedCurrent = (currentValue || '').toString().trim();
            const normalizedExpected = (expectedValue || '').toString().trim();

            if (!isEqualStatus(normalizedCurrent, normalizedExpected)) {
                console.log(`❌ CAS 실패: 현재값="${normalizedCurrent}", 예상값="${normalizedExpected}"`);
                throw new Error(`CONFLICT: 데이터가 이미 수정되었습니다. 현재 값: "${normalizedCurrent}"`);
            }

            // 3. 값이 동일하면 업데이트 수행
            const updateResult = await this.updateCell(spreadsheetId, sheetName, cellAddress, newValue);

            console.log(`✅ CAS 업데이트 완료: ${sheetName}!${cellAddress}`);
            return {
                ...updateResult,
                casSuccess: true,
                previousValue: currentValue,
                newValue: newValue
            };
        } catch (error) {
            console.error('❌ CAS 업데이트 실패:', error.message);

            // CAS 충돌인지 다른 에러인지 구분
            if (error.message.includes('CONFLICT:')) {
                throw error; // CAS 충돌 에러는 그대로 전달
            } else {
                throw new Error(`CAS 업데이트 실패: ${error.message}`);
            }
        }
    }

    /**
     * 여러 범위의 데이터를 한 번에 조회
     * @param {string} spreadsheetId - 스프레드시트 ID
     * @param {Array<string>} ranges - 범위 배열 (예: ['Sheet1!A1:C10', 'Sheet2!A1:B5'])
     * @returns {Promise<Object>} 범위별 데이터 객체
     */
    async getBatchData(spreadsheetId = getSheetConfig('attendance').spreadsheetId, ranges) {
        try {
            console.log(`📊 배치 데이터 조회 시작: ${ranges.length}개 범위`);

            const encodedRanges = ranges.map(range => encodeURIComponent(range));
            const queryParams = new URLSearchParams({
                valueRenderOption: DEFAULT_REQUEST_OPTIONS.valueRenderOption,
                dateTimeRenderOption: DEFAULT_REQUEST_OPTIONS.dateTimeRenderOption
            });

            // 각 범위를 쿼리 파라미터로 추가
            encodedRanges.forEach(range => queryParams.append('ranges', range));

            const url = `${getSheetConfig('attendance').api.baseUrl}/${spreadsheetId}/values:batchGet?${queryParams}`;

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
    async getSpreadsheetMetadata(spreadsheetId = getSheetConfig('attendance').spreadsheetId) {
        try {
            console.log(`📋 스프레드시트 메타데이터 조회: ${spreadsheetId}`);

            const url = `${getSheetConfig('attendance').api.baseUrl}/${spreadsheetId}`;
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
        spreadsheetId = getSheetConfig('attendance').spreadsheetId,
        sheetName = getSheetConfig('attendance').sheetName,
        range = getSheetConfig('attendance').range
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

    // /**
    //  * 스프레드시트 데이터 목업 함수 (개발/테스트용)
    //  * @param {string} spreadsheetId - 스프레드시트 ID
    //  * @param {string} sheetName - 시트명
    //  * @param {string} range - 데이터 범위
    //  * @returns {Promise<Object>} 구조화된 목업 데이터 객체
    //  */
    // async fetchSheetData(
    //     spreadsheetId = 'mock-spreadsheet-id',
    //     sheetName = 'Mock Sheet',
    //     range = 'A1:P50'
    // ) {
    //     // 실제 API 호출 시뮬레이션을 위한 지연
    //     await new Promise(resolve => setTimeout(resolve, 800));
    //
    //     try {
    //         // 목업 헤더 데이터 생성
    //         const headers = [
    //             { lecture: '1강', date: new Date(2025, 8, 10) },   // 2025년 9월 10일
    //             { lecture: '2강', date: new Date(2025, 8, 17) },   // 2025년 9월 17일
    //             { lecture: '3강', date: new Date(2025, 8, 24) },   // 2025년 9월 24일
    //             { lecture: '4강', date: new Date(2025, 9, 1) },    // 2025년 10월 1일
    //             { lecture: '5강', date: new Date(2025, 9, 8) },    // 2025년 10월 8일
    //             { lecture: '6강', date: new Date(2025, 9, 15) },   // 2025년 10월 15일
    //             { lecture: '7강', date: new Date(2025, 9, 22) },   // 2025년 10월 22일
    //             { lecture: '8강', date: new Date(2025, 9, 29) },   // 2025년 10월 29일
    //             { lecture: '9강', date: new Date(2025, 10, 5) },   // 2025년 11월 5일
    //             { lecture: '10강', date: new Date(2025, 10, 12) }, // 2025년 11월 12일
    //             { lecture: '11강', date: new Date(2025, 10, 19) }, // 2025년 11월 19일
    //             { lecture: '12강', date: new Date(2025, 10, 26) }, // 2025년 11월 26일
    //             { lecture: '13강', date: new Date(2025, 11, 3) },  // 2025년 12월 3일
    //             { lecture: '14강', date: new Date(2025, 11, 10) }  // 2025년 12월 10일
    //         ];
    //
    //         // 목업 출석 데이터 생성 도우미 함수
    //         const generateAttendance = (pattern) => {
    //             const attendance = [];
    //             for (let i = 0; i < headers.length; i++) {
    //                 switch (pattern[i % pattern.length]) {
    //                     case 'O':
    //                         attendance.push({ status: 'O', desc: '' });
    //                         break;
    //                     case 'X':
    //                         attendance.push({ status: 'X', desc: '' });
    //                         break;
    //                     case 'L':
    //                         attendance.push({ status: 'Etc', desc: '지각' });
    //                         break;
    //                     case 'E':
    //                         attendance.push({ status: 'Etc', desc: '조퇴' });
    //                         break;
    //                     case 'S':
    //                         attendance.push({ status: 'Etc', desc: '병가' });
    //                         break;
    //                     case 'P':
    //                         attendance.push({ status: 'Etc', desc: '공가' });
    //                         break;
    //                     default:
    //                         attendance.push({ status: 'None', desc: '' });
    //                 }
    //             }
    //             return attendance;
    //         };
    //
    //         // 목업 데이터 행 생성
    //         const dataRows = [
    //             {
    //                 user: { name: '강민영', class: '저녁반' },
    //                 attendance: generateAttendance(['X', 'O', 'O', 'L', 'O', 'X', 'O', 'O', 'E', 'O', 'O', 'S', 'O', 'O'])
    //             },
    //             {
    //                 user: { name: '강신희', class: '저녁반' },
    //                 attendance: generateAttendance(['O', 'X', 'X', 'O', 'O', 'O', 'L', 'O', 'O', 'X', 'O', 'O', 'P', 'O'])
    //             },
    //             {
    //                 user: { name: '강은진', class: '저녁반' },
    //                 attendance: generateAttendance(['O', 'O', 'O', 'O', 'X', 'O', 'O', 'L', 'O', 'O', 'O', 'O', 'O', 'E'])
    //             },
    //             {
    //                 user: { name: '고태린', class: '저녁반' },
    //                 attendance: generateAttendance(['-', 'P', 'O', 'O', 'O', 'X', 'O', 'O', 'O', 'L', 'O', 'X', 'O', 'O'])
    //             },
    //             {
    //                 user: { name: '김도현', class: '오전반' },
    //                 attendance: generateAttendance(['O', 'O', 'L', 'O', 'O', 'O', 'X', 'O', 'O', 'O', 'S', 'O', 'O', 'O'])
    //             },
    //             {
    //                 user: { name: '김민수', class: '오전반' },
    //                 attendance: generateAttendance(['O', 'X', 'O', 'E', 'O', 'O', 'O', 'L', 'O', 'O', 'O', 'X', 'O', 'O'])
    //             },
    //             {
    //                 user: { name: '김지연', class: '오후반' },
    //                 attendance: generateAttendance(['L', 'O', 'O', 'O', 'O', 'X', 'O', 'O', 'P', 'O', 'O', 'O', 'E', 'O'])
    //             },
    //             {
    //                 user: { name: '박서준', class: '오후반' },
    //                 attendance: generateAttendance(['O', 'O', 'X', 'O', 'L', 'O', 'O', 'O', 'O', 'X', 'O', 'O', 'O', 'S'])
    //             },
    //             {
    //                 user: { name: '박지민', class: '저녁반' },
    //                 attendance: generateAttendance(['O', 'L', 'O', 'O', 'O', 'O', 'E', 'O', 'X', 'O', 'O', 'O', 'O', 'O'])
    //             },
    //             {
    //                 user: { name: '백승우', class: '오전반' },
    //                 attendance: generateAttendance(['X', 'O', 'O', 'O', 'O', 'L', 'O', 'X', 'O', 'O', 'P', 'O', 'O', 'O'])
    //             },
    //             {
    //                 user: { name: '송하은', class: '오후반' },
    //                 attendance: generateAttendance(['O', 'O', 'P', 'O', 'X', 'O', 'O', 'O', 'O', 'L', 'O', 'E', 'O', 'O'])
    //             },
    //             {
    //                 user: { name: '신예원', class: '저녁반' },
    //                 attendance: generateAttendance(['O', 'X', 'O', 'L', 'O', 'O', 'O', 'S', 'O', 'O', 'X', 'O', 'O', 'O'])
    //             },
    //             {
    //                 user: { name: '안재현', class: '오전반' },
    //                 attendance: generateAttendance(['L', 'O', 'O', 'O', 'E', 'O', 'X', 'O', 'O', 'O', 'O', 'L', 'O', 'X'])
    //             },
    //             {
    //                 user: { name: '윤서아', class: '오후반' },
    //                 attendance: generateAttendance(['O', 'O', 'X', 'O', 'O', 'P', 'O', 'O', 'L', 'O', 'O', 'O', 'S', 'O'])
    //             },
    //             {
    //                 user: { name: '이준혁', class: '저녁반' },
    //                 attendance: generateAttendance(['O', 'P', 'O', 'O', 'O', 'O', 'L', 'O', 'O', 'E', 'O', 'X', 'O', 'O'])
    //             },
    //             {
    //                 user: { name: '임채원', class: '오전반' },
    //                 attendance: generateAttendance(['E', 'O', 'L', 'O', 'O', 'X', 'O', 'O', 'O', 'O', 'S', 'O', 'O', 'P'])
    //             },
    //             {
    //                 user: { name: '장민호', class: '오후반' },
    //                 attendance: generateAttendance(['O', 'O', 'O', 'X', 'L', 'O', 'O', 'P', 'O', 'O', 'O', 'E', 'X', 'O'])
    //             },
    //             {
    //                 user: { name: '정수빈', class: '저녁반' },
    //                 attendance: generateAttendance(['O', 'L', 'X', 'O', 'O', 'O', 'S', 'O', 'O', 'O', 'P', 'O', 'O', 'E'])
    //             },
    //             {
    //                 user: { name: '조현우', class: '오전반' },
    //                 attendance: generateAttendance(['S', 'O', 'O', 'E', 'O', 'L', 'O', 'O', 'X', 'O', 'O', 'O', 'L', 'O'])
    //             },
    //             {
    //                 user: { name: '최예진', class: '오후반' },
    //                 attendance: generateAttendance(['O', 'O', 'E', 'O', 'P', 'O', 'X', 'O', 'O', 'L', 'O', 'O', 'O', 'S'])
    //             }
    //         ];
    //
    //         // 목업 원본 rows 데이터 (Google Sheets 형태 시뮬레이션)
    //         const rows = [
    //             // 헤더 1행: 강의명
    //             ['', '', '1강', '2강', '3강', '4강', '5강', '6강', '7강', '8강', '9강', '10강', '11강', '12강', '13강', '14강'],
    //             // 헤더 2행: 날짜
    //             ['', '', '9/10', '9/17', '9/24', '10/1', '10/8', '10/15', '10/22', '10/29', '11/5', '11/12', '11/19', '11/26', '12/3', '12/10'],
    //             // 데이터 행들
    //             ...dataRows.map(row => {
    //                 const rowData = [row.user.name, row.user.class];
    //                 row.attendance.forEach(att => {
    //                     if (att.status === 'O') rowData.push('O');
    //                     else if (att.status === 'X') rowData.push('X');
    //                     else if (att.status === 'Etc') rowData.push(att.desc);
    //                     else rowData.push('-');
    //                 });
    //                 return rowData;
    //             })
    //         ];
    //
    //         const result = {
    //             rows,
    //             headers,
    //             dataRows,
    //             totalRows: rows.length,
    //             dataRowCount: dataRows.length,
    //             hasData: true,
    //             range,
    //             sheetName,
    //             spreadsheetId,
    //             lastUpdated: new Date().toISOString()
    //         };
    //
    //         console.log(`📋 목업 데이터 생성 완료:`, {
    //             totalRows: result.totalRows,
    //             dataRows: result.dataRowCount,
    //             headers: result.headers.length,
    //             sheetName: result.sheetName
    //         });
    //
    //         return result;
    //
    //     } catch (error) {
    //         console.error('❌ 목업 데이터 생성 실패:', error);
    //         throw error;
    //     }
    // }


    /**
     * 특정 셀의 값 조회
     * @param {string} spreadsheetId - 스프레드시트 ID
     * @param {string} sheetName - 시트명
     * @param {string} cellAddress - 셀 주소 (예: 'A1')
     * @returns {Promise<string>} 셀 값
     */
    async getCellValue(
        spreadsheetId = getSheetConfig('attendance').spreadsheetId,
        sheetName = getSheetConfig('attendance').sheetName,
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