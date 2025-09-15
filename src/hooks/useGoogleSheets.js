// hooks/useGoogleSheets.js

import { useState, useEffect, useCallback, useRef } from 'react';
import {SHEETS_CONFIG} from "../services/sheetsConfig.js";
import googleSheetsData from "../services/GoogleSheetsData.js";
import googleSheetsAuth from "../services/GoogleSheetsAuth.js";
import {getColAddress, getRowAddress} from "../services/model.js";

/**
 * Google Sheets 데이터를 관리하는 커스텀 훅
 * @param {Object} options - 옵션 객체
 * @param {string} options.spreadsheetId - 스프레드시트 ID
 * @param {string} options.sheetName - 시트명
 * @param {string} options.range - 데이터 범위
 * @param {boolean} options.autoFetch - 자동으로 데이터를 가져올지 여부 (기본값: true)
 * @param {number} options.refetchInterval - 자동 새로고침 간격 (밀리초, 0이면 비활성화)
 * @param {Function} options.onSuccess - 성공 콜백
 * @param {Function} options.onError - 에러 콜백
 * @param {Function} options.onCellUpdate - 셀 업데이트 성공 콜백
 * @param {Function} options.onCellUpdateError - 셀 업데이트 에러 콜백
 * @returns {Object} 훅 반환값
 */
