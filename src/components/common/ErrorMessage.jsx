// components/common/ErrorMessage.jsx

import React from 'react';

/**
 * 에러 메시지 컴포넌트
 * @param {Object} props
 * @param {string} props.error - 에러 메시지
 * @param {Function} props.onRetry - 재시도 함수
 * @param {string} props.title - 에러 제목 (선택사항)
 * @param {string} props.className - 추가 CSS 클래스
 * @param {boolean} props.showRetryButton - 재시도 버튼 표시 여부
 */
const ErrorMessage = ({
                          error,
                          onRetry,
                          title = "오류가 발생했습니다",
                          className = '',
                          showRetryButton = true
                      }) => {
    return (
        <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
            {/* 에러 헤더 */}
            <div className="flex items-center mb-3">
        <span className="text-red-500 text-xl mr-2" role="img" aria-label="오류">
          ❌
        </span>
                <h2 className="text-lg font-semibold text-red-800">
                    {title}
                </h2>
            </div>

            {/* 에러 메시지 */}
            <div className="mb-4">
                <p className="text-red-700 mb-2">
                    {error}
                </p>

                {/* 추가 도움말 */}
                <details className="mt-3">
                    <summary className="text-red-600 text-sm cursor-pointer hover:text-red-800 transition-colors">
                        문제 해결 방법 보기
                    </summary>
                    <div className="mt-2 p-3 bg-red-100 rounded text-sm text-red-800">
                        <ul className="list-disc list-inside space-y-1">
                            <li>인터넷 연결 상태를 확인해보세요</li>
                            <li>스프레드시트 권한이 올바르게 설정되어 있는지 확인하세요</li>
                            <li>잠시 후 다시 시도해보세요</li>
                            <li>문제가 계속되면 관리자에게 문의하세요</li>
                        </ul>
                    </div>
                </details>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex gap-3">
                {showRetryButton && onRetry && (
                    <button
                        onClick={onRetry}
                        className="
              bg-red-500 hover:bg-red-600
              text-white px-4 py-2 rounded
              transition-colors duration-200
              flex items-center gap-2
              font-medium
            "
                    >
                        <span className="text-sm">🔄</span>
                        다시 시도
                    </button>
                )}

                <button
                    onClick={() => window.location.reload()}
                    className="
            bg-gray-500 hover:bg-gray-600
            text-white px-4 py-2 rounded
            transition-colors duration-200
            flex items-center gap-2
            font-medium
          "
                >
                    <span className="text-sm">↻</span>
                    페이지 새로고침
                </button>
            </div>
        </div>
    );
};

export default ErrorMessage;