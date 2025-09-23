import React from 'react';
import {formatKoreanDate, getLastWeekStats} from "../../utils/weeklyStatus.js";


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

    // 지난주 출석 통계 계산
    const weeklyStats = getLastWeekStats(data);

    return (
        <div className="rounded-lg overflow-hidden mb-6">
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
                </div>
            </div>

            {/* 데이터 정보 */}
            {data && (
                <div className="grid gap-6">


                    {/* 출석 통계 카드들 */}
                    {weeklyStats && (
                        <div>

                            <div className="bg-white shadow-sm rounded-lg p-4 mb-4">
                                <div className="flex items-center justify-between">
                                    <div>

                                        <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                                            <span>지난 강의 출석 현황</span>
                                            <span className="text-sm font-normal text-gray-500">
                                            ({weeklyStats.lectureInfo.lecture} - {formatKoreanDate(weeklyStats.lectureInfo.date)})
                                        </span>
                                        </h3>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className="text-lg font-semibold text-blue-800">
                                                    출석률: {weeklyStats.weeklyAttendanceRate}%
                                                </div>
                                                <div className="text-sm text-blue-600">
                                                    ({weeklyStats.presentStudents}/{weeklyStats.totalStudents}명 출석)
                                                </div>
                                            </div>
                                        </div>
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

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {/* 출석 */}
                                <div className="bg-white overflow-hidden shadow-sm rounded-lg">
                                    <div className="px-4 py-5 sm:p-6">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <div
                                                    className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                    <i className="fas fa-check text-green-600"></i>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-500">출석</p>
                                                <p className="text-lg font-semibold text-green-600">
                                                    {weeklyStats.categoryStats.present}명
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 결석 */}
                                <div className="bg-white overflow-hidden shadow-sm rounded-lg">
                                    <div className="px-4 py-5 sm:p-6">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <div
                                                    className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                                    <i className="fas fa-times text-red-600"></i>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-500">결석</p>
                                                <p className="text-lg font-semibold text-red-600">
                                                    {weeklyStats.categoryStats.absent}명
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 기타 */}
                                <div className="bg-white overflow-hidden shadow-sm rounded-lg">
                                    <div className="px-4 py-5 sm:p-6">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <div
                                                    className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <i className="fas fa-ellipsis-h text-blue-600"></i>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-500">기타</p>
                                                <p className="text-lg font-semibold text-gray-500">
                                                    {weeklyStats.categoryStats.etc}명
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 미입력 */}
                                <div className="bg-white overflow-hidden shadow-sm rounded-lg">
                                    <div className="px-4 py-5 sm:p-6">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <div
                                                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <i className="fas fa-question text-gray-500"></i>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-500">미입력</p>
                                                <p className="text-lg font-semibold text-gray-500">
                                                    {weeklyStats.categoryStats.none}명
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SheetsHeader;