import React, { useState, useCallback } from 'react';
import { generateDailyCode } from '../../utils/randomGenerator';

/**
 * 오늘의 출석 인증번호를 표시하는 컴포넌트
 * @param {Object} props
 * @param {string} props.className - 추가 CSS 클래스
 */
const DailyCodeBox = ({ className = '' }) => {
    // 복사 상태 관리
    const [copySuccess, setCopySuccess] = useState(false);

    // 현재 인증번호 가져오기
    const currentCode = import.meta.env.VITE_ATTENDANCE_CODE || generateDailyCode();

    // 코드 복사 핸들러
    const handleCopyCode = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(currentCode);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('복사 실패:', err);
        }
    }, [currentCode]);

    return (
        <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 ${className}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            🔑
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">오늘의 출석 인증번호</h3>
                        <p className="text-sm text-gray-600">
                            {new Date().toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                weekday: 'long'
                            })}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-center space-x-3">
                        <div>
                            <div className="text-xl font-bold text-blue-600 font-mono tracking-wider">
                                {currentCode}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                학생들에게 공유해주세요
                            </p>
                        </div>
                        <button
                            onClick={handleCopyCode}
                            className="flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700
                                     text-white rounded-lg transition-colors focus:outline-none focus:ring-2
                                     focus:ring-blue-500 focus:ring-offset-2"
                            title="코드 복사"
                        >
                            {copySuccess ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyCodeBox;