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
# Google Sheets 연동 React 프로젝트 종합 문서

## 📋 프로젝트 개요

출석 관리 시스템을 위한 Google Sheets API 연동 React 웹 애플리케이션입니다. 서비스 계정 인증을 통해 스프레드시트 데이터를 실시간으로 조회하고 시각화하는 기능을 제공합니다.

### 주요 특징
- **실시간 데이터 동기화**: Google Sheets와 실시간 연동
- **출석 관리 특화**: 출석부 데이터에 최적화된 UI/UX
- **브라우저 기반 인증**: Web Crypto API를 활용한 JWT 토큰 생성
- **반응형 디자인**: 모바일과 데스크톱 모두 지원
- **자동 새로고침**: 설정 가능한 주기적 데이터 업데이트

## 🏗️ 아키텍처 구조

### 레이어별 구성

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│  ┌─────────────┐ ┌─────────────────┐│
│  │ Components  │ │ Custom Hooks    ││
│  │             │ │                 ││
│  └─────────────┘ └─────────────────┘│
├─────────────────────────────────────┤
│           Service Layer             │
│  ┌──────────┐ ┌──────────┐ ┌──────┐ │
│  │   Auth   │ │   Data   │ │Model │ │
│  │          │ │          │ │      │ │
│  └──────────┘ └──────────┘ └──────┘ │
├─────────────────────────────────────┤
│         Configuration               │
│  ┌─────────────────────────────────┐ │
│  │        sheetsConfig.js          │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## 📁 파일별 상세 분석

### 1. 공통 컴포넌트 (`src/components/common/`)

#### LoadingSpinner.jsx
- **역할**: 로딩 상태 시각화
- **특징**:
    - 다양한 크기 옵션 (sm, md, lg, xl)
    - 커스터마이징 가능한 메시지
    - 접근성 고려 (aria-label)
- **사용처**: 데이터 로딩 중 표시

#### ErrorMessage.jsx
- **역할**: 에러 상황 사용자 친화적 표시
- **특징**:
    - 문제 해결 가이드 내장
    - 재시도 및 페이지 새로고침 버튼
    - 접기/펼치기 가능한 도움말
- **사용처**: API 에러, 인증 실패 등

#### SuccessMessage.jsx
- **역할**: 성공 상태 및 데이터 통계 표시
- **특징**:
    - 데이터 통계 정보 (행 수, 컬럼 수, 업데이트 시간)
    - 한국어 로케일 숫자/날짜 포맷팅
    - 확장 가능한 구조 (children prop)
- **사용처**: 데이터 로드 완료 시 표시

### 2. 데이터 컴포넌트 (`src/components/data/`)

#### SheetsViewer.jsx
- **역할**: 메인 컨테이너 컴포넌트
- **핵심 기능**:
    - 상태별 조건부 렌더링 (로딩, 에러, 성공)
    - useGoogleSheets 훅과의 통합
    - 개발 환경 디버그 정보 제공
    - 실시간 인증 상태 표시
- **컴포넌트 구성**: SheetsHeader + SheetsTable + 공통 컴포넌트들

#### SheetsTable.jsx
- **역할**: 출석 데이터 테이블 시각화
- **핵심 기능**:
    - 실시간 검색 (이름, 반 기준)
    - 이름 기준 정렬 (한국어 로케일)
    - 출석 상태별 색상 구분 (O, X, Etc, None)
    - 반응형 디자인 (sticky 헤더, 모바일 스크롤)
- **데이터 처리**: useMemo를 활용한 검색/정렬 최적화

#### SheetsHeader.jsx
- **역할**: 헤더 정보 및 제어 패널
- **핵심 기능**:
    - 데이터 통계 그리드 (행 수, 컬럼 수, 업데이트 시간)
    - 새로고침 버튼 (로딩 상태 연동)
    - 설정 정보 표시 (시트명, 범위, 자동 새로고침)
- **UI 특징**: 반응형 그리드, 카드 스타일 디자인

### 3. 서비스 레이어 (`src/services/`)

#### GoogleSheetsAuth.js
- **역할**: Google Sheets API 인증 관리
- **핵심 기능**:
    - JWT 토큰 생성 (브라우저 환경에서 직접 구현)
    - 액세스 토큰 관리 및 자동 갱신
    - 토큰 유효성 검사 및 만료 관리
- **보안 특징**:
    - Web Crypto API 활용 RSA 서명
    - 토큰 자동 만료 관리 (5분 여유)
    - 개인키 메모리에서만 처리

#### GoogleSheetsData.js
- **역할**: Google Sheets API 데이터 조회
- **핵심 기능**:
    - 인증된 API 요청 관리
    - 401 에러 자동 재시도
    - 다양한 조회 방식 지원 (단일, 배치, 메타데이터)
    - 데이터 변환 기능 (CSV, JSON)
- **에러 처리**: 자동 재인증 및 상세한 에러 메시지

#### model.js
- **역할**: 스프레드시트 데이터 구조화
- **핵심 기능**:
    - 출석부 특화 데이터 파싱
    - 날짜 문자열 파싱 ("2025. 9. 10" 형식)
    - 출석 상태 분류 (O, X, Etc, None)
- **데이터 변환**:
  ```javascript
  // 원본 → 구조화된 데이터
  Raw Sheet Data → { headers, dataRows, user, attendance }
  ```

