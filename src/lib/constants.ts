export const REGISTRATION_OPEN = false;

export const ORDERING_PAGE_LABEL = 'Seřadit TOP filmy';

// Admin emails - only these users can access admin pages
export const ADMIN_EMAILS = [
  'dr.sz@email.cz',
  'viktora.adam@gmail.com',
  'robinzon@skaut.cz',
];

export function isAdmin(email?: string): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}
