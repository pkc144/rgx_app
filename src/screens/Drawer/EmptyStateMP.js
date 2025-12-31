// EmptyStateInfo.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Lock } from 'lucide-react-native';

const EmptyStateInfoMP = ({ 
  title = 'Premium Access Required', 
  subtitle = 'Purchase this plan to view all distributions and unlock advanced insights.',
}) => {
  return (
    <View style={styles.container}>
      <Lock size={60} color="#0056B7" style={styles.icon} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: 'transparent', // subtle background
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#002651',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#606060',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default EmptyStateInfoMP;
