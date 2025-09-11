// components/sheets/SheetsHeader.jsx

import React from 'react';

/**
 * 스프레드시트 헤더 컴포넌트
 * @param {Object} props
 * @param {Object} props.data - 스프레드시트 데이터
 * @param {Function} props.onRefresh - 새로고침 함수
 * @param {boolean} props.loading - 로딩 상태
 * @param {Object} props.config - 설정 정보
 */
const SheetsHeader = ({ data, onRefresh, loading, config }) => {
    const formatLastUpdated = (timestamp) => {
        if (!timestamp) return '알 수 없음';
        return new Date(timestamp).toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border mb-6">
            {/* 메인 헤더 */}
            <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                            <span role="img" aria-label="스프레드시트">📊</span>
                            Google Sheets 데이터 뷰어
                        </h1>
                        <p className="text-gray-600">
                            {config?.sheetName ? `${config.sheetName} 시트의 데이터를 표시합니다` : '스프레드시트 데이터를 불러와서 표시합니다'}
                        </p>
                    </div>

                    {/* 새로고침 버튼 */}
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            disabled={loading}
                            className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                ${loading
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md'
                            }
              `}
                        >
              <span className={`text-sm ${loading ? 'animate-spin' : ''}`}>
                🔄
              </span>
                            {loading ? '새로고침 중...' : '새로고침'}
                        </button>
                    )}
                </div>
            </div>

            {/* 데이터 정보 */}
            {data && (
                <div className="p-4 bg-gray-50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* 총 행 수 */}
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {data.totalRows?.toLocaleString() || 0}
                            </div>
                            <div className="text-sm text-gray-600 font-medium">
                                총 행 수
                            </div>
                        </div>

                        {/* 데이터 행 수 */}
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {data.dataRowCount?.toLocaleString() || 0}
                            </div>
                            <div className="text-sm text-gray-600 font-medium">
                                데이터 행
                            </div>
                        </div>

                        {/* 컬럼 수 */}
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                                {data.headers?.length || 0}
                            </div>
                            <div className="text-sm text-gray-600 font-medium">
                                컬럼 수
                            </div>
                        </div>

                        {/* 마지막 업데이트 */}
                        <div className="text-center">
                            <div className="text-sm font-bold text-gray-800">
                                {formatLastUpdated(data.lastUpdated)}
                            </div>
                            <div className="text-sm text-gray-600 font-medium">
                                마지막 업데이트
                            </div>
                        </div>
                    </div>

                    {/* 설정 정보 */}
                    {config && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                {config.sheetName && (
                                    <div className="flex items-center gap-1">
                                        <span className="font-medium">시트:</span>
                                        <code className="bg-gray-200 px-2 py-1 rounded text-xs">
                                            {config.sheetName}
                                        </code>
                                    </div>
                                )}

                                {config.range && (
                                    <div className="flex items-center gap-1">
                                        <span className="font-medium">범위:</span>
                                        <code className="bg-gray-200 px-2 py-1 rounded text-xs">
                                            {config.range}
                                        </code>
                                    </div>
                                )}

                                {config.refetchInterval > 0 && (
                                    <div className="flex items-center gap-1">
                                        <span className="font-medium">자동 새로고침:</span>
                                        <span className="text-green-600 font-semibold">
                      {Math.floor(config.refetchInterval / 1000)}초마다
                    </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SheetsHeader;