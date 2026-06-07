import Icon from './Icon'

function UserTable({ users, onEdit, onDelete, onView }) {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Icon name="users" className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-900">No users found</h3>
        <p className="mt-1 text-sm text-slate-500">Try adding a new user to see them here.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="pb-4 pt-2 text-xs font-bold uppercase tracking-wider text-slate-400">Full Name</th>
            <th className="pb-4 pt-2 text-xs font-bold uppercase tracking-wider text-slate-400">Username</th>
            <th className="pb-4 pt-2 text-xs font-bold uppercase tracking-wider text-slate-400">Role</th>
            <th className="hidden pb-4 pt-2 text-xs font-bold uppercase tracking-wider text-slate-400 sm:table-cell">Contact</th>
            <th className="hidden pb-4 pt-2 text-xs font-bold uppercase tracking-wider text-slate-400 md:table-cell">Joined</th>
            <th className="pb-4 pt-2 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((user) => (
            <tr key={user.id} className="group transition-colors hover:bg-slate-50/50">
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                    {user.fullname.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-900">{user.fullname}</span>
                </div>
              </td>
              <td className="py-4">
                <span className="text-sm font-medium text-slate-600">@{user.username}</span>
              </td>
              <td className="py-4">
                <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${
                  user.role_name === 'Admin' 
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {user.role_name}
                </span>
              </td>
              <td className="hidden py-4 sm:table-cell">
                <div className="text-xs">
                  <p className="text-slate-600">{user.email || 'No email'}</p>
                  <p className="mt-0.5 text-slate-400">{user.phone || 'No phone'}</p>
                </div>
              </td>
              <td className="hidden py-4 text-xs font-medium text-slate-500 md:table-cell">
                {new Date(user.created_at).toLocaleDateString()}
              </td>
              <td className="py-4 text-right">
                <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button 
                    onClick={() => onView(user)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                    title="View Details"
                  >
                    <Icon name="eye" className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => onEdit(user)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                    title="Edit User"
                  >
                    <Icon name="edit" className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => onDelete(user)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                    title="Delete User"
                  >
                    <Icon name="delete" className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default UserTable
