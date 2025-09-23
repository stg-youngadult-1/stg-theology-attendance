import React, { useMemo, useState } from 'react';

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
        case '-':
        default:
            return {
                className: 'bg-gray-100 text-gray-500 border-gray-200',
                icon: '-',
                label: '미기록'
            };
    }
};

/**
 * 현재 날짜와 강의 날짜가 동일한지 확인
 * @param {Date} lectureDate - 강의 날짜
 * @returns {boolean} 동일 여부
 */
const isSameDate = (lectureDate) => {
    if (!lectureDate || !(lectureDate instanceof Date)) return false;

    const today = new Date();
    return today.toDateString() === lectureDate.toDateString();
};

/**
 * 출석 체크가 가능한지 확인
 * @param {Object} header - 강의 헤더 정보
 * @param {Object} attendanceItem - 출석 정보
 * @returns {boolean} 출석 체크 가능 여부
 */
const canMarkAttendance = (header, attendanceItem) => {
    // 현재 날짜와 강의 날짜가 동일한지 확인
    if (!isSameDate(header.date)) {
        return false;
    }

    // 미기록 상태인지 확인
    const isUnrecorded = !attendanceItem ||
        attendanceItem.status === 'None' ||
        attendanceItem.status === '-' ||
        !attendanceItem.status ||
        attendanceItem.status.trim() === '';

    return isUnrecorded;
};

/**
 * 출석 확인 팝업 컴포넌트
 */
const AttendanceConfirmModal = ({ isOpen, studentName, onConfirm, onCancel, loading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                    출석 확인
                </h3>
                <p className="text-gray-600 mb-6 text-center">
                    <span className="font-medium text-blue-600">{studentName}</span> 출석하시겠습니까?
                </p>
                <div className="flex space-x-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200
                                 rounded-lg transition-colors disabled:opacity-50"
                    >
                        취소
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white
                                 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                처리 중...
                            </>
                        ) : (
                            '출석 체크'
                        )}
                    </button>
                </div>
            </div>
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
                case '-':
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

    // 전체 출석 현황 (오름차순 정렬)
    const allAttendance = useMemo(() => {
        if (!attendance || !headers) return [];

        return headers.map((header, index) => ({
            header,
            attendance: attendance[index] || { status: 'None', desc: '' },
            index,
            canMark: canMarkAttendance(header, attendance[index])
        })).sort((a, b) => {
            // 날짜 오름차순 정렬
            return new Date(a.header.date) - new Date(b.header.date);
        });
    }, [attendance, headers]);

    // 출석 확인 처리
    const handleAttendanceConfirm = async () => {
        if (!onAttendanceUpdate || confirmModal.lectureIndex < 0) return;

        try {
            await onAttendanceUpdate(studentRowIndex, confirmModal.lectureIndex, 'O');
            setConfirmModal({ isOpen: false, lectureIndex: -1 });
        } catch (error) {
            // 에러는 상위 컴포넌트에서 처리됨
            console.error('출석 처리 실패:', error);
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

                {/* 전체 출석 현황 (오름차순 정렬) */}
                {allAttendance.length > 0 && (
                    <div className="px-6 py-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">전체 출석 현황</h4>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {allAttendance.map((item, index) => {
                                const style = getAttendanceStyle(item.attendance.status);
                                const displayContent = item.attendance.status === 'Etc'
                                    ? item.attendance.desc
                                    : style.label;

                                return (
                                    <div key={index} className="flex items-center justify-between py-2">
                                        <div className="flex items-center space-x-3 flex-1">
                                            <div className="text-sm text-gray-600 min-w-0 flex-1">
                                                <div className="font-medium">{item.header.lecture}</div>
                                                <div className="text-xs text-gray-500">
                                                    {formatDate(item.header.date)}
                                                    {isSameDate(item.header.date) && (
                                                        <span className="ml-2 text-blue-500 font-medium">오늘</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            {/* 출석 상태 표시 */}
                                            <div className={`
                                                inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border
                                                ${style.className}
                                            `}>
                                                <span className="mr-1">{style.icon}</span>
                                                <span className="max-w-20 truncate" title={displayContent}>
                                                    {displayContent}
                                                </span>
                                            </div>

                                            {/* 출석 버튼 (조건부 표시) */}
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

            {/* 출석 확인 모달 */}
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