import { parseAttendanceCell } from '../utils/attendanceStatus.js';

/**
 * 스프레드시트의 상위 2행(강의명, 날짜)을 파싱하여 헤더 정보를 추출합니다.
 *
 * @async
 * @function getHeader
 * @param {Array<Array<string>>} values - 스프레드시트의 전체 데이터 배열 (2차원 배열)
 * @returns {Promise<Array<{lecture: string, date: Date}>>} 강의명과 날짜 정보를 포함한 헤더 객체 배열
 */
export async function getHeader(values) {
    if (!values || values.length < 2) {
        return [];
    }

    const lectureRow = values[0]; // 1강, 2강, 3강... 행
    const dateRow = values[1];    // 9/10, 9/17, 9/24... 행

    const headers = [];

    // C열(인덱스 2)부터 시작
    for (let i = 2; i < lectureRow.length; i++) {
        const lecture = lectureRow[i];
        const dateString = dateRow[i];

        // 빈 값이거나 undefined인 경우 건너뛰기
        if (!lecture || !dateString) {
            continue;
        }

        // 날짜 문자열을 Date 객체로 변환
        const date = parseDateString(dateString);

        headers.push({
            lecture: lecture.toString().trim(),
            date: date
        });
    }

    console.log(headers);
    return headers;
}

/**
 * 스프레드시트의 데이터 행들(3행부터)을 파싱하여 사용자별 출석 정보를 추출합니다.
 *
 * @async
 * @function getDataRows
 * @param {Array<Array<string>>} values - 스프레드시트의 전체 데이터 배열 (2차원 배열)
 * @param {number} headerLength - 헤더의 길이 (강의 수)
 * @returns {Promise<Array<{user: Object, attendance: Array}>>} 사용자 정보와 출석 정보를 포함한 객체 배열
 */
export async function getDataRows(values, headerLength) {
    if (!values || values.length <= 2) {
        return [];
    }

    // 헤더 2줄을 제외한 데이터 행들
    const dataRows = values.slice(2);

    const rows = dataRows.map(row => {
        // 사용자 정보 파싱 (A열과 B열)
        const user = parseUserInfo(row[0], row[1]);

        // 출석 정보 파싱 (C열부터) - 새로운 attendanceStatus 모듈 사용
        const attendance = parseAttendanceInfo(row, headerLength);

        return {
            user,
            attendance
        };
    }).filter(item => item.user.name); // 이름이 없는 행은 제외

    console.log(rows);
    return rows;
}

/**
 * 배열의 인덱스를 스프레드시트의 실제 행 번호로 변환합니다.
 */
export function getRowAddress(rowIndex) {
    return rowIndex + 3;
}

/**
 * 배열의 열 인덱스를 스프레드시트의 실제 열 주소(알파벳)로 변환합니다.
 */
export function getColAddress(colIndex) {
    return String.fromCharCode(67 + colIndex); // C(67)부터 시작
}

/**
 * 출석 상태의 의미적 동등성을 비교하는 함수
 * 빈 값, '-', 'None' 등을 모두 동일한 "미기록" 상태로 처리
 */
export function isEqualStatus(value1, value2) {
    // null, undefined, 빈 문자열을 정규화
    const normalize = (value) => {
        if (!value) {
            return '';
        }

        const trimmed = value.toString().trim();

        // 미기록 상태로 간주되는 값들
        const emptyStates = ['', '-', 'none', 'null', 'undefined', '미기록', 'N/A', 'n/a'];

        if (emptyStates.includes(trimmed.toLowerCase())) {
            return '';
        }

        return trimmed;
    };

    const normalized1 = normalize(value1);
    const normalized2 = normalize(value2);

    // 대소문자 구분 없이 비교
    return normalized1.toLowerCase() === normalized2.toLowerCase();
}

// ===== 내부 유틸리티 함수들 =====

function parseDateString(dateString) {
    if (!dateString) return null;

    const dateStr = dateString.toString().trim();

    // "2025. 9. 10", "2025. 10. 15" 등의 형식을 처리
    const parts = dateStr.split('.').map(part => part.trim()).filter(part => part !== '');

    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);

        // 유효한 숫자인지 확인
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            // Date 객체 생성 (월은 0-based이므로 -1)
            return new Date(year, month - 1, day);
        }
    }

    return null;
}

function parseUserInfo(nameCell, classCell) {
    const name = nameCell ? nameCell.toString().trim() : '';
    const className = classCell ? classCell.toString().trim() : '';

    return {
        name,
        class: className
    };
}

function parseAttendanceInfo(row, headerLength) {
    const attendance = [];

    // C열(인덱스 2)부터 시작하여 headerLength만큼 처리
    for (let i = 0; i < headerLength; i++) {
        const cellIndex = i + 2; // C열부터 시작하므로 +2
        const cellValue = row[cellIndex];

        // 새로운 attendanceStatus 모듈의 parseAttendanceCell 함수 사용
        const attendanceItem = parseAttendanceCell(cellValue);
        attendance.push(attendanceItem);
    }

    return attendance;
}