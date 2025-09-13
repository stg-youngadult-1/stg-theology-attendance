import React from "react";

function FooterComponent() {
    return <footer className="bg-white border-t mt-12">
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
    </footer>;
}

export default FooterComponent;