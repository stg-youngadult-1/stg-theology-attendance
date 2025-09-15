import React, { useState, useEffect, useRef, useCallback } from 'react';

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
    const [showPresets, setShowPresets] = useState(false);
    const inputRef = useRef(null);
    const modalRef = useRef(null);

    // 출석 상태 프리셋
    const attendancePresets = [
        { value: 'O', label: '출석', color: 'text-green-600', bgColor: 'bg-green-50 hover:bg-green-100' },
        { value: 'X', label: '결석', color: 'text-red-600', bgColor: 'bg-red-50 hover:bg-red-100' },
        { value: '', label: '미기록', color: 'text-gray-500', bgColor: 'bg-gray-50 hover:bg-gray-100' },
    ];

    // 모달이 열릴 때 현재 값으로 초기화
    useEffect(() => {
        if (isOpen) {
            setInputValue(currentValue || '');
            setShowPresets(false);
            // 다음 틱에서 포커스 설정 (모달 애니메이션 완료 후)
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
            document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
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
            // 성공 시 모달은 부모 컴포넌트에서 닫을 것임
        } catch (err) {
            // 에러는 부모 컴포넌트에서 처리
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
        setShowPresets(false);
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
            className="fixed inset-0 bg-black/50  flex items-center justify-center p-4 z-50"
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
                                placeholder="출석 상태를 입력하세요 (O, X, 또는 기타)"
                                disabled={loading}
                                className="
                                    w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                    disabled:bg-gray-100 disabled:cursor-not-allowed
                                    text-center text-lg
                                "
                            />
                            <button
                                type="button"
                                onClick={() => setShowPresets(!showPresets)}
                                disabled={loading}
                                className="
                                    absolute right-2 top-1/2 transform -translate-y-1/2
                                    text-gray-500 hover:text-gray-700 disabled:opacity-50
                                "
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>

                        {/* 프리셋 버튼들 */}
                        {showPresets && (
                            <div className="mt-2 space-y-2">
                                <div className="text-xs text-gray-500 mb-2">빠른 선택</div>
                                <div className="grid grid-cols-3 gap-2">
                                    {attendancePresets.map((preset) => (
                                        <button
                                            key={preset.value}
                                            type="button"
                                            onClick={() => handlePresetSelect(preset.value)}
                                            disabled={loading}
                                            className={`
                                                px-3 py-2 rounded-md text-sm font-medium border border-gray-300 transition-colors
                                                ${preset.bgColor} ${preset.color}
                                                disabled:opacity-50 disabled:cursor-not-allowed
                                            `}
                                        >
                                            <div className="font-bold">{preset.value || '-'}</div>
                                            <div className="text-xs">{preset.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
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

                    {/* 도움말 */}
                    <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-md">
                        <div className="font-medium mb-1">입력 가이드</div>
                        <ul className="space-y-1">
                            <li>• <strong>O</strong>: 출석 (녹색 표시)</li>
                            <li>• <strong>X</strong>: 결석 (빨간색 표시)</li>
                            <li>• <strong>빈 값</strong>: 미기록 (회색 - 표시)</li>
                            <li>• <strong>기타 텍스트</strong>: 특별 상태 (녹색 표시)</li>
                        </ul>
                    </div>
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