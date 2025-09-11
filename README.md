```
src/
├── components/
│   ├── common/
│   │   ├── LoadingSpinner.jsx
│   │   ├── ErrorMessage.jsx
│   │   └── SuccessMessage.jsx
│   ├── sheets/
│   │   ├── SheetsViewer.jsx          # 메인 컨테이너 컴포넌트
│   │   ├── SheetsTable.jsx           # 테이블 컴포넌트
│   │   └── SheetsHeader.jsx          # 헤더 정보 컴포넌트
│   └── layout/
│       └── Header.jsx                # 페이지 헤더
├── services/
│   ├── GoogleSheetsData.js         # Google Sheets API 클래스
│   └── sheetsConfig.js               # 설정 파일 (스프레드시트 ID 등)
├── hooks/
│   └── useGoogleSheets.js            # 커스텀 훅
├── utils/
│   └── constants.js                  # 상수 정의
└── App.jsx                           # 메인 앱 컴포넌트
```

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