export const useGoogleSheets = (options = {}) => {
    const {
        spreadsheetId = SHEETS_CONFIG.spreadsheetId,
        sheetName = SHEETS_CONFIG.sheetName,
        range = SHEETS_CONFIG.range,
        autoFetch = true,
        refetchInterval = 0,
        onSuccess,
        onError,
        onCellUpdate,
        onCellUpdateError
    } = options;

    // 상태 관리
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastFetch, setLastFetch] = useState(null);
    const [cellUpdateLoading, setCellUpdateLoading] = useState(false);

    // ref를 사용해서 최신 상태 추적
    const isAuthenticatedRef = useRef(false);
    const abortControllerRef = useRef(null);
    const intervalRef = useRef(null);

    /**
     * 행/열 인덱스를 A1 표기법으로 변환
     * @param {number} rowIndex - 행 인덱스 (0부터 시작)
     * @param {number} colIndex - 열 인덱스 (0부터 시작)
     * @returns {string} A1 표기법 셀 주소
     */
    const getSheetCellAddress = useCallback((rowIndex, colIndex) => {
        // 출석 데이터는 3행부터 시작 (헤더 2행 + 1-based)
        const row = getRowAddress(rowIndex);

        // 출석 데이터는 C열부터 시작 (이름/반 제외)
        const col = getColAddress(colIndex);

        return `${col}${row}`;
    }, []);

    /**
     * 셀 주소에서 행/열 인덱스 추출
     * @param {string} cellAddress - A1 표기법 셀 주소
     * @returns {Object} {rowIndex, colIndex}
     */
    const parseCellAddress = useCallback((cellAddress) => {
        const match = cellAddress.match(/^([A-Z]+)(\d+)$/);
        if (!match) {
            throw new Error(`유효하지 않은 셀 주소: ${cellAddress}`);
        }

        const colLetters = match[1];
        const rowNumber = parseInt(match[2], 10);

        // 열 문자를 숫자로 변환 (A=0, B=1, C=2...)
        let colIndex = 0;
        for (let i = 0; i < colLetters.length; i++) {
            colIndex = colIndex * 26 + (colLetters.charCodeAt(i) - 65 + 1);
        }
        colIndex -= 1; // 0-based로 변환

        // 출석 데이터 기준으로 인덱스 계산
        const dataRowIndex = rowNumber - 3; // 헤더 2행 제외
        const attendanceColIndex = colIndex - 2; // C열부터 시작하므로 -2

        return {
            rowIndex: dataRowIndex,
            colIndex: attendanceColIndex
        };
    }, []);

    /**
     * 에러 처리 헬퍼
     */
    const handleError = useCallback((err, context = '') => {
        const errorMessage = err?.message || '알 수 없는 오류가 발생했습니다.';
        const fullError = context ? `${context}: ${errorMessage}` : errorMessage;

        console.error('useGoogleSheets 에러:', fullError, err);
        setError(fullError);

        if (onError) {
            onError(fullError, err);
        }
    }, [onError]);

    /**
     * 성공 처리 헬퍼
     */
    const handleSuccess = useCallback((fetchedData) => {
        setData(fetchedData);
        setError(null);
        setLastFetch(new Date().toISOString());

        if (onSuccess) {
            onSuccess(fetchedData);
        }
    }, [onSuccess]);

    /**
     * 인증 수행
     */
    const authenticate = useCallback(async () => {
        try {
            // 이미 인증된 상태면 건너뛰기
            if (googleSheetsAuth.isAuthenticated()) {
                isAuthenticatedRef.current = true;
                return true;
            }

            console.log('🔐 Google Sheets 인증 시작...');
            await googleSheetsAuth.authenticate();
            isAuthenticatedRef.current = true;
            console.log('✅ 인증 완료');
            return true;
        } catch (err) {
            isAuthenticatedRef.current = false;
            handleError(err, '인증 실패');
            return false;
        }
    }, [handleError]);

    /**
     * 데이터 가져오기
     */
    const fetchData = useCallback(async (options = {}) => {
        // 이미 진행 중인 요청이 있으면 취소
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // 새로운 AbortController 생성
        abortControllerRef.current = new AbortController();

        const {
            showLoading = true,
            targetSpreadsheetId = spreadsheetId,
            targetSheetName = sheetName,
            targetRange = range
        } = options;

        try {
            if (showLoading) {
                setLoading(true);
            }

            // 인증 확인 및 수행
            const isAuthenticated = await authenticate();
            if (!isAuthenticated) {
                return null;
            }

            // 요청이 취소되었는지 확인
            if (abortControllerRef.current?.signal.aborted) {
                return null;
            }

            console.log(`📊 데이터 가져오기 시작: ${targetSheetName}!${targetRange}`);

            // 데이터 조회
            const result = await googleSheetsData.fetchSheetData(
                targetSpreadsheetId,
                targetSheetName,
                targetRange
            );

            // 요청이 취소되었는지 다시 확인
            if (abortControllerRef.current?.signal.aborted) {
                return null;
            }

            handleSuccess(result);
            console.log('✅ 데이터 가져오기 완료');
            return result;

        } catch (err) {
            // AbortError는 무시
            if (err.name === 'AbortError') {
                console.log('📝 데이터 가져오기 요청이 취소됨');
                return null;
            }

            handleError(err, '데이터 가져오기 실패');
            return null;
        } finally {
            if (showLoading) {
                setLoading(false);
            }
            abortControllerRef.current = null;
        }
    }, [spreadsheetId, sheetName, range, authenticate, handleError, handleSuccess]);

    /**
     * 셀 업데이트 (낙관적 업데이트 + CAS)
     * @param {number} rowIndex - 데이터 행 인덱스 (0부터 시작)
     * @param {number} colIndex - 출석 열 인덱스 (0부터 시작)
     * @param {string} newValue - 새로운 값
     * @returns {Promise<boolean>} 업데이트 성공 여부
     */
    const updateCell = useCallback(async (rowIndex, colIndex, newValue) => {
        if (!data || !data.dataRows) {
            throw new Error('데이터가 로드되지 않았습니다.');
        }

        if (rowIndex < 0 || rowIndex >= data.dataRows.length) {
            throw new Error(`유효하지 않은 행 인덱스: ${rowIndex}`);
        }

        if (colIndex < 0 || colIndex >= data.headers.length) {
            throw new Error(`유효하지 않은 열 인덱스: ${colIndex}`);
        }

        const targetRow = data.dataRows[rowIndex];
        const currentValue = targetRow.attendance?.[colIndex]?.status === 'Etc'
            ? targetRow.attendance[colIndex].desc
            : targetRow.attendance?.[colIndex]?.status || '';

        try {
            setCellUpdateLoading(true);

            // 인증 확인
            const isAuthenticated = await authenticate();
            if (!isAuthenticated) {
                throw new Error('인증이 필요합니다.');
            }

            // 셀 주소 계산
            const cellAddress = getSheetCellAddress(rowIndex, colIndex);
            console.log(`📝 셀 업데이트 시도: ${cellAddress} (${targetRow.user?.name})`);

            // 낙관적 업데이트: UI 먼저 업데이트
            const previousData = { ...data };
            const updatedData = { ...data };
            const updatedRow = { ...updatedData.dataRows[rowIndex] };
            const updatedAttendance = [...(updatedRow.attendance || [])];

            // 새 값에 따른 출석 상태 파싱
            let newAttendanceItem;
            if (!newValue || newValue.trim() === '' || newValue.trim() === '-') {
                newAttendanceItem = { status: 'None', desc: '' };
            } else if (newValue.trim() === 'X') {
                newAttendanceItem = { status: 'X', desc: '' };
            } else if (newValue.trim() === 'O') {
                newAttendanceItem = { status: 'O', desc: '' };
            } else {
                newAttendanceItem = { status: 'Etc', desc: newValue.trim() };
            }

            updatedAttendance[colIndex] = newAttendanceItem;
            updatedRow.attendance = updatedAttendance;
            updatedData.dataRows[rowIndex] = updatedRow;

            // 낙관적 업데이트 적용
            setData(updatedData);

            // CAS를 사용한 실제 업데이트
            const updateResult = await googleSheetsData.updateCellWithCAS(
                spreadsheetId,
                sheetName,
                cellAddress,
                newValue,
                currentValue
            );

            console.log('✅ 셀 업데이트 성공:', cellAddress);

            // 성공 콜백 호출
            if (onCellUpdate) {
                onCellUpdate({
                    rowIndex,
                    colIndex,
                    cellAddress,
                    previousValue: currentValue,
                    newValue,
                    userName: targetRow.user?.name,
                    updateResult
                });
            }

            return true;

        } catch (err) {
            console.error('❌ 셀 업데이트 실패:', err.message);

            // CAS 충돌인 경우 원본 데이터로 복원하고 새로고침
            if (err.message.includes('CONFLICT:')) {
                console.log('🔄 데이터 충돌 감지 - 새로고침 수행');

                // 에러 상태 설정
                const conflictError = `데이터가 이미 수정되었습니다. 새로고침 후 다시 시도해주세요. ${err.message}`;

                // 에러 콜백 호출
                if (onCellUpdateError) {
                    onCellUpdateError({
                        rowIndex,
                        colIndex,
                        error: err,
                        isConflict: true,
                        userName: data.dataRows[rowIndex]?.user?.name
                    });
                }

                // 백그라운드에서 새로고침
                await fetchData({ showLoading: false });

                throw new Error(conflictError);
            } else {
                // 일반적인 에러인 경우 이전 상태 복원
                setData(data);

                if (onCellUpdateError) {
                    onCellUpdateError({
                        rowIndex,
                        colIndex,
                        error: err,
                        isConflict: false,
                        userName: data.dataRows[rowIndex]?.user?.name
                    });
                }

                throw err;
            }

        } finally {
            setCellUpdateLoading(false);
        }
    }, [data, spreadsheetId, sheetName, authenticate, getSheetCellAddress, onCellUpdate, onCellUpdateError, fetchData]);

    /**
     * 특정 셀의 현재 값 조회
     * @param {number} rowIndex - 데이터 행 인덱스
     * @param {number} colIndex - 출석 열 인덱스
     * @returns {Promise<string>} 현재 셀 값
     */
    const getCellValue = useCallback(async (rowIndex, colIndex) => {
        try {
            const cellAddress = getSheetCellAddress(rowIndex, colIndex);
            const value = await googleSheetsData.getCurrentCellValue(spreadsheetId, sheetName, cellAddress);
            return value;
        } catch (err) {
            console.error('셀 값 조회 실패:', err);
            throw err;
        }
    }, [spreadsheetId, sheetName, getSheetCellAddress]);

    /**
     * 데이터 새로고침 (로딩 상태 표시)
     */
    const refetch = useCallback(() => {
        return fetchData({ showLoading: true });
    }, [fetchData]);

    /**
     * 백그라운드에서 데이터 새로고침 (로딩 상태 표시 안함)
     */
    const refreshData = useCallback(() => {
        return fetchData({ showLoading: false });
    }, [fetchData]);

    /**
     * 다른 시트/범위의 데이터 가져오기
     */
    const fetchOtherSheet = useCallback((otherSpreadsheetId, otherSheetName, otherRange) => {
        return fetchData({
            showLoading: true,
            targetSpreadsheetId: otherSpreadsheetId,
            targetSheetName: otherSheetName,
            targetRange: otherRange
        });
    }, [fetchData]);

    /**
     * 에러 상태 초기화
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    /**
     * 모든 상태 초기화
     */
    const reset = useCallback(() => {
        // 진행 중인 요청 취소
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // 자동 새로고침 정지
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // 상태 초기화
        setData(null);
        setLoading(false);
        setError(null);
        setLastFetch(null);
        setCellUpdateLoading(false);
        isAuthenticatedRef.current = false;
    }, []);

    /**
     * 인증 상태 초기화
     */
    const clearAuth = useCallback(() => {
        googleSheetsAuth.clearAuthentication();
        isAuthenticatedRef.current = false;
    }, []);

    // 컴포넌트 마운트 시 자동 데이터 가져오기
    useEffect(() => {
        if (autoFetch) {
            fetchData();
        }

        // 자동 새로고침 설정
        if (refetchInterval > 0) {
            intervalRef.current = setInterval(() => {
                refreshData();
            }, refetchInterval);
        }

        // 클린업 함수
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [autoFetch, refetchInterval, fetchData, refreshData]);

    // 파라미터 변경 시 데이터 다시 가져오기
    useEffect(() => {
        if (autoFetch && (spreadsheetId || sheetName || range)) {
            fetchData();
        }
    }, [spreadsheetId, sheetName, range, autoFetch, fetchData]);

    // 컴포넌트 언마운트 시 정리
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // 반환값
    return {
        // 데이터 상태
        data,
        loading,
        error,
        lastFetch,
        cellUpdateLoading,

        // 데이터 정보 (data가 있을 때만)
        headers: data?.headers || [],
        rows: data?.rows || [],
        dataRows: data?.dataRows || [],
        totalRows: data?.totalRows || 0,
        dataRowCount: data?.dataRowCount || 0,
        hasData: data?.hasData || false,

        // 메서드
        refetch,
        refreshData,
        fetchOtherSheet,
        clearError,
        reset,
        clearAuth,

        // 셀 업데이트 메서드
        updateCell,
        getCellValue,
        getSheetCellAddress,
        parseCellAddress,

        // 인증 상태
        isAuthenticated: googleSheetsAuth.isAuthenticated(),
        authStatus: googleSheetsAuth.getAuthStatus(),

        // 설정 정보
        config: {
            spreadsheetId,
            sheetName,
            range,
            autoFetch,
            refetchInterval
        }
    };
};

