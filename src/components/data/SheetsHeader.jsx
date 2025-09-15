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
const SheetsHeader = ({data, onRefresh, loading, config}) => {
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
        <div className=" rounded-lg overflow-hidden mb-6">
            {/* 메인 헤더 */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center space-x-2">
                            25-2학기
                        </h1>
                        <p className="text-sm text-gray-600">
                            {config?.sheetName ? `${config.sheetName} 시트의 데이터를 표시합니다` : '스프레드시트 데이터를 불러와서 표시합니다'}
                        </p>
                    </div>

                    {/* 새로고침 버튼 */}
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            disabled={loading}
                            className={`
                                inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors
                                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            <span className={`mr-2 ${loading ? 'animate-spin' : ''}`}>
                                🔄
                            </span>
                            {loading ? '새로고침 중...' : '새로고침'}
                        </button>
                    )}
                </div>
            </div>

            {/* 데이터 정보 */}
            {data && (
                <div className="grid gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* 총 행 수 */}
                        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div
                                            className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span class="text-blue-600 text-lg">📊</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">총 행 수</p>
                                        <p className="text-lg font-semibold text-gray-900">{data.totalRows?.toLocaleString() || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 데이터 행 수 */}
                        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div
                                            className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                            <span class="text-green-600 text-lg">✅</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">데이터 행</p>
                                        <p className="text-lg font-semibold text-gray-900">{data.dataRowCount?.toLocaleString() || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 컬럼 수 */}
                        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div
                                            className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                            <span class="text-purple-600 text-lg">📝</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">컬럼 수</p>
                                        <p className="text-lg font-semibold text-gray-900">{data.headers?.length || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 마지막 업데이트 */}
                        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div
                                            className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                            <span class="text-yellow-600 text-lg">⏰</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">마지막 업데이트</p>
                                        <p className="text-sm font-semibold text-gray-900">{formatLastUpdated(data.lastUpdated)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/*</div>*/}
                    </div>


                    {/*<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">*/}
                    {/*    <div className="bg-white overflow-hidden shadow-sm rounded-lg">*/}
                    {/*        <div className="px-4 py-5 sm:p-6">*/}
                    {/*            <div className="flex items-center">*/}
                    {/*                <div className="flex-shrink-0">*/}
                    {/*                    <div*/}
                    {/*                        className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">*/}
                    {/*                        <i className="fas fa-check text-green-600"></i>*/}
                    {/*                    </div>*/}
                    {/*                </div>*/}
                    {/*                <div className="ml-4">*/}
                    {/*                    <p className="text-sm font-medium text-gray-500">출석</p>*/}
                    {/*                    <p className="text-lg font-semibold text-gray-900">28명</p>*/}
                    {/*                </div>*/}
                    {/*            </div>*/}
                    {/*        </div>*/}
                    {/*    </div>*/}
                    {/*    <div className="bg-white overflow-hidden shadow-sm rounded-lg">*/}
                    {/*        <div className="px-4 py-5 sm:p-6">*/}
                    {/*            <div className="flex items-center">*/}
                    {/*                <div className="flex-shrink-0">*/}
                    {/*                    <div*/}
                    {/*                        className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">*/}
                    {/*                        <i className="fas fa-clock text-yellow-600"></i>*/}
                    {/*                    </div>*/}
                    {/*                </div>*/}
                    {/*                <div className="ml-4">*/}
                    {/*                    <p className="text-sm font-medium text-gray-500">지각</p>*/}
                    {/*                    <p className="text-lg font-semibold text-gray-900">2명</p>*/}
                    {/*                </div>*/}
                    {/*            </div>*/}
                    {/*        </div>*/}
                    {/*    </div>*/}
                    {/*    <div className="bg-white overflow-hidden shadow-sm rounded-lg">*/}
                    {/*        <div className="px-4 py-5 sm:p-6">*/}
                    {/*            <div className="flex items-center">*/}
                    {/*                <div className="flex-shrink-0">*/}
                    {/*                    <div*/}
                    {/*                        className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">*/}
                    {/*                        <i className="fas fa-times text-red-600"></i>*/}
                    {/*                    </div>*/}
                    {/*                </div>*/}
                    {/*                <div className="ml-4">*/}
                    {/*                    <p className="text-sm font-medium text-gray-500">결석</p>*/}
                    {/*                    <p className="text-lg font-semibold text-gray-900">0명</p>*/}
                    {/*                </div>*/}
                    {/*            </div>*/}
                    {/*        </div>*/}
                    {/*    </div>*/}
                    {/*    <div className="bg-white overflow-hidden shadow-sm rounded-lg">*/}
                    {/*        <div className="px-4 py-5 sm:p-6">*/}
                    {/*            <div className="flex items-center">*/}
                    {/*                <div className="flex-shrink-0">*/}
                    {/*                    <div*/}
                    {/*                        className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">*/}
                    {/*                        <i className="fas fa-users text-blue-600"></i>*/}
                    {/*                    </div>*/}
                    {/*                </div>*/}
                    {/*                <div className="ml-4">*/}
                    {/*                    <p className="text-sm font-medium text-gray-500">총원</p>*/}
                    {/*                    <p className="text-lg font-semibold text-gray-900">30명</p>*/}
                    {/*                </div>*/}
                    {/*            </div>*/}
                    {/*        </div>*/}
                    {/*    </div>*/}
                    {/*</div>*/}
                </div>

            )}
        </div>
    );
};

export default SheetsHeader;