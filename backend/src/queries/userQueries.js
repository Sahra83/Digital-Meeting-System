const userSelect = `
  SELECT
    u.id,
    u.fullname,
    u.username,
    u.email,
    u.phone,
    u.role_id,
    r.role_name,
    CASE
      WHEN lower(r.role_name) = 'participant' THEN 'participant'
      ELSE 'admin'
    END AS portal,
    CASE
      WHEN lower(r.role_name) = 'participant' THEN '/participant/dashboard'
      ELSE '/dashboard/overview'
    END AS default_path,
    u.status,
    u.created_at,
    u.updated_at
  FROM users u
  JOIN roles r ON r.id = u.role_id
`;

module.exports = {
  userSelect,
  findByEmail: `${userSelect} WHERE lower(u.email) = lower($1)`,
  findByUsername: `${userSelect} WHERE lower(u.username) = lower($1)`,
  findById: `${userSelect} WHERE u.id = $1`,
  listUsers: `${userSelect} ORDER BY u.created_at DESC`,
  listRoles: 'SELECT id, role_name, created_at FROM roles ORDER BY id',
};
