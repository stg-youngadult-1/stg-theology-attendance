import React from "react";

function FooterComponent() {
    return (
        <footer className="bg-white border-t border-gray-200 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        © 시광교회 seetheglory1@naver.com
                    </div>

                    {/*<div className="flex items-center space-x-4 text-sm text-gray-500">*/}
                    {/*    <span>⚡ 실시간 동기화</span>*/}
                    {/*    <span>🔒 안전한 인증</span>*/}
                    {/*    <span>📱 반응형 디자인</span>*/}
                    {/*</div>*/}
                </div>
            </div>
        </footer>
    );
}

export default FooterComponent;