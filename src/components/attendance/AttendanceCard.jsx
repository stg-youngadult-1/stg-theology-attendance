import React, { useMemo, useState } from 'react';
import {
    calculateAttendanceStats,
    getAttendanceStyle,
    ATTENDANCE_STATUS,
    ATTENDANCE_CONFIG,
    isAttendanceStatus
} from '../../utils/attendanceStatus.js';
import AttendanceConfirmModal from "../auth/AttendanceConfirmModal.jsx";

/**
 * 날짜를 "9/10" 형식으로 포맷팅
 */
const formatDate = (date) => {
    if (!date || !(date instanceof Date)) return '';
    return `${date.getMonth() + 1}/${date.getDate()}`;
};

/**
 * 현재 날짜가 강의 주(월~일) 내에 있는지 확인
 */
const isInSameWeek = (lectureDate) => {
    if (!lectureDate || !(lectureDate instanceof Date)) return false;

    const today = new Date();

    // 강의 날짜의 주 시작일(월요일) 계산
    const lectureStartOfWeek = new Date(lectureDate);
    const lectureDay = lectureStartOfWeek.getDay();
    const lectureMonday = lectureDay === 0 ? -6 : 1 - lectureDay; // 일요일이면 -6, 다른 요일이면 1-요일
    lectureStartOfWeek.setDate(lectureStartOfWeek.getDate() + lectureMonday);
    lectureStartOfWeek.setHours(0, 0, 0, 0);

    // 강의 날짜의 주 끝일(일요일) 계산
    const lectureEndOfWeek = new Date(lectureStartOfWeek);
    lectureEndOfWeek.setDate(lectureStartOfWeek.getDate() + 6);
    lectureEndOfWeek.setHours(23, 59, 59, 999);

    // 현재 날짜가 강의 주 내에 있는지 확인
    return today >= lectureStartOfWeek && today <= lectureEndOfWeek;
};

/**
 * 출석 체크가 가능한지 확인
 */
const canMarkAttendance = (header, attendanceItem) => {
    if (!isInSameWeek(header.date)) {
        return false;
    }

    const isUnrecorded = !attendanceItem ||
        attendanceItem.status === ATTENDANCE_STATUS.NONE ||
        !attendanceItem.status ||
        attendanceItem.status.trim() === '';

    return isUnrecorded;
};

/**
 * 현재 주의 출석 상태를 확인
 */
const getTodayAttendanceStatus = (headers, attendance) => {
    // 현재 주에 해당하는 강의 찾기
    const thisWeekLectureIndex = headers.findIndex(header => isInSameWeek(header.date));

    if (thisWeekLectureIndex === -1) {
        return {
            hasTodayLecture: false,
            isCompleted: false,
            lectureIndex: -1,
            header: null
        };
    }

    const thisWeekHeader = headers[thisWeekLectureIndex];
    const thisWeekAttendance = attendance[thisWeekLectureIndex];

    // 출석이 완료되었는지 확인
    const isCompleted = thisWeekAttendance &&
        thisWeekAttendance.status &&
        thisWeekAttendance.status !== ATTENDANCE_STATUS.NONE &&
        thisWeekAttendance.status.trim() !== '';

    return {
        hasTodayLecture: true,
        isCompleted,
        lectureIndex: thisWeekLectureIndex,
        header: thisWeekHeader,
        attendance: thisWeekAttendance
    };
};

/**
 * 출석 체크 헤더 컴포넌트
 */
