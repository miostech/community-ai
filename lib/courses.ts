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

/**
 * Lista de cursos na ordem oficial.
 * - kiwifyUrl: link COM afid — botão "Comprar" quando a pessoa NÃO comprou.
 * - kiwifyProductIds: IDs do produto na Kiwify (podem ser slugs ou UUID); a API pode retornar qualquer um para dar match.
 */
export const CURSOS = [
  {
    id: 'AQDrLac' as const,
    label: 'Método Influência MILIONÁRIA',
    kiwifyUrl: 'https://pay.kiwify.com.br/AQDrLac?afid=10z1btuv',
    kiwifyProductIds: [
      'b28b7a90-b4cf-11ef-9456-6daddced3267',
      '6683aa80-bb2e-11f0-a386-7f084bbfb234',
      '92ff3db0-b1ea-11f0-8ead-2342e472677a',
      '0pZo7Fz',
      'sXB7hnD',
      '66c42290-49a6-41d6-95e1-2d62c37f0078',
    ],
  },
  {
    id: 'YIUXqzV' as const,
    label: 'Roteiro Viral',
    kiwifyUrl: 'https://pay.kiwify.com.br/YIUXqzV?afid=kq3Wqjlq',
    kiwifyProductIds: [
      '080a7190-ae0f-11f0-84ca-83ece070bd1d',
      'YIUXqzV',
      '8b89b9db-3ff5-42ef-9abd-52a655725a84',
    ],
  },
  {
    id: '96dk0GP' as const,
    label: 'Hackeando Passagens Aéreas',
    kiwifyUrl: 'https://pay.kiwify.com.br/96dk0GP?afid=rXWOYDG7',
    kiwifyProductIds: [
      'c6547980-bb2e-11f0-8751-cd4e443e2330',
      '97204820-d3e9-11ee-b35b-a7756e800fa3',
      'b1d89730-3533-11ee-84fd-bdb8d3fd9bc7',
      'yjHjvnY',
      'cGQaf5s',
      '0c193809-a695-4f39-bc7b-b4e2794274a9',
    ],
  },
];

/** IDs (slug ou UUID) → label para exibição */
export const COURSE_LABEL_BY_PRODUCT_ID: Record<string, string> = {
  '66c42290-49a6-41d6-95e1-2d62c37f0078': 'Método Influência MILIONÁRIA',
  '8b89b9db-3ff5-42ef-9abd-52a655725a84': 'Roteiro Viral',
  '0c193809-a695-4f39-bc7b-b4e2794274a9': 'H.P.A',
  '0pZo7Fz': 'M.I.M',
  sXB7hnD: 'M.I.M',
  'b28b7a90-b4cf-11ef-9456-6daddced3267': 'M.I.M',
  '6683aa80-bb2e-11f0-a386-7f084bbfb234': 'M.I.M',
  '92ff3db0-b1ea-11f0-8ead-2342e472677a': 'M.I.M',
  YIUXqzV: 'Roteiro Viral',
  '080a7190-ae0f-11f0-84ca-83ece070bd1d': 'Roteiro Viral',
  yjHjvnY: 'H.P.A',
  cGQaf5s: 'H.P.A',
  'c6547980-bb2e-11f0-8751-cd4e443e2330': 'H.P.A',
  '97204820-d3e9-11ee-b35b-a7756e800fa3': 'H.P.A',
  'b1d89730-3533-11ee-84fd-bdb8d3fd9bc7': 'H.P.A',
  AQDrLac: 'M.I.M',
  '96dk0GP': 'H.P.A',
};

/** Slug → label (compatibilidade) */
const COURSE_LABEL_BY_SLUG: Record<string, string> = {
  AQDrLac: 'M.I.M',
  YIUXqzV: 'Roteiro Viral',
  '96dk0GP': 'H.P.A',
  yjHjvnY: 'H.P.A',
  cGQaf5s: 'H.P.A',
  '0pZo7Fz': 'M.I.M',
  sXB7hnD: 'M.I.M',
};

/** Retorna o label do curso a partir do id (slug ou UUID da API). */
export function getCourseLabel(id: string): string | undefined {
  return COURSE_LABEL_BY_PRODUCT_ID[id] ?? COURSE_LABEL_BY_SLUG[id];
}

/** Verifica se a lista de IDs (da API) inclui algum ID deste curso (slug ou UUID). */
export function courseIdsIncludeCourse(
  availableIds: string[],
  course: { kiwifyProductIds?: string[]; kiwifyUrl?: string }
): boolean {
  if (course.kiwifyProductIds?.some((id) => availableIds.includes(id))) return true;
  if (course.kiwifyUrl) {
    try {
      const slug = new URL(course.kiwifyUrl).pathname.replace(/^\//, '').split('/')[0]?.trim() ?? '';
      if (slug && availableIds.includes(slug)) return true;
    } catch {}
  }
  return false;
}

/** Ordena um array de IDs de curso pela ordem canônica (aceita slug ou UUID). */
export function sortCourseIds(ids: string[]): string[] {
  const slugOrder: string[] = [...COURSE_ORDER_KIWIFY_IDS];
  const uuidToSlug: Record<string, string> = {};
  CURSOS.forEach((c) => {
    c.kiwifyProductIds?.forEach((id) => (uuidToSlug[id] = c.id));
  });
  return [...ids].sort((a, b) => {
    const slugA = uuidToSlug[a] ?? a;
    const slugB = uuidToSlug[b] ?? b;
    return slugOrder.indexOf(slugA) - slugOrder.indexOf(slugB);
  });
}
