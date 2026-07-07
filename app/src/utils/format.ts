export function formatDate(value?: string) {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatTime(value?: string) {
  if (!value) return '';
  return value.slice(0, 5);
}

export function displayName(user?: { fullname?: string; username?: string; email?: string } | null) {
  return user?.fullname || user?.username || user?.email || 'User';
}

export function getRoleName(user?: { role_name?: string; role?: string } | null) {
  return user?.role_name || user?.role || '';
}

export function isAdmin(user?: { role_name?: string; role?: string } | null) {
  return getRoleName(user).toLowerCase() === 'admin';
}
