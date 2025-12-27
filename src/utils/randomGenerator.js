/**
 * 오늘 날짜를 시드로 하여 4자리 랜덤 숫자를 생성하는 함수
 * 같은 날에는 항상 동일한 숫자가 생성됨
 * @returns {string} 4자리 숫자 문자열
 */
export const generateDailyCode = () => {
    // 오늘 날짜를 YYYYMMDD 형태로 변환
    const today = new Date();
    const dateString = today.getFullYear().toString() +
        (today.getMonth() + 1).toString().padStart(2, '0') +
        today.getDate().toString().padStart(2, '0');

    // 날짜 문자열을 시드로 사용하여 pseudorandom 생성
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
        const char = dateString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 32비트 정수로 변환
    }

    // 절댓값을 취하고 4자리로 맞춤
    const randomNum = Math.abs(hash) % 10000;
    return randomNum.toString().padStart(4, '0');
};