// services/GoogleSheetsAuth.js

import { getSheetConfig, SERVICE_ACCOUNT_CREDENTIALS } from './sheetsConfig.js';

/**
 * Google Sheets API 인증을 담당하는 클래스
 * JWT 토큰 생성 및 액세스 토큰 관리
 */
class GoogleSheetsAuth {
    constructor() {
        this.accessToken = null;
        this.tokenExpiryTime = null;
    }

    /**
     * JWT 토큰 생성 (브라우저 환경용)
     * @param {Object} credentials - 서비스 계정 자격 증명
     * @returns {Promise<string>} JWT 토큰
     */
    async createJWT(credentials) {
        const header = {
            "alg": "RS256",
            "typ": "JWT"
        };

        const now = Math.floor(Date.now() / 1000);
        const payload = {
            "iss": credentials.client_email,
            "scope": getSheetConfig('attendance').api.scope,
            "aud": getSheetConfig('attendance').api.tokenUrl,
            "exp": now + 3600,
            "iat": now
        };

        // Base64 URL 인코딩 헬퍼 함수들
        const base64UrlEscape = (str) => {
            return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        };

        const base64UrlEncode = (str) => {
            return base64UrlEscape(btoa(str));
        };

        const headerEncoded = base64UrlEncode(JSON.stringify(header));
        const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
        const unsignedToken = `${headerEncoded}.${payloadEncoded}`;

        try {
            const privateKey = await this.importPrivateKey(credentials.private_key);
            const signature = await crypto.subtle.sign(
                "RSASSA-PKCS1-v1_5",
                privateKey,
                new TextEncoder().encode(unsignedToken)
            );

            const signatureArray = new Uint8Array(signature);
            const signatureBase64 = base64UrlEscape(btoa(String.fromCharCode(...signatureArray)));

            return `${unsignedToken}.${signatureBase64}`;
        } catch (error) {
            console.error('JWT 서명 생성 실패:', error);
            throw new Error(`JWT 토큰 생성 실패: ${error.message}`);
        }
    }

    /**
     * PEM 형식의 개인키를 CryptoKey로 변환
     * @param {string} privateKeyPem - PEM 형식의 개인키
     * @returns {Promise<CryptoKey>} 가져온 개인키
     */
    async importPrivateKey(privateKeyPem) {
        const pemHeader = "-----BEGIN PRIVATE KEY-----";
        const pemFooter = "-----END PRIVATE KEY-----";
        const privateKeyBase64 = privateKeyPem
            .replace(pemHeader, "")
            .replace(pemFooter, "")
            .replace(/\s/g, "");

        const privateKeyArrayBuffer = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0));

        try {
            return await crypto.subtle.importKey(
                "pkcs8",
                privateKeyArrayBuffer,
                {
                    name: "RSASSA-PKCS1-v1_5",
                    hash: "SHA-256"
                },
                false,
                ["sign"]
            );
        } catch (error) {
            throw new Error(`개인키 가져오기 실패: ${error.message}`);
        }
    }

    /**
     * JWT를 사용하여 액세스 토큰 획득
     * @param {string} jwt - JWT 토큰
     * @returns {Promise<boolean>} 성공 여부
     */
    async getAccessToken(jwt) {
        try {
            console.log('🔑 액세스 토큰 요청 중...');

            const response = await fetch(getSheetConfig('attendance').api.tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    'assertion': jwt
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`토큰 요청 실패: ${response.status} - ${errorData.error_description || response.statusText}`);
            }

            const data = await response.json();
            this.accessToken = data.access_token;

            // 토큰 만료 시간 설정 (현재 시간 + expires_in - 5분 여유)
            this.tokenExpiryTime = Date.now() + ((data.expires_in - 300) * 1000);

            console.log('✅ 액세스 토큰 획득 완료');
            return true;
        } catch (error) {
            console.error('❌ 액세스 토큰 획득 실패:', error);
            throw error;
        }
    }

    /**
     * Google Sheets API 인증 수행
     * @param {Object} credentials - 서비스 계정 자격 증명 (선택사항)
     * @returns {Promise<boolean>} 인증 성공 여부
     */
    async authenticate(credentials = SERVICE_ACCOUNT_CREDENTIALS) {
        try {
            console.log('🔐 Google Sheets API 인증 시작...');

            // 기존 토큰이 유효하면 재사용
            if (this.isTokenValid()) {
                console.log('✅ 기존 토큰이 유효함 - 재사용');
                return true;
            }

            const jwt = await this.createJWT(credentials);
            await this.getAccessToken(jwt);

            console.log('✅ Google Sheets API 인증 완료');
            return true;
        } catch (error) {
            console.error('❌ 인증 실패:', error.message);
            this.clearAuthentication();
            throw new Error(`Google Sheets API 인증 실패: ${error.message}`);
        }
    }

    /**
     * 토큰 유효성 검사
     * @returns {boolean} 토큰이 유효하고 만료되지 않았는지 여부
     */
    isTokenValid() {
        return !!(
            this.accessToken &&
            this.tokenExpiryTime &&
            Date.now() < this.tokenExpiryTime
        );
    }

    /**
     * 인증 상태 확인
     * @returns {boolean} 인증된 상태인지 여부
     */
    isAuthenticated() {
        return this.isTokenValid();
    }

    /**
     * 현재 액세스 토큰 반환
     * @returns {string|null} 액세스 토큰
     */
    getToken() {
        return this.isTokenValid() ? this.accessToken : null;
    }

    /**
     * 인증 상태 초기화
     */
    clearAuthentication() {
        this.accessToken = null;
        this.tokenExpiryTime = null;
        console.log('🔓 인증 상태가 초기화되었습니다.');
    }

    /**
     * 토큰 갱신 (필요시 자동으로 재인증)
     * @param {Object} credentials - 서비스 계정 자격 증명 (선택사항)
     * @returns {Promise<string>} 유효한 액세스 토큰
     */
    async ensureValidToken(credentials = SERVICE_ACCOUNT_CREDENTIALS) {
        if (!this.isTokenValid()) {
            console.log('🔄 토큰이 만료되었거나 없음 - 재인증 수행');
            await this.authenticate(credentials);
        }
        return this.accessToken;
    }

    /**
     * 인증 헤더 생성
     * @returns {Object} Authorization 헤더 객체
     */
    getAuthHeaders() {
        const token = this.getToken();
        if (!token) {
            throw new Error('유효한 액세스 토큰이 없습니다. authenticate()를 먼저 호출하세요.');
        }

        return {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        };
    }

    /**
     * 토큰 만료까지 남은 시간 (초)
     * @returns {number} 남은 시간 (초), 토큰이 없으면 0
     */
    getTokenTimeToLive() {
        if (!this.tokenExpiryTime) return 0;
        const ttl = Math.max(0, Math.floor((this.tokenExpiryTime - Date.now()) / 1000));
        return ttl;
    }

    /**
     * 인증 상태 정보 반환
     * @returns {Object} 인증 상태 정보
     */
    getAuthStatus() {
        return {
            isAuthenticated: this.isAuthenticated(),
            hasToken: !!this.accessToken,
            tokenTTL: this.getTokenTimeToLive(),
            expiryTime: this.tokenExpiryTime ? new Date(this.tokenExpiryTime).toISOString() : null
        };
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
const googleSheetsAuth = new GoogleSheetsAuth();

export default googleSheetsAuth;
export { GoogleSheetsAuth };