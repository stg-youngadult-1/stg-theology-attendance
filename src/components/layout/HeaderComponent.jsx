import React from "react";

function HeaderComponent() {
    return <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
              <span className="text-2xl" role="img" aria-label="애플리케이션">
                📊
              </span>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">
                            Google Sheets 뷰어
                        </h1>
                        <p className="text-sm text-gray-600">
                            실시간 스프레드시트 데이터 조회 및 관리
                        </p>
                    </div>
                </div>

                {/* 추가 네비게이션이나 사용자 정보 등 */}
                <div className="flex items-center gap-4">
                    <a
                        href="https://docs.google.com/spreadsheets"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                  flex items-center gap-2 px-3 py-2 text-sm font-medium
                  text-gray-600 hover:text-blue-600 transition-colors
                "
                    >
                        <span>🔗</span>
                        Google Sheets
                    </a>
                </div>
            </div>
        </div>
    </header>;
}

export default HeaderComponent;