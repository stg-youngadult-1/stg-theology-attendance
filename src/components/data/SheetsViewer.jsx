// components/sheets/SheetsViewer.jsx

import React from 'react';
import { useGoogleSheets } from '../../hooks/useGoogleSheets';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import SuccessMessage from '../common/SuccessMessage';
import SheetsHeader from './SheetsHeader';
import SheetsTable from './SheetsTable';

/**
 * 스프레드시트 뷰어 메인 컨테이너 컴포넌트
 * @param {Object} props
 * @param {Object} props.options - useGoogleSheets 훅 옵션
 * @param {string} props.className - 추가 CSS 클래스
 */
const SheetsViewer = ({ options = {}, className = '' }) => {
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
        clearError,
        isAuthenticated,
        authStatus,
        config
    } = useGoogleSheets(options);

    // 에러 상태 렌더링
    if (error) {
        return (
            <div className={`container mx-auto px-4 py-8 ${className}`}>
                <SheetsHeader config={config} />
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
                                {authStatus && (
                                    <div><strong>토큰 상태:</strong> {JSON.stringify(authStatus, null, 2)}</div>
                                )}
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
            <div className={`container mx-auto px-4 py-8 ${className}`}>
                <SheetsHeader config={config} />
                <LoadingSpinner
                    message="스프레드시트 데이터를 불러오는 중입니다..."
                    size="lg"
                />
            </div>
        );
    }

    // 성공 상태 렌더링
    return (
        <div className={`container mx-auto px-4 py-8 ${className}`}>
            {/* 헤더 */}
            <SheetsHeader
                data={data}
                onRefresh={refetch}
                loading={loading}
                config={config}
            />

            {/* 성공 메시지 */}
            {hasData && (
                <SuccessMessage
                    title="데이터 로드 완료"
                    message={`총 ${totalRows}행의 데이터를 성공적으로 불러왔습니다.`}
                    stats={{
                        totalRows,
                        dataRowCount,
                        headers: data?.headers?.length,
                        lastUpdated: lastFetch
                    }}
                >
                    {/* 실시간 상태 표시 */}
                    <div className="flex items-center gap-4 mt-2 text-sm">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-green-400' : 'bg-red-400'}`}></div>
                            <span className="text-green-700">
                {isAuthenticated ? '인증됨' : '미인증'}
              </span>
                        </div>

                        {loading && (
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                <span className="text-blue-700">업데이트 중...</span>
                            </div>
                        )}
                    </div>
                </SuccessMessage>
            )}

            {/* 데이터 테이블 */}
            <SheetsTable
                data={data}
                loading={loading}
            />

            {/* 추가 정보 패널 */}
            {/*{hasData && (*/}
            {/*    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">*/}
            {/*        /!* 빠른 통계 *!/*/}
            {/*        <div className="bg-white rounded-lg shadow-sm border p-6">*/}
            {/*            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">*/}
            {/*                📈 빠른 통계*/}
            {/*            </h3>*/}
            {/*            <div className="space-y-3">*/}
            {/*                <div className="flex justify-between">*/}
            {/*                    <span className="text-gray-600">데이터 밀도:</span>*/}
            {/*                    <span className="font-medium">*/}
            {/*      {data?.dataRows ?*/}
            {/*          `${((data.dataRows.filter(row => row.some(cell => cell)).length / data.dataRows.length) * 100).toFixed(1)}%`*/}
            {/*          : '0%'*/}
            {/*      }*/}
            {/*    </span>*/}
            {/*                </div>*/}
            {/*                <div className="flex justify-between">*/}
            {/*                    <span className="text-gray-600">평균 행 길이:</span>*/}
            {/*                    <span className="font-medium">*/}
            {/*      {data?.dataRows ?*/}
            {/*          `${(data.dataRows.reduce((sum, row) => sum + row.filter(cell => cell).length, 0) / data.dataRows.length).toFixed(1)} 셀`*/}
            {/*          : '0 셀'*/}
            {/*      }*/}
            {/*    </span>*/}
            {/*                </div>*/}
            {/*                <div className="flex justify-between">*/}
            {/*                    <span className="text-gray-600">마지막 업데이트:</span>*/}
            {/*                    <span className="font-medium text-sm">*/}
            {/*      {lastFetch ?*/}
            {/*          new Date(lastFetch).toLocaleString('ko-KR')*/}
            {/*          : '없음'*/}
            {/*      }*/}
            {/*    </span>*/}
            {/*                </div>*/}
            {/*            </div>*/}
            {/*        </div>*/}

            {/*        /!* 액션 패널 *!/*/}
            {/*        <div className="bg-white rounded-lg shadow-sm border p-6">*/}
            {/*            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">*/}
            {/*                🛠️ 액션*/}
            {/*            </h3>*/}
            {/*            <div className="space-y-3">*/}
            {/*                <button*/}
            {/*                    onClick={refetch}*/}
            {/*                    disabled={loading}*/}
            {/*                    className={`*/}
            {/*      w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium*/}
            {/*      transition-colors duration-200*/}
            {/*      ${loading*/}
            {/*                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'*/}
            {/*                        : 'bg-blue-500 hover:bg-blue-600 text-white'*/}
            {/*                    }*/}
            {/*    `}*/}
            {/*                >*/}
            {/*                    <span className={loading ? 'animate-spin' : ''}>🔄</span>*/}
            {/*                    {loading ? '새로고침 중...' : '데이터 새로고침'}*/}
            {/*                </button>*/}

            {/*                <button*/}
            {/*                    onClick={() => {*/}
            {/*                        if (data?.rows) {*/}
            {/*                            const csv = data.rows.map(row =>*/}
            {/*                                row.map(cell =>*/}
            {/*                                    typeof cell === 'string' && (cell.includes(',') || cell.includes('\n'))*/}
            {/*                                        ? `"${cell.replace(/"/g, '""')}"`*/}
            {/*                                        : cell*/}
            {/*                                ).join(',')*/}
            {/*                            ).join('\n');*/}

            {/*                            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });*/}
            {/*                            const link = document.createElement('a');*/}
            {/*                            const url = URL.createObjectURL(blob);*/}
            {/*                            link.setAttribute('href', url);*/}
            {/*                            link.setAttribute('download', `${data.sheetName || 'data'}.csv`);*/}
            {/*                            document.body.appendChild(link);*/}
            {/*                            link.click();*/}
            {/*                            document.body.removeChild(link);*/}
            {/*                        }*/}
            {/*                    }}*/}
            {/*                    className="*/}
            {/*      w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium*/}
            {/*      bg-green-500 hover:bg-green-600 text-white transition-colors duration-200*/}
            {/*    "*/}
            {/*                >*/}
            {/*                    📥 CSV로 다운로드*/}
            {/*                </button>*/}

            {/*                <button*/}
            {/*                    onClick={() => {*/}
            {/*                        if (data?.dataRows && data?.headers) {*/}
            {/*                            const json = data.dataRows.map(row => {*/}
            {/*                                const obj = {};*/}
            {/*                                data.headers.forEach((header, index) => {*/}
            {/*                                    obj[header] = row[index] || '';*/}
            {/*                                });*/}
            {/*                                return obj;*/}
            {/*                            });*/}

            {/*                            const blob = new Blob([JSON.stringify(json, null, 2)], {*/}
            {/*                                type: 'application/json;charset=utf-8;'*/}
            {/*                            });*/}
            {/*                            const link = document.createElement('a');*/}
            {/*                            const url = URL.createObjectURL(blob);*/}
            {/*                            link.setAttribute('href', url);*/}
            {/*                            link.setAttribute('download', `${data.sheetName || 'data'}.json`);*/}
            {/*                            document.body.appendChild(link);*/}
            {/*                            link.click();*/}
            {/*                            document.body.removeChild(link);*/}
            {/*                        }*/}
            {/*                    }}*/}
            {/*                    className="*/}
            {/*      w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium*/}
            {/*      bg-purple-500 hover:bg-purple-600 text-white transition-colors duration-200*/}
            {/*    "*/}
            {/*                >*/}
            {/*                    📄 JSON으로 다운로드*/}
            {/*                </button>*/}
            {/*            </div>*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*)}*/}
        </div>
    );
};

export default SheetsViewer;