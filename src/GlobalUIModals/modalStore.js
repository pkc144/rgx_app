import { create } from 'zustand';

const useModalStore = create((set) => ({
  visibleModal: null,
  showBrokerModal: false,

  openModal: (modalName) =>
    set({ visibleModal: modalName, showBrokerModal: true }),

  closeModal: () =>
    set({ visibleModal: null, showBrokerModal: false }),

  setShowBrokerModal: (value) => set({ showBrokerModal: value }),
}));

export default useModalStore;
