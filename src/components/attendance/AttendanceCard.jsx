import React, { useMemo } from 'react';

/**
 * 날짜를 "9/10" 형식으로 포맷팅
 * @param {Date} date - Date 객체
 * @returns {string} 포맷된 날짜 문자열
 */
const formatDate = (date) => {
    if (!date || !(date instanceof Date)) return '';
    return `${date.getMonth() + 1}/${date.getDate()}`;
};

/**
 * 출석 상태에 따른 스타일 반환
 * @param {string} status - 출석 상태 ('O', 'X', 'None', 'Etc')
 * @returns {Object} 스타일 객체
 */
const getAttendanceStyle = (status) => {
    switch (status) {
        case 'O':
            return {
                className: 'bg-green-100 text-green-700 border-green-200',
                icon: '✓',
                label: '출석'
            };
        case 'X':
            return {
                className: 'bg-red-100 text-red-700 border-red-200',
                icon: '✗',
                label: '결석'
            };
        case 'Etc':
            return {
                className: 'bg-orange-100 text-orange-700 border-orange-200',
                icon: '!',
                label: '기타'
            };
        case 'None':
        default:
            return {
                className: 'bg-gray-100 text-gray-500 border-gray-200',
                icon: '-',
                label: '미기록'
            };
    }
};

/**
 * 개별 학생의 출석 정보를 표시하는 카드 컴포넌트
 * @param {Object} props
 * @param {Object} props.student - 학생 정보 {name, class}
 * @param {Array} props.attendance - 출석 정보 배열
 * @param {Array} props.headers - 강의 헤더 정보
 * @param {boolean} props.loading - 로딩 상태
 * @param {string} props.className - 추가 CSS 클래스
 */
const AttendanceCard = ({
                            student,
                            attendance = [],
                            headers = [],
                            loading = false,
                            className = ''
                        }) => {
    // 출석 통계 계산
    const attendanceStats = useMemo(() => {
        if (!attendance || attendance.length === 0) {
            return {
                totalLectures: headers.length,
                attended: 0,
                absent: 0,
                etc: 0,
                none: headers.length,
                attendanceRate: 0
            };
        }

        const stats = {
            totalLectures: headers.length,
            attended: 0,
            absent: 0,
            etc: 0,
            none: 0
        };

        attendance.forEach(att => {
            switch (att.status) {
                case 'O':
                    stats.attended++;
                    break;
                case 'X':
                    stats.absent++;
                    break;
                case 'Etc':
                    stats.etc++;
                    break;
                case 'None':
                default:
                    stats.none++;
                    break;
            }
        });

        // 미기록을 제외한 출석률 계산
        const recordedLectures = stats.attended + stats.absent + stats.etc;
        stats.attendanceRate = recordedLectures > 0
            ? Math.round((stats.attended / recordedLectures) * 100)
            : 0;

        return stats;
    }, [attendance, headers.length]);

    // 최근 출석 현황 (최근 5회)
    const recentAttendance = useMemo(() => {
        if (!attendance || !headers) return [];

        const recent = [];
        const maxRecent = Math.min(5, headers.length);

        for (let i = headers.length - maxRecent; i < headers.length; i++) {
            if (i >= 0) {
                recent.push({
                    header: headers[i],
                    attendance: attendance[i] || { status: 'None', desc: '' }
                });
            }
        }

        return recent.reverse(); // 최신순으로 정렬
    }, [attendance, headers]);

    if (!student) {
        return null;
    }

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${loading ? 'opacity-75' : ''} ${className}`}>
            {/* 학생 정보 헤더 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-700 font-semibold text-lg">
                                {student.name ? student.name.charAt(0) : '?'}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {student.name || '이름 없음'}
                            </h3>
                            <p className="text-sm text-gray-600">
                                {student.class || '반 정보 없음'}
                            </p>
                        </div>
                    </div>

                    {/* 출석률 배지 */}
                    <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            attendanceStats.attendanceRate >= 80 ? 'bg-green-100 text-green-700' :
                                attendanceStats.attendanceRate >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                        }`}>
                            {attendanceStats.attendanceRate}% 출석
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {attendanceStats.attended}/{attendanceStats.totalLectures - attendanceStats.none}회
                        </div>
                    </div>
                </div>
            </div>

            {/* 출석 통계 */}
            <div className="px-6 py-4 border-b border-gray-100">
                <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                        <div className="text-xl font-bold text-green-600">{attendanceStats.attended}</div>
                        <div className="text-xs text-gray-600">출석</div>
                    </div>
                    <div>
                        <div className="text-xl font-bold text-red-600">{attendanceStats.absent}</div>
                        <div className="text-xs text-gray-600">결석</div>
                    </div>
                    <div>
                        <div className="text-xl font-bold text-orange-600">{attendanceStats.etc}</div>
                        <div className="text-xs text-gray-600">기타</div>
                    </div>
                    <div>
                        <div className="text-xl font-bold text-gray-500">{attendanceStats.none}</div>
                        <div className="text-xs text-gray-600">미기록</div>
                    </div>
                </div>
            </div>

            {/* 최근 출석 현황 */}
            {recentAttendance.length > 0 && (
                <div className="px-6 py-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">최근 출석 현황</h4>
                    <div className="space-y-2">
                        {recentAttendance.map((item, index) => {
                            const style = getAttendanceStyle(item.attendance.status);
                            const displayContent = item.attendance.status === 'Etc'
                                ? item.attendance.desc
                                : style.label;

                            return (
                                <div key={index} className="flex items-center justify-between py-2">
                                    <div className="flex items-center space-x-3">
                                        <div className="text-sm text-gray-600 min-w-0 flex-1">
                                            <div className="font-medium">{item.header.lecture}</div>
                                            <div className="text-xs text-gray-500">
                                                {formatDate(item.header.date)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`
                                        inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border
                                        ${style.className}
                                    `}>
                                        <span className="mr-1">{style.icon}</span>
                                        <span className="max-w-20 truncate" title={displayContent}>
                                            {displayContent}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 전체 출석 현황 보기 버튼 */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                <button
                    className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    onClick={() => {
                        // 향후 확장: 상세 모달이나 페이지로 이동
                        alert(`${student.name}의 전체 출석 현황을 보여주는 기능은 추후 구현 예정입니다.`);
                    }}
                >
                    전체 출석 현황 보기 →
                </button>
            </div>

            {/* 로딩 오버레이 */}
            {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
            )}
        </div>
    );
};

export default AttendanceCard;