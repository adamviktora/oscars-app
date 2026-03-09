// Prize calculation based on correct guesses and shortlist size
// Based on PRENOM_2_CASH.md
export function calculatePrize(correctGuesses: number, shortlistSize: number): number {
  if (correctGuesses === 5) {
    if (shortlistSize <= 10) return 10;
    if (shortlistSize <= 16) return 13;
    return 17; // 20 nominací
  }
  if (correctGuesses === 4) {
    if (shortlistSize <= 10) return 5;
    if (shortlistSize <= 16) return 6;
    return 8; // 20 nominací
  }
  if (correctGuesses === 3) {
    if (shortlistSize <= 10) return 2;
    if (shortlistSize <= 16) return 3;
    return 4; // 20 nominací
  }
  if (correctGuesses === 2) {
    if (shortlistSize >= 20) return 1;
  }
  return 0;
}
