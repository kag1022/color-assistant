/**
 * WCAG 2.1 に準拠して相対輝度を計算し、
 * 背景色に対してコントラスト比が確保できるテキスト色（黒か白）を返します。
 * 
 * @param hex 16進数のカラーコード（例: "#FF0000" または "FF0000"）
 * @returns コントラストを確保できるテキスト色 ("#000000" または "#FFFFFF")
 */
export function getContrastTextColor(hex: string): string {
    const cleanHex = hex.replace('#', '');

    if (cleanHex.length !== 6) {
        return '#000000'; // fallback
    }

    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    // sRGBに正規化
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;

    // ガンマ補正を解いて線形な輝度値へ変換 (sRGB to linear RGB)
    const R = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const G = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const B = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    // 相対輝度の計算
    const L = 0.2126 * R + 0.7152 * G + 0.0722 * B;

    // 輝度のしきい値(0.179)で判断。明るい場合は黒文字、暗い場合は白文字
    return L > 0.179 ? '#000000' : '#FFFFFF';
}
