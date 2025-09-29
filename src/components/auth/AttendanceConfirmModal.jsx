import React, { useState, useEffect } from 'react';

/**
 * 출석 확인 팝업 컴포넌트 - 인증번호 입력 추가
 * @param {Object} props
 * @param {boolean} props.isOpen - 모달 열림 상태
 * @param {string} props.studentName - 학생 이름
 * @param {Function} props.onConfirm - 확인 버튼 클릭 핸들러
 * @param {Function} props.onCancel - 취소 버튼 클릭 핸들러
 * @param {boolean} props.loading - 로딩 상태
 */
const AttendanceConfirmModal = ({ isOpen, studentName, onConfirm, onCancel, loading }) => {
    // 인증번호 관련 state
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [showCode, setShowCode] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    // 환경변수에서 올바른 인증번호 가져오기
    const correctCode = import.meta.env.VITE_ATTENDANCE_CODE || '1234';

    // 모달이 닫힐 때 초기화
    useEffect(() => {
        if (!isOpen) {
            setCode('');
            setError('');
            setShowCode(false);
            setIsVerifying(false);
        }
    }, [isOpen]);

    // 인증번호 검증 및 출석 처리
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 인증번호 검증
        if (code !== correctCode) {
            setError('인증번호가 일치하지 않습니다');
            setCode('');

            // 3초 후 에러 메시지 자동 제거
            setTimeout(() => {
                setError('');
            }, 3000);
            return;
        }

        // 검증 성공 - 출석 처리
        setIsVerifying(true);
        try {
            await onConfirm();
            // 성공 시 모달은 부모 컴포넌트에서 닫힘
        } catch (error) {
            setError('출석 처리 중 오류가 발생했습니다');
            setIsVerifying(false);
        }
    };

    // Enter 키 핸들러
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && code.trim() && !loading && !isVerifying) {
            handleSubmit(e);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
                {/* 헤더 */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                    출석 확인
                </h3>
                <p className="text-gray-600 mb-4 text-center text-sm">
                    <span className="font-medium text-blue-600">{studentName}</span> 출석
                </p>

                {/* 인증번호 입력 폼 */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* 인증번호 입력 필드 */}
                    <div>
                        <label
                            htmlFor="attendance-code"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            인증번호
                        </label>
                        <div className="relative">
                            <input
                                id="attendance-code"
                                type={showCode ? "text" : "password"}
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="인증번호 4자리"
                                maxLength={4}
                                className={`
                                    w-full px-4 py-2.5 pr-12
                                    border rounded-lg
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                    transition-all duration-200
                                    ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                                `}
                                disabled={loading || isVerifying}
                                autoFocus
                            />

                            {/* 인증번호 표시/숨김 토글 버튼 */}
                            <button
                                type="button"
                                onClick={() => setShowCode(!showCode)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                tabIndex={-1}
                            >
                                {showCode ? (
                                    <i className="fa-solid fa-eye"></i>
                                ) : (
                                    <i className="fa-solid fa-eye-slash"></i>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* 에러 메시지 */}
                    {error && (
                        <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg animate-shake">
                            <span className="text-red-500 text-sm">❌</span>
                            <p className="text-sm text-red-700 font-medium">
                                {error}
                            </p>
                        </div>
                    )}

                    {/* 버튼 그룹 */}
                    <div className="flex space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={loading || isVerifying}
                            className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200
                                     rounded-lg transition-colors disabled:opacity-50 font-medium"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={!code.trim() || loading || isVerifying}
                            className={`
                                flex-1 px-4 py-2.5 rounded-lg transition-colors font-medium
                                flex items-center justify-center
                                ${code.trim() && !loading && !isVerifying
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }
                            `}
                        >
                            {loading || isVerifying ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    처리 중...
                                </>
                            ) : (
                                '출석 체크'
                            )}
                        </button>
                    </div>
                </form>

                {/* 도움말 */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                        💡 인증번호를 모르시면 담당자에게 문의하세요
                    </p>
                </div>
            </div>

            {/* 애니메이션 스타일 */}
            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }
                
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default AttendanceConfirmModal;