/**
 * 특정 셀 값만 가져오는 훅
 */
export const useGoogleSheetsCell = (cellAddress, options = {}) => {
    const [cellValue, setCellValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const {
        spreadsheetId = SHEETS_CONFIG.spreadsheetId,
        sheetName = SHEETS_CONFIG.sheetName,
        autoFetch = true
    } = options;

    const fetchCellValue = useCallback(async () => {
        if (!cellAddress) return;

        try {
            setLoading(true);
            setError(null);

            // 인증 확인
            if (!googleSheetsAuth.isAuthenticated()) {
                await googleSheetsAuth.authenticate();
            }

            const value = await googleSheetsData.getCellValue(spreadsheetId, sheetName, cellAddress);
            setCellValue(value);

        } catch (err) {
            setError(err.message);
            console.error('셀 값 가져오기 실패:', err);
        } finally {
            setLoading(false);
        }
    }, [cellAddress, spreadsheetId, sheetName]);

    useEffect(() => {
        if (autoFetch && cellAddress) {
            fetchCellValue();
        }
    }, [autoFetch, cellAddress, fetchCellValue]);

    return {
        cellValue,
        loading,
        error,
        refetch: fetchCellValue
    };
};

/**
 * 여러 범위의 데이터를 한 번에 가져오는 훅
 */
export const useGoogleSheetsBatch = (ranges, options = {}) => {
    const [batchData, setBatchData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const {
        spreadsheetId = SHEETS_CONFIG.spreadsheetId,
        autoFetch = true
    } = options;

    const fetchBatchData = useCallback(async () => {
        if (!ranges || ranges.length === 0) return;

        try {
            setLoading(true);
            setError(null);

            // 인증 확인
            if (!googleSheetsAuth.isAuthenticated()) {
                await googleSheetsAuth.authenticate();
            }

            const data = await googleSheetsData.getBatchData(spreadsheetId, ranges);
            setBatchData(data);

        } catch (err) {
            setError(err.message);
            console.error('배치 데이터 가져오기 실패:', err);
        } finally {
            setLoading(false);
        }
    }, [ranges, spreadsheetId]);

    useEffect(() => {
        if (autoFetch && ranges && ranges.length > 0) {
            fetchBatchData();
        }
    }, [autoFetch, ranges, fetchBatchData]);

    return {
        batchData,
        loading,
        error,
        refetch: fetchBatchData
    };
};

export default useGoogleSheets;