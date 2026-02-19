/**
 * Data de lançamento do Chat com IA (08/03).
 * Até essa data, o chat e o histórico de conversas não estão acessíveis.
 */
export const CHAT_LAUNCH_DATE = new Date(
  new Date().getFullYear(),
  2,
  8
); // 08/03 (mês 2 = março)

export function isChatLaunched(): boolean {
  return new Date() >= CHAT_LAUNCH_DATE;
}
