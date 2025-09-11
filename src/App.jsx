import React from 'react';
import SheetsViewer from './components/data/SheetsViewer';

/**
 * 메인 애플리케이션 컴포넌트
 */
function App() {
    // Google Sheets 뷰어 옵션 설정
    const sheetsOptions = {
        // 자동으로 데이터 로드
        autoFetch: true,

        // 30초마다 자동 새로고침 (선택사항)
        // refetchInterval: 30000,

        // 성공/에러 콜백 (선택사항)
        onSuccess: (data) => {
            console.log('✅ 데이터 로드 성공:', data);
        },

        onError: (error) => {
            console.error('❌ 데이터 로드 실패:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 페이지 헤더 */}
            <header className="bg-white shadow-sm border-b">
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
            </header>

            {/* 메인 콘텐츠 */}
            <main>
                <SheetsViewer
                    options={sheetsOptions}
                    className="animate-fade-in"
                />
            </main>

            {/* 푸터 */}
            <footer className="bg-white border-t mt-12">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            © 2024 Google Sheets 뷰어. React로 구현된 실시간 데이터 뷰어입니다.
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>⚡ 실시간 동기화</span>
                            <span>🔒 안전한 인증</span>
                            <span>📱 반응형 디자인</span>
                        </div>
                    </div>
                </div>
            </footer>

            {/* 추가 스타일 */}
            <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
        </div>
    );
}

export default App;