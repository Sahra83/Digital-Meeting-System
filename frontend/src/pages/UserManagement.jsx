import { useEffect, useState } from 'react'
import { participantApi } from '../services/api'
import UserTable from '../components/UserTable'
import UserModal from '../components/UserModal'
import AlertModal from '../components/AlertModal'
import Icon from '../components/Icon'

function UserManagement() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editUser, setEditUser] = useState(null)

  // Alert states
  const [alert, setAlert] = useState({ isOpen: false, type: 'info', title: '', message: '' })
  const [isAlertLoading, setIsAlertLoading] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [usersResult, rolesResult] = await Promise.all([
        participantApi.list(),
        participantApi.roles(),
      ])
      setUsers(usersResult.users || [])
      setRoles(rolesResult.roles || [])
    } catch (err) {
      setError(err.message)
      showAlert('error', 'Failed to load data', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const showAlert = (type, title, message, onConfirm = null, confirmText = 'OK', cancelText = 'Cancel') => {
    setAlert({
      isOpen: true,
      type,
      title,
      message,
      onConfirm: onConfirm || (() => setAlert(prev => ({ ...prev, isOpen: false }))),
      confirmText,
      cancelText
    })
  }

  const handleOpenAddModal = () => {
    setEditUser(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (user) => {
    setEditUser(user)
    setIsModalOpen(true)
  }

  const handleModalSubmit = async (formData) => {
    setSaving(true)
    try {
      if (editUser) {
        await participantApi.update(editUser.id, {
          ...formData,
          roleId: Number(formData.roleId)
        })
        showAlert('success', 'User Updated', 'The user account has been successfully updated.')
      } else {
        await participantApi.create({
          ...formData,
          roleId: Number(formData.roleId)
        })
        showAlert('success', 'User Created', 'A new user account has been successfully registered.')
      }
      
      // Small delay before closing to prevent browser extension errors
      setTimeout(() => {
        setIsModalOpen(false)
        setSaving(false)
        loadData()
      }, 100)
    } catch (err) {
      showAlert('error', 'Operation Failed', err.message)
      setSaving(false)
    }
  }

  const handleDeleteClick = async (user) => {
    setPendingDelete(user)
    try {
      const { meetings } = await participantApi.participation(user.id)
      if (meetings && meetings.length > 0) {
        const meetingList = meetings.map(m => `• ${m}`).join('\n')
        showAlert(
          'danger', 
          'Warning: Active Participation', 
          `Are you sure you want to delete ${user.fullname}?\n\nThis user is a participant in the following meeting schedule(s):\n${meetingList}\n\nThis action cannot be undone.`,
          confirmDelete,
          'Delete User'
        )
      } else {
        showAlert('danger', 'Confirm Delete', `Are you sure you want to delete ${user.fullname}? This action cannot be undone.`, confirmDelete, 'Delete User')
      }
    } catch (err) {
      showAlert('error', 'Operation Failed', 'Could not check user participation.')
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    const userId = pendingDelete.id
    console.log('[Frontend] confirmDelete started for user:', userId)
    
    setIsAlertLoading(true)
    try {
      console.log('[Frontend] Calling participantApi.remove...')
      await participantApi.remove(userId)
      console.log('[Frontend] participantApi.remove resolved')
      
      setPendingDelete(null)
      
      setTimeout(() => {
        setIsAlertLoading(false)
        showAlert('success', 'User Deleted', 'The user has been successfully removed from the system.')
        loadData()
      }, 150)
    } catch (err) {
      console.error('[Frontend] confirmDelete failed:', err)
      setIsAlertLoading(false)
      setAlert(prev => ({ ...prev, isOpen: false }))
      showAlert('error', 'Delete Failed', err.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">User Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage system access, roles, and user permissions.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800"
        >
          <Icon name="plus" className="h-5 w-5" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="rounded-3xl border border-slate-100 bg-white p-2 shadow-xl shadow-slate-200/20">
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              <p className="mt-4 text-sm font-medium text-slate-500">Fetching users...</p>
            </div>
          ) : (
            <UserTable 
              users={users} 
              onEdit={handleOpenEditModal} 
              onDelete={handleDeleteClick}
              onView={(user) => showAlert('info', 'User Details', `${user.fullname} is a ${user.role_name} registered on ${new Date(user.created_at).toLocaleDateString()}.`)}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleModalSubmit}
        roles={roles}
        editUser={editUser}
        saving={saving}
      />

      <AlertModal 
        isOpen={alert.isOpen}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={alert.onConfirm}
        onCancel={() => setAlert(prev => ({ ...prev, isOpen: false }))}
        loading={isAlertLoading}
      />
    </div>
  )
}

export default UserManagement
