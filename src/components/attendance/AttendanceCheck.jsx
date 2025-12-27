import React, {useState, useMemo, useRef, useEffect, useCallback} from 'react';
import {useGoogleSheets} from '../../hooks/useGoogleSheets';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import AttendanceCard from './AttendanceCard';
// 새로운 출석 상태 모듈 import
import {
    ATTENDANCE_STATUS,
    isAttendanceStatus
} from '../../utils/attendanceStatus.js';

/**
 * 모바일용 출석체크 메인 컨테이너 컴포넌트
 * @param {Object} props
 * @param {Object} props.options - useGoogleSheets 훅 옵션
 * @param {string} props.className - 추가 CSS 클래스
 */
const AttendanceCheck = ({options = {}, className = ''}) => {
    // 검색 관련 상태 관리
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    // DOM 참조
    const searchInputRef = useRef(null);
    const dropdownRef = useRef(null);

    // 성공/에러 메시지 상태 추가
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Google Sheets 훅 사용 - cellUpdateLoading 추가
    const {
        data,
        loading,
        error,
        lastFetch,
        totalRows,
        dataRowCount,
        hasData,
        refetch,
        isAuthenticated,
        config,
        updateCell,           // 추가
        cellUpdateLoading     // 추가
    } = useGoogleSheets(options);

    // 검색 제안 목록 생성
    const suggestions = useMemo(() => {
        if (!data?.dataRows || data.dataRows.length === 0 || !searchTerm.trim()) {
            return [];
        }

        const searchLower = searchTerm.toLowerCase();
        return data.dataRows
            .filter(row => {
                const name = row.user?.name || '';
                const className = row.user?.class || '';
                return name.toLowerCase().includes(searchLower) ||
                    className.toLowerCase().includes(searchLower);
            })
            .map((row, originalIndex) => ({
                ...row,
                originalIndex: data.dataRows.indexOf(row),
                displayText: `${row.user?.name || '이름 없음'}`
            }))
            .slice(0, 10); // 최대 10개까지만 표시
    }, [data?.dataRows, searchTerm]);

    // 검색 결과가 1건일 때 자동 선택
    useEffect(() => {
        if (suggestions.length === 1 && searchTerm.trim()) {
            setSelectedStudent(suggestions[0]);
            setShowDropdown(false);
        } else if (suggestions.length > 1) {
            setSelectedStudent(null);
            setShowDropdown(true);
        } else if (suggestions.length === 0 && searchTerm.trim()) {
            setSelectedStudent(null);
            setShowDropdown(false);
        } else {
            setSelectedStudent(null);
            setShowDropdown(false);
        }
    }, [suggestions, searchTerm]);

    // 선택된 학생의 출석 통계 계산 - 새로운 시스템 적용
    const attendanceStats = useMemo(() => {
        if (!selectedStudent || !data?.headers) return null;

        const attendance = selectedStudent.attendance || [];
        const totalLectures = data.headers.length;

        // 상세 통계 계산
        let totalAttended = 0;
        let totalAbsent = 0;
        let totalEtc = 0;
        let totalNone = 0;

        attendance.forEach(att => {
            if (!att || !att.status || att.status === ATTENDANCE_STATUS.NONE) {
                totalEtc++;
            } else if (att.status === ATTENDANCE_STATUS.ABSENT) {
                totalAbsent++;
            } else if (isAttendanceStatus(att.status)) {
                totalAttended++;
            } else {
                totalEtc++;
            }
        });

        // 출석률 계산 (실제 기록된 강의 중에서)
        const recordedLectures = totalAttended + totalAbsent + totalEtc;
        const attendanceRate = recordedLectures > 0 ?
            Math.round((totalAttended / recordedLectures) * 100 * 10) / 10 : 0;

        return {
            totalLectures,
            attendanceRate,
            totalAttended,
            totalAbsent,
            totalEtc,
            totalNone
        };
    }, [selectedStudent, data?.headers]);

    // 검색어 변경 핸들러
    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setHighlightedIndex(-1);

        if (!value.trim()) {
            setSelectedStudent(null);
            setShowDropdown(false);
        }
    };

    // 검색어 초기화
    const handleClearSearch = () => {
        setSearchTerm('');
        setSelectedStudent(null);
        setShowDropdown(false);
        setHighlightedIndex(-1);
    };

    // 학생 선택 핸들러
    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        setSearchTerm(student.displayText);
        setShowDropdown(false);
        setHighlightedIndex(-1);
        searchInputRef.current?.blur();
    };

    // 키보드 이벤트 핸들러
    const handleKeyDown = (e) => {
        if (!showDropdown || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : suggestions.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
                    handleSelectStudent(suggestions[highlightedIndex]);
                }
                break;
            case 'Escape':
                setShowDropdown(false);
                setHighlightedIndex(-1);
                searchInputRef.current?.blur();
                break;
        }
    };

    // 출석 업데이트 핸들러 - 출석(O)만 저장하도록 수정
    const handleAttendanceUpdate = useCallback(async (rowIndex, colIndex, newValue) => {
        try {
            setErrorMessage('');
            setSuccessMessage('');

            // 1. 즉시 UI 업데이트를 위한 데이터 수정
            if (selectedStudent && data?.dataRows) {
                const updatedData = { ...data };
                const updatedDataRows = [...updatedData.dataRows];
                const targetRow = { ...updatedDataRows[selectedStudent.originalIndex] };
                const updatedAttendance = [...(targetRow.attendance || [])];

                // 새로운 출석 상태로 업데이트 - 출석만 저장
                updatedAttendance[colIndex] = {
                    status: newValue === ATTENDANCE_STATUS.PRESENT ? ATTENDANCE_STATUS.PRESENT : ATTENDANCE_STATUS.NONE,
                    desc: ''
                };

                targetRow.attendance = updatedAttendance;
                updatedDataRows[selectedStudent.originalIndex] = targetRow;
                updatedData.dataRows = updatedDataRows;

                // 즉시 UI 반영을 위해 selectedStudent도 업데이트
                setSelectedStudent(prev => ({
                    ...prev,
                    attendance: updatedAttendance
                }));
            }

            // 2. 실제 Google Sheets 업데이트
            await updateCell(rowIndex, colIndex, newValue);

            // 3. 성공 메시지 표시
            const studentName = selectedStudent?.user?.name || '학생';
            setSuccessMessage(`${studentName}의 출석이 완료되었습니다.`);

            // 4. 백그라운드에서 최신 데이터 가져오기 (UI 블로킹 없이)
            setTimeout(() => {
                refetch(); // showLoading: false로 백그라운드 업데이트
            }, 500);

            // 3초 후 메시지 자동 삭제
            setTimeout(() => setSuccessMessage(''), 3000);

        } catch (error) {
            console.error('출석 처리 실패:', error);

            // 실패 시 원래 데이터로 복원
            if (selectedStudent && data?.dataRows) {
                const originalStudent = data.dataRows.find((row, index) =>
                    index === selectedStudent.originalIndex
                );
                if (originalStudent) {
                    setSelectedStudent(prev => ({
                        ...prev,
                        attendance: originalStudent.attendance
                    }));
                }
            }

            setErrorMessage(`출석 처리 실패: ${error.message}`);
            setTimeout(() => setErrorMessage(''), 5000);
        }
    }, [updateCell, selectedStudent, data]);

    // 메시지 닫기 핸들러들
    const handleCloseSuccessMessage = () => setSuccessMessage('');
    const handleCloseErrorMessage = () => setErrorMessage('');

    // 외부 클릭 감지
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                searchInputRef.current && !searchInputRef.current.contains(event.target)) {
                setShowDropdown(false);
                setHighlightedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 에러 상태 렌더링
    if (error) {
        return (
            <div className={`container mx-auto px-4 py-6 md:max-w-lg md:rounded-3xl md:shadow-lg mx-auto ${className}`}>
                <ErrorMessage
                    error={error}
                    onRetry={refetch}
                    title="데이터 로드 실패"
                />

                {/* 디버그 정보 (개발 환경에서만) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <details>
                            <summary className="font-medium text-yellow-800 cursor-pointer">
                                디버그 정보
                            </summary>
                            <div className="mt-2 text-sm text-yellow-700 space-y-2">
                                <div><strong>인증 상태:</strong> {isAuthenticated ? '인증됨' : '미인증'}</div>
                                <div><strong>설정:</strong> {JSON.stringify(config, null, 2)}</div>
                            </div>
                        </details>
                    </div>
                )}
            </div>
        );
    }

    // 로딩 상태 렌더링
    if (loading && !data) {
        return (
            <div className={`container mx-auto px-4 py-6 md:max-w-lg md:rounded-3xl md:shadow-lg mx-auto ${className}`}>
                <LoadingSpinner
                    message="출석 데이터를 불러오는 중입니다..."
                    size="lg"
                />
            </div>
        );
    }

    // 성공 상태 렌더링
    return (
        <div className={`container mx-auto px-4 py-6 md:max-w-lg md:rounded-3xl md:shadow-lg mx-auto ${className}`}>
            {/* 검색바 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 relative">
                <div className="relative mb-4">
                    <div className="relative">
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="이름 또는 반으로 검색..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="
                            w-full pl-12 pr-12 py-3 text-lg border border-gray-300 rounded-lg shadow-sm
                            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                            placeholder-gray-400 transition-all duration-200
                        "
                            disabled={loading}
                            autoComplete="off"
                        />

                        {/* 검색 아이콘 */}
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor"
                                 viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                        </div>

                        {/* 검색어 지우기 버튼 */}
                        {searchTerm && (
                            <button
                                onClick={handleClearSearch}
                                className="
                                absolute right-3 top-1/2 transform -translate-y-1/2
                                p-1 text-gray-400 hover:text-gray-600 transition-colors
                            "
                                disabled={loading}
                                aria-label="검색어 지우기"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* 드롭다운 */}
                    {showDropdown && suggestions.length > 0 && (
                        <div
                            ref={dropdownRef}
                            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
                        >
                            {suggestions.map((student, index) => (
                                <button
                                    key={`${student.user?.name}-${student.originalIndex}`}
                                    onClick={() => handleSelectStudent(student)}
                                    className={`
                                    w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors
                                    ${index === highlightedIndex ? 'bg-blue-50' : ''}
                                    ${index === suggestions.length - 1 ? '' : 'border-b border-gray-100'}
                                `}
                                >
                                    <div className="font-medium text-gray-900">
                                        {student.user?.name || '이름 없음'}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {student.user?.class || '반 없음'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 검색 상태 정보 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-600">
                            {searchTerm ? (
                                suggestions.length === 1 && selectedStudent ? (
                                    <span className="text-green-600 font-medium">1명 선택됨</span>
                                ) : (
                                    <span>
                                    <span className="font-medium text-blue-600">{suggestions.length}명</span>
                                    <span className="text-gray-400 mx-1"> 검색됨</span>
                                </span>
                                )
                            ) : (
                                <span>전체 <span className="font-medium">{dataRowCount}명</span></span>
                            )}
                        </div>

                        {/* 검색어 표시 */}
                        {searchTerm && (
                            <div className="flex items-center space-x-2">
                                <div
                                    className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
                                    '{searchTerm}'
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 새로고침 버튼 */}
                    <button
                        onClick={refetch}
                        disabled={loading}
                        className="
                        p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50
                        rounded-lg transition-colors disabled:opacity-50
                    "
                        title="데이터 새로고침"
                        aria-label="데이터 새로고침"
                    >
                        <svg
                            className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* 성공/에러 메시지 표시 영역 */}
            {(successMessage || errorMessage) && (
                <div className="mb-4 space-y-2">
                    {/* 성공 메시지 */}
                    {successMessage && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="text-green-500 mr-2">✓</div>
                                <span className="text-green-700 font-medium">{successMessage}</span>
                            </div>
                            <button
                                onClick={handleCloseSuccessMessage}
                                className="text-green-500 hover:text-green-700"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {/* 에러 메시지 */}
                    {errorMessage && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="text-red-500 mr-2">⚠</div>
                                <span className="text-red-700 font-medium">{errorMessage}</span>
                            </div>
                            <button
                                onClick={handleCloseErrorMessage}
                                className="text-red-500 hover:text-red-700"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* 메인 컨텐츠 */}
            {!hasData ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                    <div className="text-4xl mb-4">📭</div>
                    <div className="text-lg font-medium text-gray-900 mb-2">출석 데이터가 없습니다</div>
                    <div className="text-gray-600 mb-4">스프레드시트에서 데이터를 확인해주세요</div>
                    <button
                        onClick={refetch}
                        disabled={loading}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
                    >
                        다시 시도
                    </button>
                </div>
            ) : !selectedStudent ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                    <div className="text-4xl mb-4">🔍</div>
                    <div className="text-lg font-medium text-gray-900 mb-2">
                        {searchTerm ? (
                            suggestions.length === 0 ? '검색 결과가 없습니다' : '학생을 선택해주세요'
                        ) : '학생 이름을 검색해주세요'}
                    </div>
                    <div className="text-gray-600 mb-4">
                        {searchTerm ? (
                            suggestions.length === 0 ? '다른 검색어를 입력해보세요' : '위의 목록에서 학생을 선택하세요'
                        ) : '이름 또는 반으로 검색하여 출석 현황을 확인하세요'}
                    </div>
                    {searchTerm && suggestions.length === 0 && (
                        <button
                            onClick={handleClearSearch}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            검색 초기화
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {/* 선택된 학생의 출석 통계 */}
                    {attendanceStats && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <h3 className="text-lg font-medium text-gray-900 mb-3">
                                {selectedStudent.user?.name}님의 출석 현황
                            </h3>

                            {/* 100% 출석률 축하 메시지 */}
                            {attendanceStats.attendanceRate === 100 && attendanceStats.totalAttended > 0 && (
                                <div className="my-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-center justify-center space-x-2">
                                        <span className="text-lg">🎉</span>
                                        <span className="text-yellow-800 font-bold">수료를 축하합니다!</span>
                                        <span className="text-lg">🎉</span>
                                    </div>
                                    <div className="text-center text-sm text-yellow-700 mt-1">
                                        교리학교 1학기를 수료하였습니다!
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-4 md:grid-cols-4 gap-4">

                                <div className="text-center">
                                    <div
                                        className="text-2xl font-bold text-green-600">{attendanceStats.attendanceRate}%
                                    </div>
                                    <div className="text-sm text-gray-600">출석률</div>
                                </div>
                                <div className="text-center">
                                    <div
                                        className="text-2xl font-bold text-green-500">{attendanceStats.totalAttended}</div>
                                    <div className="text-sm text-gray-600">총 출석</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-red-500">{attendanceStats.totalAbsent}</div>
                                    <div className="text-sm text-gray-600">총 결석</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-500">{attendanceStats.totalEtc}</div>
                                    <div className="text-sm text-gray-600">총 기타</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 선택된 학생의 출석 카드 */}
                    <AttendanceCard
                        student={selectedStudent.user}
                        attendance={selectedStudent.attendance}
                        headers={data.headers}
                        loading={loading}
                        onAttendanceUpdate={handleAttendanceUpdate}
                        studentRowIndex={selectedStudent.originalIndex}
                        cellUpdateLoading={cellUpdateLoading}
                    />
                </div>
            )}

            {/* 푸터 정보 */}
            {hasData && (
                <div className="mt-8 text-center text-sm text-gray-500 space-y-1">
                    <div>총 {totalRows}행의 데이터
                        {selectedStudent && (
                            <span>
                            - {selectedStudent.user?.name} ({selectedStudent.user?.class}) 출석 정보
                        </span>
                        )}
                    </div>
                </div>
            )}

            {/* 실시간 상태 표시 */}
            <div className="flex items-center justify-center gap-4 mt-1">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="text-sm text-gray-600">
                    {isAuthenticated ? '연결됨' : '연결 안됨'}
                </span>
                </div>

                {loading && (
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-sm text-blue-600">업데이트 중...</span>
                    </div>
                )}

                {lastFetch && (
                    <div className="text-sm text-gray-500">
                        최근 업데이트: {new Date(lastFetch).toLocaleString('ko-KR')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceCheck;