/**
 * Lista de termos para moderação automática de comentários.
 * Comentários que contiverem algum termo ficam ocultos até um moderador aprovar.
 * Palavras em minúsculo; a checagem é feita com texto normalizado (sem acentos, minúsculo).
 * Adicione aqui termos racistas, xenófobos, de ódio, etc.
 */
const BAD_WORDS: string[] = [
    // Racismo
    'preto noia',
    'crioulo',
    'macaco',
    'negao',
    'negrao',
    'neguinho',
    'negro noia',
    'raça inferior',
    'sub-raça',
    // Xenofobia / ódio
    'volta pro seu pais',
    'volta pra sua terra',
    'estrangeiro nojento',
    'mata judeu',
    'mata preto',
    'mata gay',
    'morte aos',
    'matar judeu',
    'matar preto',
    'matar gay',
    'odeio judeu',
    'odeio preto',
    'odeio gay',
    'odeio negro',
    // Homofobia / transfobia
    'viado',
    'baitola',
    'traveco',
    'sapatão',
    'sapatao',
    'mata trans',
    'mata lgbt',
    // Ódio / ofensas graves (exemplos; expandir conforme necessidade)
    'todo mundo odeia',
    'deveria morrer',
    'merece morrer',
    'queima na fogueira',

    /** COMUNIDADE */
    'merda',
    'porra',
    'foda-se',
    'fodase',
    'fodido',
    'mentirosos',
    'mentirosa',
    'mentiroso',
    'golpista',
    'golpe',
    'puta',
    'rouba marido',
    'vagabunda',
    'amante',
    

    
];

function normalizeForComparison(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/\s+/g, ' ');
}

/**
 * Retorna true se o texto contiver algum termo proibido (comentário deve ficar pendente de moderação).
 */
export function commentNeedsModeration(content: string): boolean {
    if (!content || typeof content !== 'string') return false;
    const normalized = normalizeForComparison(content.trim());
    for (const term of BAD_WORDS) {
        if (term.length < 3) continue;
        const termNorm = normalizeForComparison(term);
        if (normalized.includes(termNorm)) return true;
    }
    return false;
}
