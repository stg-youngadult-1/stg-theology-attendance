import React from "react";

const SheetsTableWithNoData = (className = '') => {
    return (
        <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${className}`}>
            <div className="px-6 py-4 border-b bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800">📋 데이터 테이블</h3>
            </div>
            <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-4">📭</div>
                <h4 className="text-lg font-medium mb-2">데이터가 없습니다</h4>
                <p>스프레드시트에서 데이터를 불러올 수 없습니다.</p>
            </div>
        </div>
    );
};

export default SheetsTableWithNoData;