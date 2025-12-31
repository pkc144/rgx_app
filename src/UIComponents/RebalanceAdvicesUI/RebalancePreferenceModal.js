import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import {ChevronLeft} from 'lucide-react-native';
import StepProgressBar from './StepProgressBar';

const {width, height} = Dimensions.get('window');

// Custom Checkbox
const CheckBox = ({value, onValueChange}) => (
  <TouchableOpacity
    style={[styles.checkbox, value && styles.checkboxChecked]}
    onPress={onValueChange}>
    {value && <Text style={styles.checkmark}>✓</Text>}
  </TouchableOpacity>
);

const RebalancePreferenceModal = ({
  showCheckboxModal,
  setShowCheckboxModal,
  handleConfirmPreference,
}) => {
  const [selectedOption, setSelectedOption] = useState('option1');
  const stepsData = [1, 2, 3];
  const currentStep = 1;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showCheckboxModal}
      onRequestClose={() => setShowCheckboxModal(false)}>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => setShowCheckboxModal(false)}
              style={styles.closeButton}>
              <ChevronLeft size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: 100}}>
            <StepProgressBar steps={stepsData} currentStep={currentStep} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Choose your Rebalance Preference
              </Text>
            </View>

            <View style={styles.optionsContainer}>
              {/* Option 1 */}
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => setSelectedOption('option1')}>
                <CheckBox
                  value={selectedOption === 'option1'}
                  onValueChange={() => setSelectedOption('option1')}
                />
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>
                    Rebalance only those stocks where change is more than 2% of
                    your capital
                  </Text>
                  <Text style={styles.optionSubtitle}>
                    (Skip minor changes to reduce trade brokerage cost)
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 2 */}
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => setSelectedOption('option2')}>
                <CheckBox
                  value={selectedOption === 'option2'}
                  onValueChange={() => setSelectedOption('option2')}
                />
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>
                    Rebalance everything as per new plan
                  </Text>
                  <Text style={styles.optionSubtitle}>
                    (Align fully, but may increase trade brokerage cost)
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Continue Button at Bottom */}
          <TouchableOpacity
            onPress={handleConfirmPreference}
            style={styles.confirmButton}>
            <Text style={styles.confirmButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    // justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    // height: height,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  closeButton: {
    padding: 6,
    backgroundColor: '#F2F3F4',
    borderRadius: 3,
  },
  modalHeader: {
    marginTop: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16, // ↓ smaller
    fontWeight: '600',
    color: '#2563EB',
  },
  optionsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14, // ↓ smaller
    fontWeight: '500',
    color: '#111827',
  },
  optionSubtitle: {
    fontSize: 12, // ↓ smaller
    color: '#6B7280',
    marginTop: 2,
  },
  confirmButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 14,
    backgroundColor: '#0056B7',
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 14, // ↓ smaller
    fontWeight: '600',
    color: '#fff',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#2563EB',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2563EB',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RebalancePreferenceModal;
