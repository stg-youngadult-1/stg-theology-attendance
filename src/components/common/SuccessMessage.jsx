// components/common/SuccessMessage.jsx

import React from 'react';

/**
 * 성공 메시지 컴포넌트
 * @param {Object} props
 * @param {string} props.title - 성공 제목
 * @param {string} props.message - 성공 메시지
 * @param {Object} props.stats - 통계 정보 (선택사항)
 * @param {string} props.className - 추가 CSS 클래스
 * @param {React.ReactNode} props.children - 추가 콘텐츠
 */
const SuccessMessage = ({
                            title = "데이터 로드 완료",
                            message,
                            stats,
                            className = '',
                            children
                        }) => {
    return (
        <div className={`bg-green-50 border border-green-200 rounded-lg p-4 mb-6 ${className}`}>
            {/* 성공 헤더 */}
            <div className="flex items-center mb-2">
        <span className="text-green-500 text-lg mr-2" role="img" aria-label="성공">
          ✅
        </span>
                <h2 className="text-lg font-semibold text-green-800">
                    {title}
                </h2>
            </div>

            {/* 메시지 */}
            {message && (
                <p className="text-green-700 mb-3">
                    {message}
                </p>
            )}

            {/* 통계 정보 */}
            {stats && (
                <div className="flex flex-wrap gap-4 text-sm text-green-600">
                    {stats.totalRows && (
                        <div className="flex items-center gap-1">
                            <span className="font-medium">총 행 수:</span>
                            <span className="font-semibold">{stats.totalRows.toLocaleString()}</span>
                        </div>
                    )}

                    {stats.dataRowCount && (
                        <div className="flex items-center gap-1">
                            <span className="font-medium">데이터 행:</span>
                            <span className="font-semibold">{stats.dataRowCount.toLocaleString()}</span>
                        </div>
                    )}

                    {stats.headers && (
                        <div className="flex items-center gap-1">
                            <span className="font-medium">컬럼 수:</span>
                            <span className="font-semibold">{stats.headers}</span>
                        </div>
                    )}

                    {stats.lastUpdated && (
                        <div className="flex items-center gap-1">
                            <span className="font-medium">업데이트:</span>
                            <span className="font-semibold">
                {new Date(stats.lastUpdated).toLocaleString('ko-KR')}
              </span>
                        </div>
                    )}
                </div>
            )}

            {/* 추가 콘텐츠 */}
            {children && (
                <div className="mt-3">
                    {children}
                </div>
            )}
        </div>
    );
};

export default SuccessMessage;