/**
 * Ordem canônica dos cursos no site: MIM, Roteiro Viral, H.P.A.
 * Usar em listagens e perfis para exibir sempre na mesma ordem.
 */
export const COURSE_ORDER_KIWIFY_IDS = [
  'AQDrLac', // Método Influência MILIONÁRIA
  'YIUXqzV', // Roteiro Viral
  '96dk0GP', // H.P.A. - Hackeando Passagens Aéreas
] as const;

export type CourseKiwifyId = (typeof COURSE_ORDER_KIWIFY_IDS)[number];

/** Lista de cursos na ordem oficial (id Kiwify, label, link de compra) */
export const CURSOS = [
  {
    id: 'AQDrLac' as const,
    label: 'Método Influência MILIONÁRIA',
    kiwifyUrl: 'https://pay.kiwify.com.br/AQDrLac?afid=9QWG5v3v',
  },
  {
    id: 'YIUXqzV' as const,
    label: 'Roteiro Viral',
    kiwifyUrl: 'https://pay.kiwify.com.br/YIUXqzV?afid=Bjgtq25N',
  },
  {
    id: '96dk0GP' as const,
    label: 'Hackeando Passagens Aéreas',
    kiwifyUrl: 'https://pay.kiwify.com.br/96dk0GP?afid=hRhsqA6j',
  },
];

/** Ordena um array de IDs de curso pela ordem canônica. */
export function sortCourseIds(ids: string[]): string[] {
  const order: string[] = [...COURSE_ORDER_KIWIFY_IDS];
  return [...ids].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}
