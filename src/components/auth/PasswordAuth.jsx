import React, {useState} from 'react';

/**
 * 비밀번호 인증 컴포넌트
 * @param {Object} props
 * @param {Function} props.onSuccess - 인증 성공 시 콜백 함수
 * @param {string} props.title - 인증 화면 제목
 * @param {string} props.className - 추가 CSS 클래스
 */
const PasswordAuth = ({
                          onSuccess,
                          title = "관리자 인증",
                          className = ''
                      }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // 환경변수에서 비밀번호 가져오기
    const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD || '1111';

    // 비밀번호 검증 핸들러
    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // 약간의 딜레이로 UX 개선
        setTimeout(() => {
            if (password === correctPassword) {
                // 인증 성공
                onSuccess?.();
            } else {
                // 인증 실패
                setError('비밀번호가 일치하지 않습니다');
                setPassword('');

                // 3초 후 에러 메시지 자동 제거
                setTimeout(() => {
                    setError('');
                }, 3000);
            }
            setIsLoading(false);
        }, 300);
    };

    // Enter 키 핸들러
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && password.trim()) {
            handleSubmit(e);
        }
    };

    return (
        <div className={`py-5 flex items-center justify-center bg-gray-50 px-4 ${className}`}>
            <div className="w-full max-w-md">
                {/* 인증 카드 */}
                <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-8">
                    {/* 헤더 */}
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {title}
                        </h2>
                        <p className="text-sm text-gray-600">
                            출결 관리 페이지에 접근하려면 비밀번호를 입력하세요
                        </p>
                    </div>

                    {/* 입력 폼 */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* 비밀번호 입력 필드 */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                비밀번호
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="비밀번호를 입력하세요"
                                    className={`
                                        w-full px-4 py-3 pr-12
                                        border rounded-lg
                                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                        transition-all duration-200
                                        ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                                    `}
                                    disabled={isLoading}
                                    autoFocus
                                />

                                {/* 비밀번호 표시/숨김 토글 버튼 */}
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <i className="fa-solid fa-eye"></i>
                                    ) : (
                                        <i className="fa-solid fa-eye-slash"></i>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* 에러 메시지 */}
                        {error && (
                            <div
                                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg animate-shake">
                                <span className="text-red-500">❌</span>
                                <p className="text-sm text-red-700 font-medium">
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* 확인 버튼 */}
                        <button
                            type="submit"
                            disabled={!password.trim() || isLoading}
                            className={`
                                w-full py-3 px-4 rounded-lg
                                font-medium text-white
                                transition-all duration-200
                                flex items-center justify-center gap-2
                                ${password.trim() && !isLoading
                                ? 'bg-blue-600 hover:bg-blue-700 active:scale-95 cursor-pointer'
                                : 'bg-gray-300 cursor-not-allowed'
                            }
                            `}
                        >
                            {isLoading ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    <span>확인 중...</span>
                                </>
                            ) : (
                                <>
                                    <span>🔓</span>
                                    <span>확인</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* 도움말 */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center">
                            💡 비밀번호를 분실하셨나요? 관리자에게 문의하세요
                        </p>
                    </div>
                </div>
            </div>

            {/* 애니메이션 스타일 */}
            <style jsx>{`
                @keyframes shake {
                    0%, 100% {
                        transform: translateX(0);
                    }
                    25% {
                        transform: translateX(-10px);
                    }
                    75% {
                        transform: translateX(10px);
                    }
                }

                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default PasswordAuth;