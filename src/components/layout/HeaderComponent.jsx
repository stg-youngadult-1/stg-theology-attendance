import React, { useState } from "react";

/**
 * 헤더 컴포넌트 - 네비게이션 기능 포함
 * @param {Object} props
 * @param {string} props.currentView - 현재 화면 ('attendanceCheck' | 'management')
 * @param {Function} props.onViewChange - 화면 전환 콜백 함수
 */
function HeaderComponent({ currentView = 'management', onViewChange }) {
    // 모바일 메뉴 토글 상태
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // 네비게이션 클릭 핸들러
    const handleNavClick = (view) => {
        if (onViewChange) {
            onViewChange(view);
        }
        // 모바일에서 메뉴 선택 시 메뉴 닫기
        setIsMobileMenuOpen(false);
    };

    // 네비게이션 아이템 스타일 계산
    const getNavItemStyle = (view) => {
        const baseStyle = "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200";

        if (currentView === view) {
            return `${baseStyle} text-blue-600 bg-blue-50 border border-blue-200`;
        } else {
            return `${baseStyle} text-gray-500 hover:text-gray-700 hover:bg-gray-50`;
        }
    };

    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <nav className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                            <h1 className="text-xl font-bold text-gray-900">
                                📚 시광교회 교리반 출석부
                            </h1>
                        </div>

                        {/* 데스크톱 네비게이션 */}
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                <button
                                    onClick={() => handleNavClick('attendanceCheck')}
                                    className={getNavItemStyle('attendanceCheck')}
                                    type="button"
                                >
                                    📱 출석체크(1학기 영상반)
                                </button>

                                <button
                                    onClick={() => handleNavClick('management')}
                                    className={getNavItemStyle('management')}
                                    type="button"
                                >
                                    🗂️ 출결관리(관리자용)
                                </button>

                                <button
                                    onClick={() => handleNavClick('attendanceCheck_25_Fall')}
                                    className={getNavItemStyle('attendanceCheck_25_Fall')}
                                    type="button"
                                >
                                    📱 이전학기 수료확인
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 모바일 네비게이션 메뉴 버튼 */}
                    <div className="md:hidden">
                        <button
                            type="button"
                            className="text-gray-500 hover:text-gray-700 p-2"
                            aria-label={isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* 모바일 네비게이션 메뉴 */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 py-3">
                        <div className="flex flex-col space-y-2">
                            <button
                                onClick={() => handleNavClick('attendanceCheck')}
                                className={`${getNavItemStyle('attendanceCheck')} justify-start text-left`}
                                type="button"
                            >
                                📱 출석체크(1학기 영상반)
                            </button>

                            <button
                                onClick={() => handleNavClick('management')}
                                className={`${getNavItemStyle('management')} justify-start text-left`}
                                type="button"
                            >
                                🗂️ 출결관리(관리자용)
                            </button>

                            <button
                                onClick={() => handleNavClick('attendanceCheck_25_Fall')}
                                className={`${getNavItemStyle('attendanceCheck_25_Fall')} justify-start text-left`}
                                type="button"
                            >
                                📱 이전학기 수료확인
                            </button>
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
}

export default HeaderComponent;