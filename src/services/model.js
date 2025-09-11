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