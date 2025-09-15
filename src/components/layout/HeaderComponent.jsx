import React from "react";

function HeaderComponent() {
    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <nav className="max-w-7xl mx-auto px-4 ">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                            <h1 className="text-xl font-bold text-gray-900">📚 시광교회 교리반 출석부</h1>
                        </div>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                <a href="#" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">출석체크</a>
                                <a href="#" className="text-blue-600 px-3 py-2 rounded-md text-sm font-medium bg-blue-50">출결관리(관리자용)</a>
                            </div>
                        </div>
                    </div>
                    {/*<div className="flex items-center space-x-4">*/}
                    {/*    <button className="text-gray-500 hover:text-gray-700">*/}
                    {/*        <i className="fas fa-bell text-lg"></i>*/}
                    {/*    </button>*/}
                    {/*    <a*/}
                    {/*        href="https://docs.google.com/spreadsheets"*/}
                    {/*        target="_blank"*/}
                    {/*        rel="noopener noreferrer"*/}
                    {/*        className="hidden sm:flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors"*/}
                    {/*    >*/}
                    {/*        <i className="fas fa-external-link-alt text-sm"></i>*/}
                    {/*        <span className="text-sm font-medium">Google Sheets</span>*/}
                    {/*    </a>*/}
                    {/*    <div className="flex items-center space-x-2">*/}
                    {/*        <img className="h-8 w-8 rounded-full" src="https://via.placeholder.com/32/4F46E5/FFFFFF?text=T" alt="선생님" />*/}
                    {/*        <span className="text-sm font-medium text-gray-700">김선생님</span>*/}
                    {/*    </div>*/}
                    {/*</div>*/}
                </div>
            </nav>
        </header>
    );
}

export default HeaderComponent;