#### sheetsConfig.js
- **역할**: 프로젝트 설정 중앙 관리
- **설정 항목**:
    - 스프레드시트 ID, 시트명, 데이터 범위
    - Google Sheets API 엔드포인트
    - 서비스 계정 자격증명 (환경변수)
    - API 요청 옵션
- **보안**: 환경변수를 통한 자격증명 관리

### 4. 커스텀 훅 (`src/hooks/`)

#### useGoogleSheets.js
- **역할**: Google Sheets 데이터 상태 관리
- **핵심 기능**:
    - React 생명주기와 통합
    - 자동 새로고침 (설정 가능한 간격)
    - 요청 취소 메커니즘 (AbortController)
    - 에러 처리 및 성공 콜백
- **성능 최적화**:
    - useCallback으로 함수 메모이제이션
    - 중복 요청 방지
    - 선택적 로딩 상태

**추가 훅들**:
- `useGoogleSheetsCell`: 단일 셀 조회
- `useGoogleSheetsBatch`: 배치 조회

## 🔄 데이터 플로우

### 1. 인증 플로우
```mermaid
graph TD
    A[컴포넌트 마운트] --> B[useGoogleSheets 훅 실행]
    B --> C[authenticate 호출]
    C --> D{토큰 유효성 체크}
    D -->|유효함| E[기존 토큰 재사용]
    D -->|만료/없음| F[JWT 토큰 생성]
    F --> G[액세스 토큰 요청]
    G --> H[토큰 저장 및 만료시간 설정]
    H --> I[인증 완료]
    E --> I
```

### 2. 데이터 조회 플로우
```mermaid
graph TD
    A[fetchData 호출] --> B[인증 상태 확인]
    B --> C[Google Sheets API 요청]
    C --> D[원본 데이터 수신]
    D --> E[model.js로 데이터 파싱]
    E --> F[구조화된 데이터 반환]
    F --> G[상태 업데이트]
    G --> H[컴포넌트 리렌더링]
```

### 3. 에러 처리 플로우
```mermaid
graph TD
    A[API 요청 실패] --> B{401 에러?}
    B -->|Yes| C[인증 상태 초기화]
    C --> D[재인증 수행]
    D --> E[요청 재시도]
    B -->|No| F[에러 메시지 생성]
    F --> G[handleError 콜백]
    G --> H[ErrorMessage 컴포넌트 표시]
```

## 🎨 UI/UX 특징

### 색상 체계
- **성공/출석**: 녹색 계열 (`text-green-600`, `bg-green-50`)
- **오류/결석**: 빨간색 계열 (`text-red-600`, `bg-red-50`)
- **정보/액션**: 파란색 계열 (`text-blue-600`, `bg-blue-500`)
- **중성/기타**: 회색 계열 (`text-gray-600`, `bg-gray-50`)

### 반응형 디자인
- **모바일 우선**: Tailwind CSS의 모바일 퍼스트 접근
- **그리드 시스템**: `grid-cols-2 md:grid-cols-4`
- **스크롤 처리**: `overflow-x-auto`로 테이블 가로 스크롤

### 접근성
- **시각적 피드백**: 색상 + 텍스트 + 아이콘 조합
- **키보드 네비게이션**: 모든 인터랙티브 요소 접근 가능
- **스크린 리더**: aria-label, role 속성 활용

## ⚡ 성능 최적화

### React 최적화
- **메모이제이션**: `useMemo`, `useCallback` 적극 활용
- **조건부 렌더링**: 불필요한 컴포넌트 렌더링 방지
- **상태 분리**: 전역/로컬 상태 적절한 분리

### API 최적화
- **토큰 캐싱**: 유효한 토큰 재사용
- **배치 요청**: 여러 범위 동시 조회
- **요청 취소**: AbortController로 불필요한 요청 취소

### 데이터 처리 최적화
- **클라이언트 사이드 필터링**: 검색/정렬 로컬 처리
- **지연 로딩**: 필요한 시점에만 데이터 조회
- **백그라운드 업데이트**: 사용자 경험 방해 없이 데이터 갱신

## 🔒 보안 고려사항

### 인증 보안
- **서비스 계정**: 사용자 인증 없이 안전한 API 액세스
- **읽기 전용 권한**: `spreadsheets.readonly` 스코프로 제한
- **토큰 만료 관리**: 자동 갱신으로 장기 토큰 노출 방지

### 데이터 보안
- **환경변수**: 민감한 자격증명 코드에서 분리
- **클라이언트 사이드**: 서버 없이 브라우저에서 직접 처리
- **HTTPS 강제**: 모든 API 통신 암호화

### 에러 보안
- **민감정보 노출 방지**: 에러 메시지에서 내부 정보 제거
- **사용자 친화적 메시지**: 기술적 세부사항 숨김

## 🚀 배포 및 환경 설정

### 환경변수 설정
```bash
# .env 파일
VITE_SERVICE_ACCOUNT_CREDENTIALS='{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "service-account@project.iam.gserviceaccount.com",
  "client_id": "client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}'
```

### Google Cloud Platform 설정
1. **서비스 계정 생성**: Google Cloud Console에서 생성
2. **키 생성**: JSON 형태로 다운로드
3. **Sheets API 활성화**: Google Sheets API 사용 설정
4. **권한 설정**: 스프레드시트에 서비스 계정 이메일 공유
