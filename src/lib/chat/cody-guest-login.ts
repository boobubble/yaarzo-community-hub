/** CodyChat guest login uses `gbirth` as YYYY-MM-DD (see login.php / guest_login.php). */
export function codyGuestBirthDateForAgeConfirmation(confirmed14Plus: boolean) {
  if (!confirmed14Plus) return "";
  const year = new Date().getFullYear() - 18;
  return `${year}-01-15`;
}
