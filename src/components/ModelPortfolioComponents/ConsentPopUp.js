import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';

const ConsentPopup = ({ isConsentPopupOpen, setIsConsentPopupOpen, handleConsentAccept }) => {
  return (
    <Modal
      visible={isConsentPopupOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setIsConsentPopupOpen(false)}
    >
      {/* Semi-transparent background */}
      <View style={styles.overlay} />

      {/* Centered popup */}
      <View style={styles.container}>
        <View style={styles.popup}>
          <Text style={styles.title}>Consent Required</Text>
          <Text style={styles.message}>
            By clicking to view performance, I understand that historical
            performance data is NOT a promise of future returns. For new
            portfolio, data would be limited and will not show CAGR.
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setIsConsentPopupOpen(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.agreeButton]}
              onPress={handleConsentAccept}
            >
              <Text style={styles.agreeButtonText}>I Agree</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 50,
  },
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  popup: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  message: {
    fontSize: 14,
    color: '#333',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#E5E5E5',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  agreeButton: {
    backgroundColor: '#2056DF',
  },
  agreeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ConsentPopup;
