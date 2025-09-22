import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AthleteProfile, TestAttempt } from '../../lib/sanity/types';

interface AthleteProfileModalProps {
  visible: boolean;
  athlete: AthleteProfile | null;
  attempts: TestAttempt[];
  onClose: () => void;
}

export default function AthleteProfileModal({
  visible,
  athlete,
  attempts,
  onClose,
}: AthleteProfileModalProps) {
  if (!athlete) return null;

  const calculateBMI = (height: number, weight: number) => {
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const getBMIStatus = (bmi: number) => {
    if (bmi < 18.5) return { status: 'Underweight', color: '#3B82F6' };
    if (bmi < 25) return { status: 'Normal', color: '#10B981' };
    if (bmi < 30) return { status: 'Overweight', color: '#F59E0B' };
    return { status: 'Obese', color: '#EF4444' };
  };

  const bmi = calculateBMI(athlete.height, athlete.weight);
  const bmiStatus = getBMIStatus(parseFloat(bmi));

  const getAttemptStatusIcon = (status: string) => {
    switch (status) {
      case 'in-progress': return 'time-outline';
      case 'done': return 'checkmark-circle-outline';
      case 'failed': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const getAttemptStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress': return '#F59E0B';
      case 'done': return '#10B981';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Athlete Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{athlete.name}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Age</Text>
                <Text style={styles.infoValue}>{athlete.age} years</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Gender</Text>
                <Text style={styles.infoValue}>{athlete.gender}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Sport</Text>
                <Text style={styles.infoValue}>{athlete.sport}</Text>
              </View>
            </View>
          </View>

          {/* Physical Measurements */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Physical Measurements</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Height</Text>
                <Text style={styles.infoValue}>{athlete.height} cm</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Weight</Text>
                <Text style={styles.infoValue}>{athlete.weight} kg</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>BMI</Text>
                <View style={styles.bmiContainer}>
                  <Text style={styles.infoValue}>{bmi}</Text>
                  <Text style={[styles.bmiStatus, { color: bmiStatus.color }]}>
                    {bmiStatus.status}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>City</Text>
                <Text style={styles.infoValue}>{athlete.city}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Contact</Text>
                <Text style={styles.infoValue}>{athlete.contact}</Text>
              </View>
            </View>
          </View>

          {/* Test Attempts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test Attempts ({attempts.length})</Text>
            
            {attempts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="fitness-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>No test attempts yet</Text>
              </View>
            ) : (
              attempts.map((attempt) => (
                <View key={attempt._id} style={styles.attemptCard}>
                  <View style={styles.attemptHeader}>
                    <View style={styles.attemptInfo}>
                      <Text style={styles.attemptTitle}>{attempt.testType}</Text>
                      <Text style={styles.attemptDate}>
                        {new Date(attempt.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.attemptStatus}>
                      <Ionicons
                        name={getAttemptStatusIcon(attempt.status)}
                        size={20}
                        color={getAttemptStatusColor(attempt.status)}
                      />
                      <Text style={[styles.statusText, { color: getAttemptStatusColor(attempt.status) }]}>
                        {attempt.status}
                      </Text>
                    </View>
                  </View>

                  {attempt.score !== undefined && (
                    <View style={styles.scoreContainer}>
                      <Text style={styles.scoreLabel}>Score:</Text>
                      <Text style={styles.scoreValue}>{attempt.score}/100</Text>
                    </View>
                  )}

                  {attempt.remarks && (
                    <View style={styles.remarksContainer}>
                      <Text style={styles.remarksLabel}>Remarks:</Text>
                      <Text style={styles.remarksText}>{attempt.remarks}</Text>
                    </View>
                  )}

                  {attempt.assessedAt && (
                    <Text style={styles.assessedDate}>
                      Assessed on: {new Date(attempt.assessedAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>

          {/* Registration Date */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Registration</Text>
            <Text style={styles.registrationDate}>
              Registered on: {new Date(athlete.createdAt || '').toLocaleDateString()}
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  bmiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bmiStatus: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  attemptCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  attemptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  attemptInfo: {
    flex: 1,
  },
  attemptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  attemptDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  attemptStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginRight: 8,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  remarksContainer: {
    marginBottom: 8,
  },
  remarksLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  remarksText: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  assessedDate: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  registrationDate: {
    fontSize: 14,
    color: '#6B7280',
  },
});
