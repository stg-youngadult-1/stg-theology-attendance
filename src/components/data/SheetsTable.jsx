// components/sheets/SheetsTable.jsx

import React, { useState, useMemo } from 'react';

/**
 * 스프레드시트 테이블 컴포넌트
 * @param {Object} props
 * @param {Object} props.data - 스프레드시트 데이터
 * @param {boolean} props.loading - 로딩 상태
 * @param {string} props.className - 추가 CSS 클래스
 */
const SheetsTable = ({ data, loading, className = '' }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // 데이터 검색 및 정렬
    const processedData = useMemo(() => {
        if (!data?.dataRows || data.dataRows.length === 0) return [];

        let filtered = data.dataRows;

        // 검색 필터링
        if (searchTerm) {
            filtered = filtered.filter(row =>
                row.some(cell =>
                    String(cell || '').toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }

        // 정렬
        if (sortConfig.key !== null) {
            filtered = [...filtered].sort((a, b) => {
                const aVal = String(a[sortConfig.key] || '');
                const bVal = String(b[sortConfig.key] || '');

                // 숫자 비교 시도
                const aNum = parseFloat(aVal);
                const bNum = parseFloat(bVal);

                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
                }

                // 문자열 비교
                return sortConfig.direction === 'asc'
                    ? aVal.localeCompare(bVal, 'ko-KR')
                    : bVal.localeCompare(aVal, 'ko-KR');
            });
        }

        return filtered;
    }, [data?.dataRows, searchTerm, sortConfig]);

    // 정렬 핸들러
    const handleSort = (columnIndex) => {
        setSortConfig(prevConfig => ({
            key: columnIndex,
            direction: prevConfig.key === columnIndex && prevConfig.direction === 'asc'
                ? 'desc'
                : 'asc'
        }));
    };

    // 정렬 아이콘 렌더링
    const getSortIcon = (columnIndex) => {
        if (sortConfig.key !== columnIndex) {
            return <span className="text-gray-400">⇅</span>;
        }
        return sortConfig.direction === 'asc'
            ? <span className="text-blue-600">↑</span>
            : <span className="text-blue-600">↓</span>;
    };

    // 로딩 상태
    if (loading) {
        return (
            <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${className}`}>
                <div className="px-6 py-4 border-b bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <span className="animate-spin">⏳</span>
                        테이블 로딩 중...
                    </h3>
                </div>
                <div className="p-8 text-center text-gray-500">
                    <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    // 데이터가 없는 경우
    if (!data || !data.hasData || !data.headers || data.headers.length === 0) {
        return (
            <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${className}`}>
                <div className="px-6 py-4 border-b bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-800">📋 데이터 테이블</h3>
                </div>
                <div className="p-8 text-center text-gray-500">
                    <div className="text-4xl mb-4">📭</div>
                    <h4 className="text-lg font-medium mb-2">데이터가 없습니다</h4>
                    <p>스프레드시트에서 데이터를 불러올 수 없습니다.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${className}`}>
            {/* 테이블 헤더 */}
            <div className="px-6 py-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        📋 {data.sheetName || '데이터 테이블'}
                    </h3>

                    {/* 검색 입력 */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="데이터 검색..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="
                  pl-8 pr-4 py-2 border border-gray-300 rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  text-sm w-64
                "
                            />
                            <span className="absolute left-2.5 top-2.5 text-gray-400">🔍</span>
                        </div>

                        {/* 결과 카운트 */}
                        <div className="text-sm text-gray-600">
                            {searchTerm
                                ? `${processedData.length}개 검색 결과`
                                : `총 ${data.dataRowCount}행`
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* 테이블 컨테이너 */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    {/* 테이블 헤더 */}
                    <thead className="bg-gray-100 sticky top-0">
                    <tr>
                        {data.headers.map((header, index) => (
                            <th
                                key={index}
                                onClick={() => handleSort(index)}
                                className="
                    px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                    cursor-pointer hover:bg-gray-200 transition-colors select-none
                    border-r border-gray-200 last:border-r-0
                  "
                            >
                                <div className="flex items-center gap-2">
                    <span className="truncate" title={header}>
                      {header || `컬럼 ${index + 1}`}
                    </span>
                                    {getSortIcon(index)}
                                </div>
                            </th>
                        ))}
                    </tr>
                    </thead>

                    {/* 테이블 바디 */}
                    <tbody className="divide-y divide-gray-200">
                    {processedData.length === 0 ? (
                        <tr>
                            <td
                                colSpan={data.headers.length}
                                className="px-6 py-8 text-center text-gray-500"
                            >
                                {searchTerm ? (
                                    <div>
                                        <div className="text-2xl mb-2">🔍</div>
                                        <div className="font-medium mb-1">검색 결과가 없습니다</div>
                                        <div className="text-sm">다른 검색어를 입력해보세요</div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="text-2xl mb-2">📭</div>
                                        <div>표시할 데이터가 없습니다</div>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ) : (
                        processedData.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className="hover:bg-blue-50 transition-colors"
                            >
                                {data.headers.map((_, colIndex) => (
                                    <td
                                        key={colIndex}
                                        className="
                        px-6 py-4 whitespace-nowrap text-sm text-gray-900
                        border-r border-gray-100 last:border-r-0
                      "
                                    >
                                        <div className="max-w-xs truncate" title={row[colIndex] || ''}>
                                            {row[colIndex] || '-'}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* 테이블 푸터 */}
            {processedData.length > 0 && (
                <div className="px-6 py-3 bg-gray-50 border-t text-sm text-gray-600 flex justify-between items-center">
                    <div>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                                검색 필터 초기화
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {sortConfig.key !== null && (
                            <button
                                onClick={() => setSortConfig({ key: null, direction: 'asc' })}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                                정렬 초기화
                            </button>
                        )}

                        <div>
                            표시 중: <span className="font-medium">{processedData.length}</span>행
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SheetsTable;