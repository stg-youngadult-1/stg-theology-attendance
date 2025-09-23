// components/sheets/SheetsViewer.jsx

import React, { useState, useCallback } from 'react';
import { useGoogleSheets } from '../../hooks/useGoogleSheets';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import SheetsHeader from './SheetsHeader';
import SheetsTable from './SheetsTable';
import CellEditModal from '../common/CellEditModal';

/**
 * 스프레드시트 뷰어 메인 컨테이너 컴포넌트
 * @param {Object} props
 * @param {Object} props.options - useGoogleSheets 훅 옵션
 * @param {string} props.className - 추가 CSS 클래스
 */
const SheetsViewer = ({ options = {}, className = '' }) => {
    // 모달 상태 관리
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCell, setSelectedCell] = useState(null);
    const [modalError, setModalError] = useState(null);

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
        config,
        updateCell,
        cellUpdateLoading
    } = useGoogleSheets({
        ...options,
        onCellUpdate: (result) => {
            console.log('셀 업데이트 성공:', result);
            setIsModalOpen(false);
            setSelectedCell(null);
            setModalError(null);
            refetch();
        },
        onCellUpdateError: (errorInfo) => {
            console.error('셀 업데이트 실패:', errorInfo);

            if (errorInfo.isConflict) {
                // CAS 충돌 - 모달을 닫고 사용자에게 알림
                setModalError('데이터가 이미 수정되었습니다. 새로고침 후 다시 시도해주세요.');
                // 3초 후 모달 닫기
                setTimeout(() => {
                    setIsModalOpen(false);
                    setSelectedCell(null);
                    setModalError(null);
                }, 3000);
            } else {
                // 일반 에러
                setModalError(errorInfo.error.message || '저장에 실패했습니다.');
            }
        }
    });

    // 셀 클릭 핸들러
    const handleCellClick = useCallback((rowIndex, colIndex, currentValue, cellInfo) => {
        setSelectedCell({
            rowIndex,
            colIndex,
            currentValue,
            cellInfo
        });
        setModalError(null);
        setIsModalOpen(true);
    }, []);

    // 모달 닫기 핸들러
    const handleModalClose = useCallback(() => {
        if (!cellUpdateLoading) {
            setIsModalOpen(false);
            setSelectedCell(null);
            setModalError(null);
        }
    }, [cellUpdateLoading]);

    // 셀 저장 핸들러
    const handleCellSave = useCallback(async (newValue) => {
        if (!selectedCell) return;

        try {
            await updateCell(
                selectedCell.rowIndex,
                selectedCell.colIndex,
                newValue
            );
            // 성공 시 onCellUpdate 콜백에서 모달을 닫을 것
        } catch (error) {
            // 에러는 onCellUpdateError 콜백에서 처리됨
            throw error;
        }
    }, [selectedCell, updateCell]);

    // 에러 상태 렌더링
    if (error) {
        return (
            <div className={`container max-w-7xl mx-auto px-4 py-8 ${className}`}>
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
            <div className={`container max-w-7xl mx-auto px-4 py-8 ${className}`}>
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
        <div className={`container max-w-7xl mx-auto px-4 py-8 ${className}`}>
            {/* 헤더 */}
            <SheetsHeader
                data={data}
                onRefresh={refetch}
                loading={loading}
                config={config}
            />

            {/* 데이터 테이블 */}
            <SheetsTable
                data={data}
                loading={loading}
                onCellClick={handleCellClick}
                cellUpdateLoading={cellUpdateLoading}
            />

            {/* 셀 편집 모달 */}
            <CellEditModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSave={handleCellSave}
                currentValue={selectedCell?.currentValue}
                cellInfo={selectedCell?.cellInfo}
                loading={cellUpdateLoading}
                error={modalError}
            />
        </div>
    );
};

export default SheetsViewer;