import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { ModalConfig, ModalStore } from '@/types'

export const useModalStore = create<ModalStore>()(
  subscribeWithSelector((set, get) => ({
    modals: [],

    openModal: (config: ModalConfig) => {
      set((state) => ({
        modals: [...state.modals, config],
      }))
    },

    closeModal: (id: string) => {
      set((state) => ({
        modals: state.modals.filter((modal) => modal.id !== id),
      }))
    },

    closeAllModals: () => {
      set({ modals: [] })
    },

    updateModal: (id: string, updates: Partial<ModalConfig>) => {
      set((state) => ({
        modals: state.modals.map((modal) =>
          modal.id === id ? { ...modal, ...updates } : modal
        ),
      }))
    },

    getModal: (id: string) => {
      return get().modals.find((modal) => modal.id === id)
    },

    isModalOpen: (id: string) => {
      return get().modals.some((modal) => modal.id === id)
    },

    getTopModal: () => {
      const modals = get().modals
      return modals[modals.length - 1]
    },
  }))
)

// Modal helper functions
export const modalHelpers = {
  // Create a modal with default configuration
  createModal: (
    id: string,
    title: string,
    content: React.ReactNode,
    options?: Partial<ModalConfig>
  ): ModalConfig => ({
    id,
    title,
    content,
    size: 'md',
    showClose: true,
    ...options,
  }),

  // Create a confirmation modal
  createConfirmModal: (
    id: string,
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): ModalConfig => ({
    id,
    title,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">{message}</p>
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
          >
            Confirm
          </button>
        </div>
      </div>
    ),
    size: 'sm',
    showClose: false,
  }),

  // Create a form modal
  createFormModal: (
    id: string,
    title: string,
    formContent: React.ReactNode,
    onSubmit?: () => void,
    onCancel?: () => void
  ): ModalConfig => ({
    id,
    title,
    content: (
      <div className="space-y-4">
        {formContent}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          {onSubmit && (
            <button
              onClick={onSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Submit
            </button>
          )}
        </div>
      </div>
    ),
    size: 'lg',
    showClose: true,
  }),

  // Create a loading modal
  createLoadingModal: (id: string, message: string = 'Loading...'): ModalConfig => ({
    id,
    title: 'Loading',
    content: (
      <div className="flex items-center justify-center space-x-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    ),
    size: 'sm',
    showClose: false,
  }),

  // Create an error modal
  createErrorModal: (
    id: string,
    title: string,
    error: string,
    onClose?: () => void
  ): ModalConfig => ({
    id,
    title,
    content: (
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </div>
        {onClose && (
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        )}
      </div>
    ),
    size: 'md',
    showClose: true,
  }),

  // Create a success modal
  createSuccessModal: (
    id: string,
    title: string,
    message: string,
    onClose?: () => void
  ): ModalConfig => ({
    id,
    title,
    content: (
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>
        {onClose && (
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    ),
    size: 'md',
    showClose: true,
  }),

  // Create a delete confirmation modal
  createDeleteModal: (
    id: string,
    itemName: string,
    onDelete: () => void,
    onCancel?: () => void
  ): ModalConfig => ({
    id,
    title: 'Confirm Delete',
    content: (
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Delete {itemName}</h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this {itemName.toLowerCase()}? This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onDelete}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    ),
    size: 'md',
    showClose: true,
  }),

  // Create a details modal
  createDetailsModal: (
    id: string,
    title: string,
    details: Record<string, any>,
    onEdit?: () => void,
    onDelete?: () => void
  ): ModalConfig => ({
    id,
    title,
    content: (
      <div className="space-y-4">
        <div className="space-y-3">
          {Object.entries(details).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="font-medium text-gray-700 capitalize">
                {key.replace(/_/g, ' ')}:
              </span>
              <span className="text-gray-900">{String(value)}</span>
            </div>
          ))}
        </div>
        {(onEdit || onDelete) && (
          <div className="flex justify-end space-x-3 pt-4 border-t">
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-md hover:bg-blue-50"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    ),
    size: 'lg',
    showClose: true,
  }),
}

// Modal hooks for common patterns
export const useModal = () => {
  const { openModal, closeModal, closeAllModals, getModal, isModalOpen } = useModalStore()

  return {
    openModal,
    closeModal,
    closeAllModals,
    getModal,
    isModalOpen,
    helpers: modalHelpers,
  }
}

// Specific modal hooks
export const useConfirmModal = () => {
  const { openModal, closeModal } = useModalStore()

  const confirm = (message: string, onConfirm: () => void, onCancel?: () => void) => {
    const id = `confirm-${Date.now()}`
    const modal = modalHelpers.createConfirmModal(id, 'Confirm Action', message, () => {
      closeModal(id)
      onConfirm()
    }, () => {
      closeModal(id)
      onCancel?.()
    })
    openModal(modal)
  }

  return { confirm }
}

export const useDeleteModal = () => {
  const { openModal, closeModal } = useModalStore()

  const confirmDelete = (itemName: string, onDelete: () => void, onCancel?: () => void) => {
    const id = `delete-${Date.now()}`
    const modal = modalHelpers.createDeleteModal(itemName, () => {
      closeModal(id)
      onDelete()
    }, () => {
      closeModal(id)
      onCancel?.()
    })
    openModal(modal)
  }

  return { confirmDelete }
}

export const useLoadingModal = () => {
  const { openModal, closeModal } = useModalStore()

  const showLoading = (message?: string) => {
    const id = `loading-${Date.now()}`
    const modal = modalHelpers.createLoadingModal(id, message)
    openModal(modal)
    return id
  }

  const hideLoading = (id: string) => {
    closeModal(id)
  }

  return { showLoading, hideLoading }
}

export const useErrorModal = () => {
  const { openModal, closeModal } = useModalStore()

  const showError = (title: string, error: string, onClose?: () => void) => {
    const id = `error-${Date.now()}`
    const modal = modalHelpers.createErrorModal(id, title, error, () => {
      closeModal(id)
      onClose?.()
    })
    openModal(modal)
  }

  return { showError }
}

export const useSuccessModal = () => {
  const { openModal, closeModal } = useModalStore()

  const showSuccess = (title: string, message: string, onClose?: () => void) => {
    const id = `success-${Date.now()}`
    const modal = modalHelpers.createSuccessModal(id, title, message, () => {
      closeModal(id)
      onClose?.()
    })
    openModal(modal)
  }

  return { showSuccess }
}