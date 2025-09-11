// hooks/useGoogleSheets.js

import { useState, useEffect, useCallback, useRef } from 'react';
import {SHEETS_CONFIG} from "../services/sheetsConfig.js";
import googleSheetsData from "../services/GoogleSheetsData.js";
import googleSheetsAuth from "../services/GoogleSheetsAuth.js";

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
        onError
    } = options;

    // 상태 관리
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastFetch, setLastFetch] = useState(null);

    // ref를 사용해서 최신 상태 추적
    const isAuthenticatedRef = useRef(false);
    const abortControllerRef = useRef(null);
    const intervalRef = useRef(null);

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