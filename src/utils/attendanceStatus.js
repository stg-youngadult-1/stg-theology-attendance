/**
 * 출석 상태 관리 모듈
 * 모든 출석 관련 상태, 스타일, 로직을 중앙에서 관리합니다.
 */

// 출석 상태 정의
export const ATTENDANCE_STATUS = {
    PRESENT: 'O',           // 출석
    ABSENT: 'X',            // 결석
    ESSAY: 'ㅁ',            // 소감문
    LATE: 'ㅣ',             // 지각
    EARLY_LEAVE: 'ㄷ',      // 조퇴
    OTHER: 'Etc',           // 기타 (출석으로 인정)
    NONE: 'None'            // 미입력
};

// 출석 상태별 메타데이터
export const ATTENDANCE_CONFIG = {
    [ATTENDANCE_STATUS.PRESENT]: {
        displayName: '출석',
        displayShortName: 'O',
        shortName: 'O',
        isAttendance: true,
        color: 'green',
        icon: '✓',
        description: '정상 출석'
    },
    [ATTENDANCE_STATUS.ABSENT]: {
        displayName: '결석',
        displayShortName: 'X',
        shortName: 'X',
        isAttendance: false,
        color: 'red',
        icon: '✗',
        description: '결석'
    },
    [ATTENDANCE_STATUS.ESSAY]: {
        displayName: '소감문',
        displayShortName: '소감문',
        shortName: 'ㅁ',
        isAttendance: true,
        color: 'blue',
        icon: '📝',
        description: '소감문 제출로 출석 인정'
    },
    // [ATTENDANCE_STATUS.LATE]: {
    //     displayName: '지각',
    //     shortName: 'ㅣ',
    //     isAttendance: true,
    //     color: 'orange',
    //     icon: '⏰',
    //     description: '지각 (출석으로 인정)'
    // },
    // [ATTENDANCE_STATUS.EARLY_LEAVE]: {
    //     displayName: '조퇴',
    //     shortName: 'ㄷ',
    //     isAttendance: true,
    //     color: 'purple',
    //     icon: '🚪',
    //     description: '조퇴 (출석으로 인정)'
    // },
    [ATTENDANCE_STATUS.OTHER]: {
        displayName: '기타',
        displayShortName: '기타',
        shortName: 'Etc',
        isAttendance: false,
        color: 'orange',
        icon: '📋',
        description: '기타 사유로 출석 인정'
    },
    [ATTENDANCE_STATUS.NONE]: {
        displayName: '미입력',
        displayShortName: '-',
        shortName: '-',
        isAttendance: false,
        color: 'gray',
        icon: '—',
        description: '출석 정보가 입력되지 않음'
    }
};

// Tailwind CSS 색상 클래스 매핑
export const COLOR_CLASSES = {
    green: {
        text: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        hover: 'hover:bg-green-100'
    },
    red: {
        text: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        hover: 'hover:bg-red-100'
    },
    blue: {
        text: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        hover: 'hover:bg-blue-100'
    },
    orange: {
        text: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        hover: 'hover:bg-orange-100'
    },
    purple: {
        text: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        hover: 'hover:bg-purple-100'
    },
    gray: {
        text: 'text-gray-400',
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        hover: 'hover:bg-gray-100'
    }
};

/**
 * 셀 값을 기준으로 출석 상태를 파싱합니다.
 * @param {string} cellValue - 스프레드시트 셀의 원본 값
 * @returns {Object} { status, desc } - 파싱된 출석 정보
 */
