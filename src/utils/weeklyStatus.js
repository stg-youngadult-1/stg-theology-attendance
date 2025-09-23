import { calculateAttendanceStats, ATTENDANCE_STATUS, ATTENDANCE_CONFIG } from './attendanceStatus.js';

/**
 * 가장 가까운 과거 날짜를 찾습니다.
 * @param {Array} headers - 헤더 정보 배열 (lecture, date 포함)
 * @returns {Object|null} { lectureIndex, header } - 가장 가까운 과거 강의 정보
 */
export function findMostRecentPastDate(headers) {
    if (!headers || headers.length === 0) {
        return null;
    }

    const now = new Date();
    let mostRecentPast = null;
    let mostRecentIndex = -1;

    headers.forEach((header, index) => {
        if (!header.date || !(header.date instanceof Date)) {
            return;
        }

        // 현재 시간보다 과거인 날짜만 고려
        if (header.date < now) {
            if (!mostRecentPast || header.date > mostRecentPast.date) {
                mostRecentPast = header;
                mostRecentIndex = index;
            }
        }
    });

    if (mostRecentPast && mostRecentIndex >= 0) {
        return {
            lectureIndex: mostRecentIndex,
            header: mostRecentPast
        };
    }

    return null;
}

/**
 * 특정 주차의 출석 통계를 계산합니다.
 * @param {Object} data - 스프레드시트 데이터
 * @param {number} lectureIndex - 강의 인덱스
 * @returns {Object|null} 해당 주차의 출석 통계
 */
export function calculateWeeklyStats(data, lectureIndex) {
    if (!data || !data.dataRows || lectureIndex < 0) {
        return null;
    }

    // 해당 주차의 출석 데이터만 추출
    const weeklyAttendanceData = [];
    let presentStudents = 0;
    let absentStudents = 0;
    let etcStudents = 0;
    let noneStudents = 0;
    let totalStudents = 0;

    data.dataRows.forEach(row => {
        if (!row.attendance || !Array.isArray(row.attendance)) {
            return;
        }

        totalStudents++;
        const attendanceItem = row.attendance[lectureIndex];

        if (attendanceItem) {
            weeklyAttendanceData.push(attendanceItem);

            const config = ATTENDANCE_CONFIG[attendanceItem.status];

            if (attendanceItem.status === ATTENDANCE_STATUS.NONE) {
                noneStudents++;
            } else if (attendanceItem.status === ATTENDANCE_STATUS.ABSENT) {
                absentStudents++;
            } else if (config && config.isAttendance) {
                presentStudents++;
            } else {
                etcStudents++;
            }
        } else {
            // 출석 데이터가 없는 경우 미입력으로 처리
            weeklyAttendanceData.push({ status: ATTENDANCE_STATUS.NONE, desc: '' });
            noneStudents++;
        }
    });

    if (weeklyAttendanceData.length === 0) {
        return null;
    }

    const attendanceRate = totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0;

    return {
        totalStudents,
        presentStudents,
        absentStudents,
        etcStudents,
        noneStudents,
        lectureInfo: data.headers[lectureIndex],
        weeklyAttendanceRate: attendanceRate,
        // 카테고리별 통계
        categoryStats: {
            present: presentStudents,
            absent: absentStudents,
            etc: etcStudents,
            none: noneStudents
        }
    };
}

/**
 * 가장 최근 과거 주차의 출석 통계를 반환합니다.
 * @param {Object} data - 스프레드시트 데이터
 * @returns {Object|null} 최근 주차 출석 통계
 */
export function getLastWeekStats(data) {
    if (!data || !data.headers) {
        return null;
    }

    const recentPast = findMostRecentPastDate(data.headers);
    if (!recentPast) {
        return null;
    }

    return calculateWeeklyStats(data, recentPast.lectureIndex);
}

/**
 * 날짜를 한국어 형식으로 포맷팅합니다.
 * @param {Date} date - Date 객체
 * @returns {string} 포맷된 날짜 문자열
 */
export function formatKoreanDate(date) {
    if (!date || !(date instanceof Date)) {
        return '알 수 없음';
    }

    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
}