const AttendanceCheckHeader = ({
                                   student,
                                   todayStatus,
                                   onAttendanceClick,
                                   cellUpdateLoading
                               }) => {
    const { hasTodayLecture, isCompleted, header, attendance } = todayStatus;

    // 상태에 따른 버튼/메시지 렌더링
    const renderContent = () => {
        if (!hasTodayLecture) {
            // 이번 주 강의가 없는 경우
            return (
                <div className="flex items-center justify-center py-3 px-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center text-gray-600">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium">이번 주는 출석 기간이 아닙니다</span>
                    </div>
                </div>
            );
        }

        if (isCompleted) {
            // 출석 완료된 경우
            const style = getAttendanceStyle(attendance.status);
            return (
                <div className="flex items-center justify-center py-3 px-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center text-green-700">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium">이번 주 출석 완료</span>
                        <div className={`ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs ${style.className}`}>
                            <span className="mr-1">{style.icon}</span>
                            <span>{style.label}</span>
                        </div>
                    </div>
                </div>
            );
        }

        // 출석 가능한 경우
        return (
            <div className="flex items-center justify-between py-3 px-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center text-blue-700">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <div>
                        <div className="text-sm font-medium">{header.lecture}</div>
                        <div className="text-xs text-blue-600">{formatDate(header.date)} (이번 주 출석)</div>
                    </div>
                </div>
                <button
                    onClick={() => onAttendanceClick(todayStatus.lectureIndex)}
                    disabled={cellUpdateLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400
                             text-white text-sm font-medium rounded-lg transition-colors
                             disabled:cursor-not-allowed flex items-center"
                >
                    {cellUpdateLoading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            처리 중...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            출석 체크
                        </>
                    )}
                </button>
            </div>
        );
    };

    return (
        <div className="mb-4">
            {renderContent()}
        </div>
    );
};

/**
 * 개별 학생의 출석 정보를 표시하는 카드 컴포넌트
 * @param {Object} props
 * @param {Object} props.student - 학생 정보 {name, class}
 * @param {Array} props.attendance - 출석 정보 배열
 * @param {Array} props.headers - 강의 헤더 정보
 * @param {boolean} props.loading - 로딩 상태
 * @param {Function} props.onAttendanceUpdate - 출석 업데이트 콜백
 * @param {number} props.studentRowIndex - 학생의 데이터 행 인덱스
 * @param {boolean} props.cellUpdateLoading - 셀 업데이트 로딩 상태
 * @param {string} props.className - 추가 CSS 클래스
 */
