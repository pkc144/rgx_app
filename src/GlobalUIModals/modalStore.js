import { create } from 'zustand';
import eventEmitter from '../components/EventEmitter';

const useModalStore = create((set) => ({
  visibleModal: null,
  showBrokerModal: false,

  openModal: (modalName) => {
    // Emit event to close any other modals (like RebalancePreferenceModal)
    eventEmitter.emit('closeBrokerRelatedModals');
    set({ visibleModal: modalName, showBrokerModal: true });
  },

  closeModal: () =>
    set({ visibleModal: null, showBrokerModal: false }),

  setShowBrokerModal: (value) => set({ showBrokerModal: value }),
}));

export default useModalStore;
