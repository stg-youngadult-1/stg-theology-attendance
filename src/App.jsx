import React from 'react';
import SheetsViewer from './components/data/SheetsViewer';
import FooterComponent from "./components/layout/FooterComponent.jsx";
import HeaderComponent from "./components/layout/HeaderComponent.jsx";

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
            <HeaderComponent/>

            {/* 메인 콘텐츠 */}
            <main>
                <SheetsViewer
                    options={sheetsOptions}
                    className="animate-fade-in"
                />
            </main>

            {/* 푸터 */}
            <FooterComponent/>

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