const AttendanceCard = ({
                            student,
                            attendance = [],
                            headers = [],
                            loading = false,
                            onAttendanceUpdate,
                            studentRowIndex,
                            cellUpdateLoading = false,
                            className = ''
                        }) => {
    // 확인 모달 상태
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        lectureIndex: -1
    });

    // 이번 주의 출석 상태 확인
    const todayStatus = useMemo(() => {
        return getTodayAttendanceStatus(headers, attendance);
    }, [headers, attendance]);

    // 출석 통계 계산 - 새로운 calculateAttendanceStats 함수 사용
    const attendanceStats = useMemo(() => {
        if (!attendance || attendance.length === 0) {
            return {
                totalLectures: headers.length,
                attended: 0,
                absent: 0,
                etc: 0,
                none: headers.length,
                rate: 0
            };
        }

        // 새로운 출석 통계 계산 함수 사용
        const stats = calculateAttendanceStats(attendance);

        // 상세 통계 계산
        let attendedCount = 0;
        let absentCount = 0;
        let etcCount = 0;
        let noneCount = 0;

        attendance.forEach(att => {
            if (!att || !att.status || att.status === ATTENDANCE_STATUS.NONE) {
                noneCount++;
            } else if (att.status === ATTENDANCE_STATUS.ABSENT) {
                absentCount++;
            } else if (isAttendanceStatus(att.status)) {
                attendedCount++;
            } else {
                etcCount++;
            }
        });

        return {
            totalLectures: headers.length,
            attended: attendedCount,
            absent: absentCount,
            etc: etcCount,
            none: noneCount,
            rate: stats.rate
        };
    }, [attendance, headers.length]);

    // 전체 출석 현황 (오름차순 정렬)
    const allAttendance = useMemo(() => {
        if (!attendance || !headers) return [];

        return headers.map((header, index) => ({
            header,
            attendance: attendance[index] || { status: ATTENDANCE_STATUS.NONE, desc: '' },
            index,
            canMark: canMarkAttendance(header, attendance[index])
        })).sort((a, b) => {
            // 날짜 오름차순 정렬
            return new Date(a.header.date) - new Date(b.header.date);
        });
    }, [attendance, headers]);

    // 인증번호 검증 성공 후 출석 처리
    const handleAttendanceConfirm = async () => {
        if (!onAttendanceUpdate || confirmModal.lectureIndex < 0) return;

        try {
            // 출석 상태(PRESENT)만 저장
            await onAttendanceUpdate(studentRowIndex, confirmModal.lectureIndex, ATTENDANCE_STATUS.PRESENT);
            setConfirmModal({ isOpen: false, lectureIndex: -1 });
        } catch (error) {
            // 에러는 상위 컴포넌트에서 처리됨
            console.error('출석 처리 실패:', error);
            throw error; // 모달에서 에러 처리하도록 전달
        }
    };

    // 출석 버튼 클릭 핸들러
    const handleAttendanceClick = (lectureIndex) => {
        setConfirmModal({
            isOpen: true,
            lectureIndex: lectureIndex
        });
    };

    // 모달 취소 핸들러
    const handleModalCancel = () => {
        setConfirmModal({ isOpen: false, lectureIndex: -1 });
    };

    if (!student) {
        return null;
    }

    return (
        <>
            <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${loading ? 'opacity-75' : ''} ${className}`}>
                {/* 출석 체크 헤더 */}
                <div className="p-4 border-b border-gray-100">
                    <AttendanceCheckHeader
                        student={student}
                        todayStatus={todayStatus}
                        onAttendanceClick={handleAttendanceClick}
                        cellUpdateLoading={cellUpdateLoading}
                    />
                </div>

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
                    </div>
                </div>

                {/* 전체 출석 현황 (오름차순 정렬) */}
                {allAttendance.length > 0 && (
                    <div className="px-6 py-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">전체 출석 현황</h4>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {allAttendance.map((item, index) => {
                                // 새로운 getAttendanceStyle 함수 사용
                                const style = getAttendanceStyle(item.attendance.status);
                                const config = ATTENDANCE_CONFIG[item.attendance.status];

                                // 표시할 내용 결정 - 새로운 시스템에 맞게
                                let displayContent;
                                if (item.attendance.status === ATTENDANCE_STATUS.OTHER && item.attendance.desc) {
                                    // 기타의 경우 desc 표시
                                    displayContent = item.attendance.desc;
                                } else if (config?.displayName) {
                                    // 설정된 표시명 사용
                                    displayContent = config.displayName;
                                } else {
                                    // 기본값
                                    displayContent = style.label || '미기록';
                                }

                                return (
                                    <div key={index} className="flex items-center justify-between py-2">
                                        <div className="flex items-center space-x-3 flex-1">
                                            <div className="text-sm text-gray-600 min-w-0 flex-1">
                                                <div className="font-medium">{item.header.lecture}</div>
                                                <div className="text-xs text-gray-500">
                                                    {formatDate(item.header.date)}
                                                    {isInSameWeek(item.header.date) && (
                                                        <span className="ml-2 text-blue-500 font-medium">이번 주</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            {/* 출석 상태 표시 - 새로운 스타일 시스템 적용 */}
                                            <div className={`
                                                inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border
                                                ${style.className}
                                            `}>
                                                <span className="mr-1">{style.icon}</span>
                                                <span className="max-w-20 truncate" title={displayContent}>
                                                    {displayContent}
                                                </span>
                                            </div>

                                            {/* 출석 버튼 (조건부 표시) - 출석만 체크 가능 */}
                                            {item.canMark && onAttendanceUpdate && (
                                                <button
                                                    onClick={() => handleAttendanceClick(item.index)}
                                                    disabled={cellUpdateLoading}
                                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400
                                                             text-white text-sm rounded-full transition-colors
                                                             disabled:cursor-not-allowed flex items-center"
                                                >
                                                    {cellUpdateLoading ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                                            처리중
                                                        </>
                                                    ) : (
                                                        '출석'
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 데이터가 없는 경우 */}
                {allAttendance.length === 0 && (
                    <div className="px-6 py-8 text-center text-gray-500">
                        <div className="text-lg mb-2">📅</div>
                        <div className="text-sm">출석 데이터가 없습니다</div>
                    </div>
                )}

                {/* 로딩 오버레이 */}
                {loading && (
                    <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                )}
            </div>

            {/* 인증번호 입력 기능이 추가된 출석 확인 모달 */}
            <AttendanceConfirmModal
                isOpen={confirmModal.isOpen}
                studentName={student.name}
                onConfirm={handleAttendanceConfirm}
                onCancel={handleModalCancel}
                loading={cellUpdateLoading}
            />
        </>
    );
};

export default AttendanceCard;