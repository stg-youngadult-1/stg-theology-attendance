// components/common/LoadingSpinner.jsx

import React from 'react';

/**
 * 로딩 스피너 컴포넌트
 * @param {Object} props
 * @param {string} props.message - 로딩 메시지 (선택사항)
 * @param {string} props.size - 스피너 크기 ('sm', 'md', 'lg', 'xl')
 * @param {string} props.className - 추가 CSS 클래스
 */
const LoadingSpinner = ({
                            message = "데이터를 불러오는 중...",
                            size = 'md',
                            className = ''
                        }) => {
    // 크기별 클래스 매핑
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
        xl: 'w-20 h-20'
    };

    const textSizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl'
    };

    return (
        <div className={`bg-white rounded-lg shadow-sm border p-8 text-center ${className}`}>
            {/* 스피너 */}
            <div className="flex justify-center mb-4">
                <div
                    className={`
            ${sizeClasses[size]} 
            border-4 border-gray-200 border-t-blue-500 
            rounded-full animate-spin
          `}
                    role="status"
                    aria-label="로딩 중"
                />
            </div>

            {/* 메시지 */}
            {message && (
                <div>
                    <p className={`text-gray-600 font-medium ${textSizeClasses[size]} mb-2`}>
                        {message}
                    </p>
                    <p className="text-sm text-gray-500">
                        Google Sheets API에 연결하고 있습니다
                    </p>
                </div>
            )}
        </div>
    );
};

export default LoadingSpinner;