import React, { useState, useMemo, useCallback } from 'react';
import { getAttendanceStyle, getAttendanceTooltip, ATTENDANCE_CONFIG } from '../../utils/attendanceStatus.js';
import SheetsTableSkeleton from "./SheetsTableSkeleton.jsx";
import SheetsTableWithNoData from "./SheetsTableWithNoData.jsx";

/**
 * 날짜를 "9/10" 형식으로 포맷팅
 * @param {Date} date - Date 객체
 * @returns {string} 포맷된 날짜 문자열
 */
const formatDate = (date) => {
    if (!date || !(date instanceof Date)) return '';
    return `${date.getMonth() + 1}/${date.getDate()}`;
};

/**
 * 스프레드시트 테이블 컴포넌트
 */
const SheetsTable = ({
                         data,
                         loading,
                         onCellClick,
                         cellUpdateLoading = false,
                         className = ''
                     }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [hoveredCell, setHoveredCell] = useState(null);

    // 데이터 검색 및 정렬
    const processedData = useMemo(() => {
        if (!data?.dataRows || data.dataRows.length === 0) return [];

        let filtered = data.dataRows;

        // 검색 필터링
        if (searchTerm) {
            filtered = filtered.filter(row => {
                const name = row.user?.name || '';
                const className = row.user?.class || '';
                const searchLower = searchTerm.toLowerCase();

                return name.toLowerCase().includes(searchLower) ||
                    className.toLowerCase().includes(searchLower);
            });
        }

        // 정렬
        if (sortConfig.key === 'name') {
            filtered = [...filtered].sort((a, b) => {
                const aName = a.user?.name || '';
                const bName = b.user?.name || '';

                return sortConfig.direction === 'asc'
                    ? aName.localeCompare(bName, 'ko-KR')
                    : bName.localeCompare(aName, 'ko-KR');
            });
        }

        return filtered;
    }, [data?.dataRows, searchTerm, sortConfig]);

    // 핸들러 함수들
    const handleSort = (key) => {
        if (key !== 'name') return;
        setSortConfig(prevConfig => ({
            key: key,
            direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortIcon = (key) => {
        if (key !== 'name') return null;
        if (sortConfig.key !== key) {
            return <span className="text-gray-500">⇅</span>;
        }
        return sortConfig.direction === 'asc'
            ? <span className="text-blue-600">↑</span>
            : <span className="text-blue-600">↓</span>;
    };

    const handleCellClick = useCallback((rowIndex, colIndex, attendance) => {
        if (!onCellClick) return;

        const currentValue = attendance?.status === 'Etc'
            ? attendance.desc
            : attendance?.status === 'None'
                ? ''
                : (attendance?.status || '');

        const originalRowIndex = data.dataRows.findIndex(row =>
            row.user?.name === processedData[rowIndex]?.user?.name
        );

        const cellInfo = {
            userName: processedData[rowIndex]?.user?.name,
            userClass: processedData[rowIndex]?.user?.class,
            lectureInfo: data.headers[colIndex],
            attendance: attendance
        };

        onCellClick(originalRowIndex, colIndex, currentValue, cellInfo);
    }, [onCellClick, data, processedData]);

    const handleCellMouseEnter = useCallback((rowIndex, colIndex) => {
        setHoveredCell({ rowIndex, colIndex });
    }, []);

    const handleCellMouseLeave = useCallback(() => {
        setHoveredCell(null);
    }, []);

    const isCellHovered = useCallback((rowIndex, colIndex) => {
        return hoveredCell?.rowIndex === rowIndex && hoveredCell?.colIndex === colIndex;
    }, [hoveredCell]);

    // 로딩 및 빈 데이터 처리
    if (loading) {
        return <SheetsTableSkeleton className={className} />;
    }

    if (!data || !data.hasData || !data.headers || data.headers.length === 0) {
        return <SheetsTableWithNoData className={className} />;
    }

    return (
        <div className={`bg-white shadow-sm rounded-lg overflow-hidden ${className}`}>
            {/* 테이블 헤더 */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                        <span>📋</span>
                        <span>26 겨울학기 영상반</span>
                        {cellUpdateLoading && (
                            <span className="text-sm text-blue-600 animate-pulse">저장 중...</span>
                        )}
                    </h3>

                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="이름 또는 반 검색..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-64"
                                disabled={cellUpdateLoading}
                            />
                            <span className="absolute left-2.5 top-2.5 text-gray-400">🔍</span>
                        </div>

                        <div className="text-sm text-gray-600">
                            {searchTerm
                                ? `${processedData.length}개 검색 결과`
                                : `총 ${data.dataRowCount}명`
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* 테이블 컨테이너 */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    {/* 테이블 헤더 */}
                    <thead className="bg-gray-50">
                    <tr>
                        <th
                            onClick={() => handleSort('name')}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none border-r border-gray-200"
                        >
                            <div className="flex items-center space-x-2">
                                <span>이름</span>
                                {getSortIcon('name')}
                            </div>
                        </th>

                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                            반
                        </th>

                        {data.headers.map((header, index) => (
                            <th
                                key={index}
                                className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0 min-w-[90px]"
                            >
                                <div className="flex flex-col items-center space-y-1">
                                    <span>{header.lecture}</span>
                                    <span className="text-xs text-gray-400 font-normal">
                                            {formatDate(header.date)}
                                        </span>
                                </div>
                            </th>
                        ))}
                    </tr>
                    </thead>

                    {/* 테이블 바디 */}
                    <tbody className="bg-white divide-y divide-gray-200">
                    {processedData.length === 0 ? (
                        <tr>
                            <td colSpan={data.headers.length + 2} className="px-6 py-8 text-center text-gray-500">
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
                            <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                                {/* 이름 셀 */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-100">
                                    {row.user?.name || '-'}
                                </td>

                                {/* 반 셀 */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-100">
                                    {row.user?.class || '-'}
                                </td>

                                {/* 출석 정보 셀들 - displayShortName으로 텍스트 표시 */}
                                {row.attendance?.map((attendance, colIndex) => {
                                        const style = getAttendanceStyle(attendance.status);
                                        const config = ATTENDANCE_CONFIG[attendance.status];

                                        // displayShortName을 우선 표시, 없으면 desc, 그것도 없으면 기본값
                                        const displayContent = (config?.shortName === 'Etc') ?
                                            (attendance.desc || '기타') :
                                            (config?.displayShortName || attendance.desc || '-');

                                        const isHovered = isCellHovered(rowIndex, colIndex);
                                        const isClickable = !cellUpdateLoading;

                                        return (
                                            <td
                                                key={colIndex}
                                                className="px-4 py-4 whitespace-nowrap text-sm text-center border-r border-gray-100 last:border-r-0 relative"
                                            >
                                                <div
                                                    className={`
                                                        ${style.className} 
                                                        max-w-[80px] truncate mx-auto
                                                        ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                                                        ${isHovered && isClickable ? `${style.bgClassName} rounded px-2 py-1` : ''}
                                                        ${cellUpdateLoading ? 'opacity-50' : ''}
                                                        transition-all duration-150
                                                    `}
                                                    title={
                                                        isClickable
                                                            ? getAttendanceTooltip(attendance)
                                                            : '저장 중...'
                                                    }
                                                    onClick={() => isClickable && handleCellClick(rowIndex, colIndex, attendance)}
                                                    onMouseEnter={() => isClickable && handleCellMouseEnter(rowIndex, colIndex)}
                                                    onMouseLeave={() => isClickable && handleCellMouseLeave()}
                                                >
                                                    {displayContent}
                                                </div>

                                                {/* 편집 가능 표시 */}
                                                {isHovered && isClickable && (
                                                    <div className="absolute top-1 right-1">
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full opacity-60"></div>
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    }) ||
                                    // attendance 배열이 없는 경우 빈 셀들로 채우기
                                    data.headers.map((_, colIndex) => (
                                        <td
                                            key={colIndex}
                                            className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-400 border-r border-gray-100 last:border-r-0"
                                        >
                                            <div
                                                className="cursor-pointer hover:bg-blue-50 rounded px-2 py-1 transition-all duration-150"
                                                title="클릭하여 편집"
                                                onClick={() => !cellUpdateLoading && handleCellClick(rowIndex, colIndex, { status: 'None', desc: '' })}
                                            >
                                                -
                                            </div>
                                        </td>
                                    ))
                                }
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* 테이블 푸터 */}
            {processedData.length > 0 && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 text-sm"
                                    disabled={cellUpdateLoading}
                                >
                                    검색 필터 초기화
                                </button>
                            )}
                        </div>

                        <div className="flex items-center space-x-4">
                            {sortConfig.key !== null && (
                                <button
                                    onClick={() => setSortConfig({ key: null, direction: 'asc' })}
                                    className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 text-sm"
                                    disabled={cellUpdateLoading}
                                >
                                    정렬 초기화
                                </button>
                            )}

                            <div className="text-sm text-gray-700">
                                표시 중: <span className="font-medium">{processedData.length}</span>명
                            </div>

                            {onCellClick && (
                                <div className="text-xs text-gray-500">
                                    💡 출석 셀을 클릭하여 편집
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SheetsTable;