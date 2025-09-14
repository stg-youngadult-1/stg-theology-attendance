import React from "react";

const SheetsTableSkeleton = (className = '') => {
    return (
        <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${className}`}>
            <div className="px-6 py-4 border-b bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    테이블 로딩 중...
                </h3>
            </div>
            <div className="p-8 text-center text-gray-500">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                </div>
            </div>
        </div>
    );
}

export default SheetsTableSkeleton;