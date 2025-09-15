
/**
 * 스프레드시트의 상위 2행(강의명, 날짜)을 파싱하여 헤더 정보를 추출합니다.
 *
 * @async
 * @function getHeader
 * @param {Array<Array<string>>} values - 스프레드시트의 전체 데이터 배열 (2차원 배열)
 * @returns {Promise<Array<{lecture: string, date: Date}>>} 강의명과 날짜 정보를 포함한 헤더 객체 배열
 *
 * @description
 * - 첫 번째 행(lectureRow)에서 강의명 정보를 추출
 * - 두 번째 행(dateRow)에서 날짜 정보를 추출
 * - C열(인덱스 2)부터 데이터 처리 시작
 * - 빈 값이나 undefined인 경우 해당 열은 건너뛰기
 * - 날짜 문자열은 parseDateString 함수를 통해 Date 객체로 변환
 *
 * @example
 * const values = [
 *   ['', '', '1강', '2강', '3강'],
 *   ['', '', '9/10', '9/17', '9/24'],
 *   // ... 데이터 행들
 * ];
 * const headers = await getHeader(values);
 * // 결과: [{lecture: '1강', date: Date객체}, {lecture: '2강', date: Date객체}, ...]
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
 *
 * @description
 * - 헤더 2줄(강의명, 날짜)을 제외한 3행부터 데이터로 처리
 * - A열과 B열에서 사용자 정보를 parseUserInfo 함수로 파싱
 * - C열부터 출석 정보를 parseAttendanceInfo 함수로 파싱
 * - 이름이 없는 행은 결과에서 제외
 *
 * @example
 * const values = [
 *   ['', '', '1강', '2강'],           // 헤더 1행
 *   ['', '', '9/10', '9/17'],         // 헤더 2행
 *   ['홍길동', '학번123', 'O', 'X'],  // 데이터 1행
 *   ['김철수', '학번456', 'X', 'O']   // 데이터 2행
 * ];
 * const rows = await getDataRows(values, 2);
 */
export async function getDataRows(values, headerLength) {
    if (!values || values.length <= 2) {
        return [];
    }

    // 헤더 2줄을 제외한 데이터 행들
    const dataRows = values.slice(2);

    const rows =  dataRows.map(row => {
        // 사용자 정보 파싱 (A열과 B열)
        const user = parseUserInfo(row[0], row[1]);

        // 출석 정보 파싱 (C열부터)
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
 *
 * @function getRowAddress
 * @param {number} rowIndex - 데이터 배열에서의 행 인덱스 (0부터 시작)
 * @returns {number} 스프레드시트에서의 실제 행 번호 (1부터 시작)
 *
 * @description
 * - 헤더 2행을 고려하여 데이터 행의 실제 스프레드시트 위치를 계산
 * - 배열 인덱스 0 → 스프레드시트 3행
 * - 배열 인덱스 1 → 스프레드시트 4행
 * - 이하 동일한 패턴으로 +3을 적용
 *
 * @example
 * const rowAddress = getRowAddress(0); // 결과: 3 (스프레드시트 3행)
 * const rowAddress = getRowAddress(5); // 결과: 8 (스프레드시트 8행)
 */
export function getRowAddress(rowIndex) {
    return rowIndex + 3;
}

/**
 * 배열의 열 인덱스를 스프레드시트의 실제 열 주소(알파벳)로 변환합니다.
 *
 * @function getColAddress
 * @param {number} colIndex - 출석 데이터에서의 열 인덱스 (0부터 시작)
 * @returns {string} 스프레드시트에서의 열 주소 (C, D, E, ...)
 *
 * @description
 * - 출석 데이터는 C열부터 시작하므로 ASCII 코드 67('C')를 기준으로 계산
 * - 열 인덱스 0 → 'C'
 * - 열 인덱스 1 → 'D'
 * - 이하 동일한 패턴으로 알파벳 순서대로 반환
 *
 * @example
 * const colAddress = getColAddress(0); // 결과: 'C'
 * const colAddress = getColAddress(3); // 결과: 'F'
 */
export function getColAddress(colIndex) {
    return String.fromCharCode(67 + colIndex); // C(67)부터 시작
}

/**
 * 출석 상태의 의미적 동등성을 비교하는 함수
 * 빈 값, '-', 'None' 등을 모두 동일한 "미기록" 상태로 처리
 * - 대소문자를 구분하지 않고 비교
 * - 양쪽 값 모두 공백 제거 후 비교
 *
 * @param {string} value1 - 첫 번째 값
 * @param {string} value2 - 두 번째 값
 * @returns {boolean} 두 값이 의미적으로 동등한지 여부
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

        const attendanceItem = parseAttendanceCell(cellValue);
        attendance.push(attendanceItem);
    }

    return attendance;
}

function parseAttendanceCell(cellValue) {
    if (!cellValue || cellValue.toString().trim() === '' || cellValue.toString().trim() === '-') {
        // 빈 값이거나 "-"인 경우
        return {
            status: 'None',
            desc: ''
        };
    }

    const value = cellValue.toString().trim();

    if (value === 'X') {
        // 결석
        return {
            status: 'X',
            desc: ''
        };
    } else if (value === 'O') {
        // 출석
        return {
            status: 'O',
            desc: ''
        };
    } else {
        // 그 외 문자열 (기타)
        return {
            status: 'Etc',
            desc: value
        };
    }
}