import Icon from './Icon'

function AlertModal({ 
  isOpen, 
  type = 'info', 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'OK', 
  cancelText = 'Cancel',
  loading = false
}) {
  if (!isOpen) return null

  const configs = {
    success: {
      icon: 'check',
      iconClass: 'bg-emerald-100 text-emerald-600',
      btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    error: {
      icon: 'close',
      iconClass: 'bg-red-100 text-red-600',
      btnClass: 'bg-red-600 hover:bg-red-700 text-white',
    },
    danger: {
      icon: 'alert',
      iconClass: 'bg-red-100 text-red-600',
      btnClass: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: 'alert',
      iconClass: 'bg-amber-100 text-amber-600',
      btnClass: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    confirmation: {
      icon: 'info',
      iconClass: 'bg-blue-100 text-blue-600',
      btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    info: {
      icon: 'info',
      iconClass: 'bg-blue-100 text-blue-600',
      btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  }

  const config = configs[type] || configs.info

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300" 
        onClick={() => !loading && onCancel()}
      />
      <div className="relative w-full max-w-md scale-100 transform overflow-hidden rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-slate-900/5">
        <div className="flex flex-col items-center text-center">
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${config.iconClass} mb-6 shadow-sm`}>
            {loading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent" />
            ) : (
              <Icon name={config.icon} className="h-9 w-9" />
            )}
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-500 whitespace-pre-line">
            {message}
          </p>
        </div>

        <div className="mt-10 flex gap-4">
          {(type === 'confirmation' || type === 'danger') && (
            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={(e) => {
              e.stopPropagation();
              console.log('[AlertModal] Confirm button clicked');
              onConfirm();
            }}
            className={`flex-1 rounded-2xl py-3 text-sm font-bold transition-all shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${config.btnClass}`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
export default AlertModal
