import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getAllAttendanceStatuses, getAttendanceStyle, ATTENDANCE_STATUS, ATTENDANCE_CONFIG } from '../../utils/attendanceStatus.js';

/**
 * 셀 편집 모달 컴포넌트
 * @param {Object} props
 * @param {boolean} props.isOpen - 모달 열림/닫힘 상태
 * @param {Function} props.onClose - 모달 닫기 콜백
 * @param {Function} props.onSave - 저장 콜백 (newValue) => Promise<boolean>
 * @param {string} props.currentValue - 현재 셀 값
 * @param {Object} props.cellInfo - 셀 정보 (userName, userClass, lectureInfo, attendance)
 * @param {boolean} props.loading - 저장 중 로딩 상태
 * @param {string} props.error - 에러 메시지
 */
const CellEditModal = ({
                           isOpen,
                           onClose,
                           onSave,
                           currentValue = '',
                           cellInfo = {},
                           loading = false,
                           error = null
                       }) => {
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef(null);
    const modalRef = useRef(null);

    // 출석 상태 프리셋을 완전히 동적으로 생성
    const attendancePresets = useMemo(() => {
        const allStatuses = getAllAttendanceStatuses();

        return allStatuses.map(statusConfig => {
            const style = getAttendanceStyle(statusConfig.status);

            return {
                value: statusConfig.status === ATTENDANCE_STATUS.NONE ? '' : statusConfig.status,
                label: statusConfig.displayName,
                shortName: statusConfig.shortName,
                icon: statusConfig.icon,
                description: statusConfig.description,
                isAttendance: statusConfig.isAttendance,
                style: style
            };
        });
    }, []);

    // 프리셋 정렬 (자주 사용되는 것들 우선)
    const sortedPresets = useMemo(() => {
        // 기본 상태들을 우선순위로 배치
        const primaryStates = [ATTENDANCE_STATUS.PRESENT, ATTENDANCE_STATUS.ABSENT, ATTENDANCE_STATUS.NONE];

        const primaryItems = attendancePresets.filter(preset => {
            const actualStatus = preset.value === '' ? ATTENDANCE_STATUS.NONE : preset.value;
            return primaryStates.includes(actualStatus);
        });

        const secondaryItems = attendancePresets.filter(preset => {
            const actualStatus = preset.value === '' ? ATTENDANCE_STATUS.NONE : preset.value;
            return !primaryStates.includes(actualStatus);
        });

        return [...primaryItems, ...secondaryItems];
    }, [attendancePresets]);

    // 도움말 텍스트를 동적으로 생성
    const helpGuide = useMemo(() => {
        const guides = Object.entries(ATTENDANCE_CONFIG)
            .filter(([status, config]) => status !== ATTENDANCE_STATUS.OTHER) // 기타는 제외
            .map(([status, config]) => {
                const displayValue = config.shortName === '-' ? '빈 값' : config.shortName;
                const attendanceStatus = config.isAttendance ? '출석 인정' : '미출석';
                const colorClass = getAttendanceStyle(status).className.split(' ')[0]; // 첫 번째 색상 클래스만 추출

                return {
                    value: displayValue,
                    description: config.displayName,
                    status: attendanceStatus,
                    colorClass: colorClass
                };
            });

        return guides;
    }, []);

    // 그리드 컬럼 수 동적 계산
    const gridCols = useMemo(() => {
        const presetCount = sortedPresets.length;
        if (presetCount <= 3) return 'grid-cols-3';
        if (presetCount <= 4) return 'grid-cols-2 md:grid-cols-4';
        if (presetCount <= 6) return 'grid-cols-2 md:grid-cols-3';
        return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    }, [sortedPresets.length]);

    // 모달이 열릴 때 현재 값으로 초기화
    useEffect(() => {
        if (isOpen) {
            setInputValue(currentValue || '');
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 100);
        }
    }, [isOpen, currentValue]);

    // ESC 키로 모달 닫기
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen && !loading) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose, loading]);

    // 배경 클릭으로 모달 닫기
    const handleBackgroundClick = useCallback((e) => {
        if (e.target === modalRef.current && !loading) {
            onClose();
        }
    }, [onClose, loading]);

    // 저장 핸들러
    const handleSave = useCallback(async () => {
        if (loading) return;

        try {
            await onSave(inputValue);
        } catch (err) {
            console.error('저장 실패:', err);
        }
    }, [inputValue, onSave, loading]);

    // Enter 키로 저장
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !loading) {
            e.preventDefault();
            handleSave();
        }
    }, [handleSave, loading]);

    // 프리셋 선택
    const handlePresetSelect = useCallback((value) => {
        setInputValue(value);
        inputRef.current?.focus();
    }, []);

    // 입력값 변경
    const handleInputChange = useCallback((e) => {
        setInputValue(e.target.value);
    }, []);

    // 모달이 닫혀있으면 렌더링하지 않음
    if (!isOpen) {
        return null;
    }

    const { userName, userClass, lectureInfo } = cellInfo;

    return (
        <div
            ref={modalRef}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={handleBackgroundClick}
        >
            <div className="bg-white rounded-lg shadow-sm max-w-md w-full max-h-[90vh] overflow-auto">
                {/* 모달 헤더 */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">
                            출석 정보 수정
                        </h3>
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* 모달 바디 */}
                <div className="px-6 py-4">
                    {/* 셀 정보 */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                        <div className="text-sm text-gray-600 space-y-1">
                            <div><span className="font-medium">학생:</span> {userName}</div>
                            {userClass && <div><span className="font-medium">반:</span> {userClass}</div>}
                            {lectureInfo && (
                                <div>
                                    <span className="font-medium">수업:</span> {lectureInfo.lecture}
                                    {lectureInfo.date && (
                                        <span className="ml-2 text-xs text-gray-500">
                                            ({lectureInfo.date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })})
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 현재 값 표시 */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                            현재 값
                        </label>
                        <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-md">
                            {currentValue || '(미기록)'}
                        </div>
                    </div>

                    {/* 입력 필드 */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-500 mb-2">
                            새 값
                        </label>
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder="출석 상태를 입력하세요"
                                disabled={loading}
                                className="
                                    w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                    disabled:bg-gray-100 disabled:cursor-not-allowed
                                    text-center text-lg
                                "
                            />
                        </div>

                        {/* 빠른 선택 버튼들 (항상 표시) */}
                        <div className="mt-3 space-y-2">
                            <div className="text-xs text-gray-500 mb-2">빠른 선택</div>
                            <div className={`grid ${gridCols} gap-2`}>
                                {sortedPresets.map((preset) => (
                                    <button
                                        key={preset.value || 'empty'}
                                        type="button"
                                        onClick={() => handlePresetSelect(preset.value)}
                                        disabled={loading}
                                        className={`
                                            px-3 py-2 rounded-md text-sm font-medium border transition-colors
                                            ${preset.style.bgClassName} ${preset.style.borderClassName} ${preset.style.hoverClassName}
                                            disabled:opacity-50 disabled:cursor-not-allowed
                                            flex flex-col items-center space-y-1
                                        `}
                                    >
                                        <div className={`text-lg ${preset.style.className}`}>
                                            {preset.icon || preset.shortName || '-'}
                                        </div>
                                        <div className="text-xs text-gray-600 leading-tight text-center">
                                            {preset.label}
                                        </div>
                                        {preset.isAttendance && (
                                            <div className="text-xs bg-green-100 text-green-600 px-1 rounded">
                                                출석
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 에러 메시지 */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="text-sm text-red-800">
                                    <div className="font-medium mb-1">저장 실패</div>
                                    <div>{error}</div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* 모달 푸터 */}
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                        💡 Enter로 저장, Esc로 취소
                    </div>

                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="
                                inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50
                                disabled:opacity-50 disabled:cursor-not-allowed
                            "
                        >
                            취소
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={loading}
                            className="
                                inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700
                                disabled:opacity-50 disabled:cursor-not-allowed
                            "
                        >
                            {loading && (
                                <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {loading ? '저장 중...' : '저장'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CellEditModal;