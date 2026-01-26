import { create } from 'zustand';
import eventEmitter from '../components/EventEmitter';

const useModalStore = create((set) => ({
  visibleModal: null,
  showBrokerModal: false,

  // Alert modal state
  alertVisible: false,
  alertType: 'error', // 'error', 'success', 'warning', 'info'
  alertTitle: '',
  alertMessage: '',

  openModal: (modalName) => {
    // Emit event to close any other modals (like RebalancePreferenceModal)
    eventEmitter.emit('closeBrokerRelatedModals');
    set({ visibleModal: modalName, showBrokerModal: true });
  },

  closeModal: () =>
    set({ visibleModal: null, showBrokerModal: false }),

  setShowBrokerModal: (value) => set({ showBrokerModal: value }),

  // Alert modal actions
  showAlert: (type, title, message) =>
    set({ alertVisible: true, alertType: type, alertTitle: title, alertMessage: message }),

  hideAlert: () =>
    set({ alertVisible: false, alertType: 'error', alertTitle: '', alertMessage: '' }),
}));

export default useModalStore;
