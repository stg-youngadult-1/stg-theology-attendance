import React, { useState, useMemo } from 'react';
import { useGoogleSheets } from '../../hooks/useGoogleSheets';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import AttendanceSearchBar from './AttendanceSearchBar';
import AttendanceCard from './AttendanceCard';

/**
 * 모바일용 출석체크 메인 컨테이너 컴포넌트
 * @param {Object} props
 * @param {Object} props.options - useGoogleSheets 훅 옵션
 * @param {string} props.className - 추가 CSS 클래스
 */
const AttendanceCheck = ({ options = {}, className = '' }) => {
    // 검색 상태 관리
    const [searchTerm, setSearchTerm] = useState('');

    // Google Sheets 훅 사용
    const {
        data,
        loading,
        error,
        lastFetch,
        totalRows,
        dataRowCount,
        hasData,
        refetch,
        isAuthenticated,
        config
    } = useGoogleSheets(options);

    // 검색된 데이터 필터링
    const filteredData = useMemo(() => {
        if (!data?.dataRows || data.dataRows.length === 0) return [];

        if (!searchTerm.trim()) {
            return data.dataRows;
        }

        const searchLower = searchTerm.toLowerCase();
        return data.dataRows.filter(row => {
            const name = row.user?.name || '';
            const className = row.user?.class || '';

            return name.toLowerCase().includes(searchLower) ||
                className.toLowerCase().includes(searchLower);
        });
    }, [data?.dataRows, searchTerm]);

    // 출석 통계 계산
    const attendanceStats = useMemo(() => {
        if (!filteredData.length || !data?.headers) return null;

        const totalLectures = data.headers.length;
        let totalAttended = 0;
        let totalAbsent = 0;
        let totalEtc = 0;

        filteredData.forEach(row => {
            if (row.attendance) {
                row.attendance.forEach(att => {
                    if (att.status === 'O') totalAttended++;
                    else if (att.status === 'X') totalAbsent++;
                    else if (att.status === 'Etc') totalEtc++;
                });
            }
        });

        const totalRecords = filteredData.length * totalLectures;
        const attendanceRate = totalRecords > 0 ? (totalAttended / totalRecords * 100) : 0;

        return {
            totalStudents: filteredData.length,
            totalLectures,
            totalAttended,
            totalAbsent,
            totalEtc,
            attendanceRate: Math.round(attendanceRate * 10) / 10
        };
    }, [filteredData, data?.headers]);

    // 에러 상태 렌더링
    if (error) {
        return (
            <div className={`container mx-auto px-4 py-6 md:max-w-lg md:rounded-3xl  md:shadow-lg mx-auto ${className}`}>
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">출석체크</h2>
                    <p className="text-gray-600">학생별 출석 현황을 확인하세요</p>
                </div>

                <ErrorMessage
                    error={error}
                    onRetry={refetch}
                    title="데이터 로드 실패"
                />

                {/* 디버그 정보 (개발 환경에서만) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <details>
                            <summary className="font-medium text-yellow-800 cursor-pointer">
                                디버그 정보
                            </summary>
                            <div className="mt-2 text-sm text-yellow-700 space-y-2">
                                <div><strong>인증 상태:</strong> {isAuthenticated ? '인증됨' : '미인증'}</div>
                                <div><strong>설정:</strong> {JSON.stringify(config, null, 2)}</div>
                            </div>
                        </details>
                    </div>
                )}
            </div>
        );
    }

    // 로딩 상태 렌더링
    if (loading && !data) {
        return (
            <div className={`container mx-auto px-4 py-6 md:max-w-lg md:rounded-3xl md:shadow-lg mx-auto ${className}`}>
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">출석체크</h2>
                    <p className="text-gray-600">학생별 출석 현황을 확인하세요</p>
                </div>

                <LoadingSpinner
                    message="출석 데이터를 불러오는 중입니다..."
                    size="lg"
                />
            </div>
        );
    }

    // 성공 상태 렌더링
    return (
        <div className={`container mx-auto px-4 py-6 md:max-w-lg md:rounded-3xl  md:shadow-lg mx-auto ${className}`}>
            {/* 헤더 */}
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">출석체크</h2>
                <p className="text-gray-600">학생별 출석 현황을 확인하세요</p>

                {/* 실시간 상태 표시 */}
                <div className="flex items-center justify-center gap-4 mt-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        <span className="text-sm text-gray-600">
                            {isAuthenticated ? '연결됨' : '연결 안됨'}
                        </span>
                    </div>

                    {loading && (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            <span className="text-sm text-blue-600">업데이트 중...</span>
                        </div>
                    )}

                    {lastFetch && (
                        <div className="text-sm text-gray-500">
                            최근 업데이트: {new Date(lastFetch).toLocaleString('ko-KR')}
                        </div>
                    )}
                </div>
            </div>

            {/* 검색바 */}
            <AttendanceSearchBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={refetch}
                loading={loading}
                resultCount={filteredData.length}
                totalCount={dataRowCount}
            />

            {/* 출석 통계 */}
            {attendanceStats && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">출석 현황</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{attendanceStats.totalStudents}</div>
                            <div className="text-sm text-gray-600">총 학생 수</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{attendanceStats.attendanceRate}%</div>
                            <div className="text-sm text-gray-600">출석률</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-500">{attendanceStats.totalAttended}</div>
                            <div className="text-sm text-gray-600">총 출석</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-500">{attendanceStats.totalAbsent}</div>
                            <div className="text-sm text-gray-600">총 결석</div>
                        </div>
                    </div>
                </div>
            )}

            {/* 데이터가 없는 경우 */}
            {!hasData ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                    <div className="text-4xl mb-4">📭</div>
                    <div className="text-lg font-medium text-gray-900 mb-2">출석 데이터가 없습니다</div>
                    <div className="text-gray-600 mb-4">스프레드시트에서 데이터를 확인해주세요</div>
                    <button
                        onClick={refetch}
                        disabled={loading}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
                    >
                        다시 시도
                    </button>
                </div>
            ) : filteredData.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                    <div className="text-4xl mb-4">🔍</div>
                    <div className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</div>
                    <div className="text-gray-600 mb-4">다른 검색어를 입력해보세요</div>
                    <button
                        onClick={() => setSearchTerm('')}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        검색 초기화
                    </button>
                </div>
            ) : (
                /* 출석 카드 리스트 */
                <div className="space-y-4">
                    {filteredData.map((row, index) => (
                        <AttendanceCard
                            key={`${row.user?.name}-${index}`}
                            student={row.user}
                            attendance={row.attendance}
                            headers={data.headers}
                            loading={loading}
                        />
                    ))}
                </div>
            )}

            {/* 푸터 정보 */}
            {hasData && (
                <div className="mt-8 text-center text-sm text-gray-500 space-y-1">
                    <div>총 {totalRows}행의 데이터 • 최근 업데이트: {lastFetch ? new Date(lastFetch).toLocaleString('ko-KR') : '-'}</div>
                    {searchTerm && (
                        <div>
                            '{searchTerm}' 검색 결과: {filteredData.length}명 / 전체 {dataRowCount}명
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AttendanceCheck;