export function parseAttendanceCell(cellValue) {
    if (!cellValue || cellValue.toString().trim() === '' || cellValue.toString().trim() === '-') {
        return {
            status: ATTENDANCE_STATUS.NONE,
            desc: ''
        };
    }

    const value = cellValue.toString().trim();

    // 기본 출석 상태들
    if (value === ATTENDANCE_STATUS.PRESENT) {
        return { status: ATTENDANCE_STATUS.PRESENT, desc: '' };
    }

    if (value === ATTENDANCE_STATUS.ABSENT) {
        return { status: ATTENDANCE_STATUS.ABSENT, desc: '' };
    }

    // 지정된 특수 기호들
    if (value === ATTENDANCE_STATUS.ESSAY) {
        return {
            status: ATTENDANCE_STATUS.ESSAY,
            desc: ATTENDANCE_CONFIG[ATTENDANCE_STATUS.ESSAY].displayName
        };
    }

    if (value === ATTENDANCE_STATUS.LATE) {
        return {
            status: ATTENDANCE_STATUS.LATE,
            desc: ATTENDANCE_CONFIG[ATTENDANCE_STATUS.LATE].displayName
        };
    }

    if (value === ATTENDANCE_STATUS.EARLY_LEAVE) {
        return {
            status: ATTENDANCE_STATUS.EARLY_LEAVE,
            desc: ATTENDANCE_CONFIG[ATTENDANCE_STATUS.EARLY_LEAVE].displayName
        };
    }

    // 그외 모든 텍스트는 기타 출석으로 처리
    return {
        status: ATTENDANCE_STATUS.OTHER,
        desc: value
    };
}

/**
 * 출석 상태가 출석으로 인정되는지 확인합니다.
 * @param {string} status - 출석 상태
 * @returns {boolean} 출석 인정 여부
 */
export function isAttendanceStatus(status) {
    const config = ATTENDANCE_CONFIG[status];
    return config ? config.isAttendance : false;
}

/**
 * 출석 상태에 따른 UI 스타일을 반환합니다.
 * @param {string} status - 출석 상태
 * @returns {Object} { className, content, tooltip } - UI 스타일 정보
 */
export function getAttendanceStyle(status) {
    const config = ATTENDANCE_CONFIG[status];

    if (!config) {
        // 알 수 없는 상태는 기타로 처리
        return getAttendanceStyle(ATTENDANCE_STATUS.OTHER);
    }

    const colorClass = COLOR_CLASSES[config.color];

    return {
        className: `${colorClass.text} font-semibold`,
        bgClassName: colorClass.bg,
        hoverClassName: colorClass.hover,
        borderClassName: colorClass.border,
        content: config.shortName === 'Etc' ? null : config.shortName, // Etc인 경우 desc 표시
        tooltip: config.description,
        icon: config.icon,
        displayName: config.displayName
    };
}

/**
 * 출석 상태에 따른 툴팁 텍스트를 생성합니다.
 * @param {Object} attendance - { status, desc } 출석 정보
 * @returns {string} 툴팁 텍스트
 */
export function getAttendanceTooltip(attendance) {
    if (!attendance || !attendance.status) {
        return '클릭하여 편집';
    }

    const config = ATTENDANCE_CONFIG[attendance.status];

    if (attendance.status === ATTENDANCE_STATUS.OTHER && attendance.desc) {
        return `클릭하여 편집 (${attendance.desc})`;
    }

    if (config) {
        return `클릭하여 편집 (${config.displayName})`;
    }

    return `클릭하여 편집 (${attendance.status})`;
}

/**
 * 출석 데이터의 통계를 계산합니다.
 * @param {Array} attendanceData - 출석 데이터 배열
 * @returns {Object} 출석 통계 { total, present, absent, rate }
 */
export function calculateAttendanceStats(attendanceData) {
    if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
        return { total: 0, present: 0, absent: 0, rate: 0 };
    }

    const total = attendanceData.length;
    const present = attendanceData.filter(item =>
        item && item.status && isAttendanceStatus(item.status)
    ).length;
    const absent = total - present;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, rate };
}

/**
 * 모든 출석 상태 목록을 반환합니다. (UI용)
 * @returns {Array} 출석 상태 목록
 */
export function getAllAttendanceStatuses() {
    return Object.entries(ATTENDANCE_CONFIG).map(([status, config]) => ({
        status,
        ...config
    }));
}

/**
 * 출석 범례 정보를 반환합니다.
 * @returns {Array} 범례 데이터
 */
export function getAttendanceLegend() {
    return getAllAttendanceStatuses().filter(item =>
        item.status !== ATTENDANCE_STATUS.OTHER // 기타는 범례에서 제외
    );
}