// // services/GoogleSheetsReader.js
//
// import googleSheetsAuth from './GoogleSheetsAuth.js';
// import googleSheetsData from './GoogleSheetsData.js';
//
// /**
//  * Google Sheets Reader - 통합 인터페이스
//  * 인증과 데이터 조회 기능을 하나의 인터페이스로 제공
//  */
// class Index {
//     constructor() {
//         this.auth = googleSheetsAuth;
//         this.data = googleSheetsData;
//     }
//
//     /**
//      * Google Sheets API 인증
//      * @param {Object} credentials - 서비스 계정 자격 증명 (선택사항)
//      * @returns {Promise<boolean>} 인증 성공 여부
//      */
//     async authenticate(credentials) {
//         return await this.auth.authenticate(credentials);
//     }
//
//     /**
//      * 스프레드시트 데이터 조회 (구조화된 형태)
//      * @param {string} spreadsheetId - 스프레드시트 ID
//      * @param {string} sheetName - 시트명
//      * @param {string} range - 데이터 범위
//      * @returns {Promise<Object>} 구조화된 데이터 객체
//      */
//     async fetchSheetData(spreadsheetId, sheetName, range) {
//         return await this.data.fetchSheetData(spreadsheetId, sheetName, range);
//     }
//
//     /**
//      * 스프레드시트 원시 데이터 조회
//      * @param {string} spreadsheetId - 스프레드시트 ID
//      * @param {string} sheetName - 시트명
//      * @param {string} range - 데이터 범위
//      * @returns {Promise<Array<Array<string>>>} 스프레드시트 데이터 배열
//      */
//     async getSheetData(spreadsheetId, sheetName, range) {
//         return await this.data.getSheetData(spreadsheetId, sheetName, range);
//     }
//
//     /**
//      * 여러 범위의 데이터를 한 번에 조회
//      * @param {string} spreadsheetId - 스프레드시트 ID
//      * @param {Array<string>} ranges - 범위 배열
//      * @returns {Promise<Object>} 범위별 데이터 객체
//      */
//     async getBatchData(spreadsheetId, ranges) {
//         return await this.data.getBatchData(spreadsheetId, ranges);
//     }
//
//     /**
//      * 스프레드시트 메타데이터 조회
//      * @param {string} spreadsheetId - 스프레드시트 ID
//      * @returns {Promise<Object>} 스프레드시트 메타데이터
//      */
//     async getSpreadsheetMetadata(spreadsheetId) {
//         return await this.data.getSpreadsheetMetadata(spreadsheetId);
//     }
//
//     /**
//      * 특정 셀의 값 조회
//      * @param {string} spreadsheetId - 스프레드시트 ID
//      * @param {string} sheetName - 시트명
//      * @param {string} cellAddress - 셀 주소
//      * @returns {Promise<string>} 셀 값
//      */
//     async getCellValue(spreadsheetId, sheetName, cellAddress) {
//         return await this.data.getCellValue(spreadsheetId, sheetName, cellAddress);
//     }
//
//     /**
//      * 데이터를 CSV 형태로 변환
//      * @param {Array<Array<string>>} data - 스프레드시트 데이터
//      * @param {string} delimiter - 구분자
//      * @returns {string} CSV 문자열
//      */
//     convertToCSV(data, delimiter) {
//         return this.data.convertToCSV(data, delimiter);
//     }
//
//     /**
//      * 데이터를 JSON 형태로 변환
//      * @param {Array<Array<string>>} data - 스프레드시트 데이터
//      * @returns {Array<Object>} JSON 배열
//      */
//     convertToJSON(data) {
//         return this.data.convertToJSON(data);
//     }
//
//     /**
//      * 연결 상태 테스트
//      * @returns {Promise<boolean>} 연결 성공 여부
//      */
//     async testConnection() {
//         return await this.data.testConnection();
//     }
//
//     /**
//      * 인증 상태 확인
//      * @returns {boolean} 인증된 상태인지 여부
//      */
//     isAuthenticated() {
//         return this.auth.isAuthenticated();
//     }
//
//     /**
//      * 인증 상태 정보 반환
//      * @returns {Object} 인증 상태 정보
//      */
//     getAuthStatus() {
//         return this.auth.getAuthStatus();
//     }
//
//     /**
//      * 인증 상태 초기화
//      */
//     clearAuthentication() {
//         this.auth.clearAuthentication();
//     }
//
//     // 기존 메서드 호환성을 위한 별칭들
//     async printSheetData(spreadsheetId, sheetName, range) {
//         const result = await this.fetchSheetData(spreadsheetId, sheetName, range);
//
//         // 기존 형태로 반환
//         return {
//             rows: result.rows,
//             totalRows: result.totalRows
//         };
//     }
// }
//
// // 싱글톤 인스턴스 생성 및 내보내기
// const googleSheetsReader = new Index();
//
// export default googleSheetsReader;
// export { Index };