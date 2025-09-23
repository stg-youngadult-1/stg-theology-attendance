import React from 'react';

/**
 * 모바일 최적화된 출석체크용 검색바 컴포넌트
 * @param {Object} props
 * @param {string} props.searchTerm - 현재 검색어
 * @param {Function} props.onSearchChange - 검색어 변경 콜백
 * @param {Function} props.onRefresh - 새로고침 콜백
 * @param {boolean} props.loading - 로딩 상태
 * @param {number} props.resultCount - 검색 결과 수
 * @param {number} props.totalCount - 전체 학생 수
 * @param {string} props.className - 추가 CSS 클래스
 */
const AttendanceSearchBar = ({
                                 searchTerm,
                                 onSearchChange,
                                 onRefresh,
                                 loading = false,
                                 resultCount = 0,
                                 totalCount = 0,
                                 className = ''
                             }) => {
    // 검색어 초기화
    const handleClearSearch = () => {
        onSearchChange('');
    };

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 ${className}`}>
            {/* 검색 입력 영역 */}
            <div className="relative mb-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="이름 또는 반으로 검색..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="
                            w-full pl-12 pr-12 py-3 text-lg border border-gray-300 rounded-lg shadow-sm
                            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                            placeholder-gray-400 transition-all duration-200
                        "
                        disabled={loading}
                    />

                    {/* 검색 아이콘 */}
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {/* 검색어 지우기 버튼 */}
                    {searchTerm && (
                        <button
                            onClick={handleClearSearch}
                            className="
                                absolute right-3 top-1/2 transform -translate-y-1/2
                                p-1 text-gray-400 hover:text-gray-600 transition-colors
                            "
                            disabled={loading}
                            aria-label="검색어 지우기"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* 검색 결과 정보 및 액션 */}
            <div className="flex items-center justify-between">
                {/* 검색 결과 정보 */}
                <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                        {searchTerm ? (
                            <span>
                                <span className="font-medium text-blue-600">{resultCount}명</span>
                                <span className="text-gray-400 mx-1">/</span>
                                <span>{totalCount}명</span>
                            </span>
                        ) : (
                            <span>전체 <span className="font-medium">{totalCount}명</span></span>
                        )}
                    </div>

                    {/* 검색어 표시 */}
                    {searchTerm && (
                        <div className="flex items-center space-x-2">
                            <div className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
                                '{searchTerm}'
                            </div>
                        </div>
                    )}
                </div>

                {/* 액션 버튼들 */}
                <div className="flex items-center space-x-2">
                    {/* 새로고침 버튼 */}
                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        className="
                            p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50
                            rounded-lg transition-colors disabled:opacity-50
                        "
                        title="데이터 새로고침"
                        aria-label="데이터 새로고침"
                    >
                        <svg
                            className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                    </button>

                    {/* 검색 정보 아이콘 */}
                    {searchTerm && (
                        <div className="relative group">
                            <div className="p-2 text-blue-500 cursor-help">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>

                            {/* 툴팁 */}
                            <div className="
                                absolute right-0 top-full mt-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg
                                opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200
                                z-10
                            ">
                                <div className="space-y-1">
                                    <div>• 이름과 반 정보로 검색 가능</div>
                                    <div>• 실시간으로 필터링됩니다</div>
                                    <div>• 대소문자 구분 없음</div>
                                </div>

                                {/* 화살표 */}
                                <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 빠른 필터 버튼들 (선택사항) */}
            {!searchTerm && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-xs text-gray-500 mb-2">빠른 검색</div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => onSearchChange('오전반')}
                            className="px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                            disabled={loading}
                        >
                            오전반
                        </button>
                        <button
                            onClick={() => onSearchChange('저녁반')}
                            className="px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                            disabled={loading}
                        >
                            저녁반
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceSearchBar;