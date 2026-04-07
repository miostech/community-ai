/** Perfil mínimo da marca para criar campanha (logo + texto para creators). */
export function isBrandProfileComplete(a: {
    brand_logo_url?: string | null;
    brand_description?: string | null;
}): boolean {
    const logo = a.brand_logo_url?.trim();
    const desc = a.brand_description?.trim() ?? '';
    return Boolean(logo && desc.length >= 20);
}
