import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';

import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import uuid from 'react-native-uuid';
import { insertProject, getAllClients, insertClient } from '@/database/database';
import { Client } from '@/types';

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'proposal',  label: 'Proposal',  dot: '#F59E0B' },
  { value: 'active',    label: 'Active',    dot: '#10B981' },
  { value: 'on_hold',   label: 'On Hold',   dot: '#EF4444' },
  { value: 'completed', label: 'Completed', dot: '#3B82F6' },
];

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Low',    dot: '#10B981' },
  { value: 'medium', label: 'Medium', dot: '#F59E0B' },
  { value: 'high',   label: 'High',   dot: '#F97316' },
  { value: 'urgent', label: 'Urgent', dot: '#EF4444' },
];

// ─── Reusable field components ────────────────────────────────────────────────
function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <View className="flex-row items-center mb-1.5 gap-1">
      <Text className="text-gray-700 text-sm font-medium">{label}</Text>
      {required && <Text className="text-red-500 text-sm font-bold">*</Text>}
    </View>
  );
}

function StyledInput({ ...props }: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-5 text-gray-900 text-sm"
      placeholderTextColor="#94A3B8"
      {...props}
    />
  );
}

// Segmented toggle for small option sets
function SegmentedPicker<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; label: string; dot: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2 mb-5">
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            className={`flex-row items-center rounded-xl px-3.5 py-2.5 border gap-2 ${
              active ? 'border-transparent' : 'bg-gray-50 border-gray-200'
            }`}
            style={active ? { backgroundColor: opt.dot + '22', borderColor: opt.dot } : {}}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.75}
          >
            <View
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: active ? opt.dot : '#94A3B8' }}
            />
            <Text
              className="text-sm font-medium"
              style={{ color: active ? opt.dot : '#64748B' }}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AddProjectScreen() {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [clientId,    setClientId]    = useState('');
  const [budget,      setBudget]      = useState('');
  const [status,      setStatus]      = useState('proposal');
  const [priority,    setPriority]    = useState('medium');
  const [clients,     setClients]     = useState<Client[]>([]);

  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientFullName, setNewClientFullName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newClientNotes, setNewClientNotes] = useState('');


  useEffect(() => {
    getAllClients().then(setClients);
  }, []);

  const refreshClients = async () => {
    const list = await getAllClients();
    setClients(list);
    return list;
  };

  const handleAddClient = async () => {
    const fullName = newClientFullName.trim();
    const phoneNumber = newClientPhone.trim();
    if (!fullName) return Alert.alert('Error', 'Client name is required');
    if (!phoneNumber) return Alert.alert('Error', 'Client phone number is required');

    try {
      await insertClient({
        id: uuid.v4() as string,
        full_name: fullName,
        phone_number: phoneNumber,
        email: newClientEmail.trim() ? newClientEmail.trim() : null,
        address: newClientAddress.trim() ? newClientAddress.trim() : null,
        notes: newClientNotes.trim() ? newClientNotes.trim() : null,
      } as any);

      const list = await refreshClients();
      const created = list.find(c => c.full_name === fullName && c.phone_number === phoneNumber) ?? null;
      setClientId(created?.id ?? '');

      setShowAddClient(false);
      setNewClientFullName('');
      setNewClientPhone('');
      setNewClientEmail('');
      setNewClientAddress('');
      setNewClientNotes('');

      Alert.alert('Success', 'Client created successfully');
    } catch {
      Alert.alert('Error', 'Failed to create client');
    }
  };

  const handleSave = async () => {
    if (!projectName.trim()) return Alert.alert('Error', 'Please enter a project name');
    if (!clientId) return Alert.alert('Error', 'Please select a client');
    if (!budget || parseFloat(budget) <= 0) return Alert.alert('Error', 'Please enter a valid budget');

    try {
      await insertProject({
        id: uuid.v4() as string,
        project_name: projectName,
        description: description || '',
        client_id: clientId,
        engineer_id: null,
        budget: parseFloat(budget),
        status: status as any,
        priority: priority as any,
        start_date: null,
        expected_end_date: null,
        actual_end_date: null,
        address: null,
        notes: null,
      });
      Alert.alert('Success', 'Project created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to create project');
    }
  };

  return (
    <>
      <Modal
        visible={showAddClient}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddClient(false)}
      >
        <View className="flex-1 bg-black/40 justify-center p-5">
          <View className="bg-white rounded-2xl border border-border overflow-hidden">
            <View className="flex-row items-center justify-between px-4 py-3 bg-primary/10 border-b border-border">
              <Text className="text-foreground font-black text-base">Add Client</Text>
              <TouchableOpacity onPress={() => setShowAddClient(false)} className="px-2 py-1">
                <Ionicons name="close" size={20} color="#5C5A72" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
              <FieldLabel label="Full Name" required />
              <StyledInput
                placeholder="e.g. John Kamau"
                value={newClientFullName}
                onChangeText={setNewClientFullName}
              />

              <FieldLabel label="Phone Number" required />
              <StyledInput
                placeholder="e.g. 0712 345 678"
                keyboardType="phone-pad"
                value={newClientPhone}
                onChangeText={setNewClientPhone}
              />

              <FieldLabel label="Email" />
              <StyledInput
                placeholder="client@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={newClientEmail}
                onChangeText={setNewClientEmail}
              />

              <FieldLabel label="Address" />
              <StyledInput
                placeholder="e.g. Westlands, Nairobi"
                value={newClientAddress}
                onChangeText={setNewClientAddress}
              />

              <FieldLabel label="Notes" />
              <StyledInput
                placeholder="Any additional notes…"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={newClientNotes}
                onChangeText={setNewClientNotes}
                style={{ minHeight: 96 }}
              />

              <View className="flex-row gap-3 mt-2">
                <TouchableOpacity
                  className="flex-1 bg-card border border-border rounded-xl py-4 flex-row justify-center items-center gap-2"
                  activeOpacity={0.85}
                  onPress={() => setShowAddClient(false)}
                >
                  <Ionicons name="close-outline" size={18} color="#5C5A72" />
                  <Text className="text-foreground font-bold">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 bg-primary rounded-xl py-4 flex-row justify-center items-center gap-2"
                  activeOpacity={0.85}
                  onPress={handleAddClient}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="white" />
                  <Text className="text-white font-bold">Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View className="flex-row justify-between bg-primary/10 border-b border-primary/30 rounded-b-3xl pt-12 pb-4 px-5">
        <TouchableOpacity
          className="flex-row items-center gap-1.5 mb-4 self-start"
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={18} color="#1E3A5F" />
          <Text className="text-primary text-sm font-semibold">Back</Text>
        </TouchableOpacity>

        <View>
          <Text className="text-gray-900 text-2xl font-bold tracking-tight">
            Create Project
          </Text>
        </View>
        <View/>
      </View>

      <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-12 pt-4">

          {/* ── Basic Info ── */}
          <View className="bg-white rounded-xl shadow-sm overflow-hidden mb-4" style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}>
            <View style={{ height: 3, backgroundColor: '#1E3A5F' }} />
            <View className="p-5">
              <Text className="text-primary text-[10px] font-bold tracking-widest uppercase mb-4">
                Basic Info
              </Text>

              <FieldLabel label="Project Name" required />
              <StyledInput
                placeholder="e.g. Westlands Office Block"
                value={projectName}
                onChangeText={setProjectName}
              />

              <FieldLabel label="Client" required />
              <View className="bg-gray-50 border border-gray-200 rounded-xl mb-5 overflow-hidden">
              <View className="mb-5">
                <Picker
                  selectedValue={clientId}
                  onValueChange={setClientId}
                  dropdownIconColor="#64748B"
                  style={{ color: '#1E293B' }}
                >
                  <Picker.Item label="Select a client…" value="" color="#94A3B8" />
                  {clients.map(c => (
                    <Picker.Item key={c.id} label={c.full_name} value={c.id} color="#1E293B" />
                  ))}
                </Picker>

                <TouchableOpacity
                  className="mt-3 bg-card border border-border rounded-xl py-3.5 px-4 flex-row items-center justify-center gap-2"
                  activeOpacity={0.85}
                  onPress={() => setShowAddClient(true)}
                >
                  <Ionicons name="person-add-outline" size={18} color="#7C5CFC" />
                  <Text className="text-[#7C5CFC] font-bold">+ Add Client</Text>
                </TouchableOpacity>
              </View>
              </View>

              <FieldLabel label="Budget (KSh)" required />
              <StyledInput
                placeholder="0.00"
                keyboardType="numeric"
                value={budget}
                onChangeText={setBudget}
              />

              <FieldLabel label="Description" />
              <StyledInput
                placeholder="Brief project description…"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
                style={{ minHeight: 96 }}
              />
            </View>
          </View>

          {/* ── Status ── */}
          <View className="bg-white rounded-xl shadow-sm overflow-hidden mb-4" style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}>
            <View style={{ height: 3, backgroundColor: '#F59E0B' }} />
            <View className="p-5">
              <Text className="text-warning text-[10px] font-bold tracking-widest uppercase mb-4">
                Status
              </Text>
              <SegmentedPicker
                options={STATUS_OPTIONS as any}
                value={status as any}
                onChange={setStatus as any}
              />
            </View>
          </View>

          {/* ── Priority ── */}
          <View className="bg-white rounded-xl shadow-sm overflow-hidden mb-6" style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}>
            <View style={{ height: 3, backgroundColor: '#EF4444' }} />
            <View className="p-5">
              <Text className="text-danger text-[10px] font-bold tracking-widest uppercase mb-4">
                Priority
              </Text>
              <SegmentedPicker
                options={PRIORITY_OPTIONS as any}
                value={priority as any}
                onChange={setPriority as any}
              />
            </View>
          </View>

          {/* ── Submit ── */}
          <TouchableOpacity
            className="bg-primary rounded-xl py-4 flex-row justify-center items-center gap-2 shadow-sm"
            activeOpacity={0.85}
            onPress={handleSave}
            style={{ elevation: 2, shadowColor: '#1E3A5F', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}
          >
            <Ionicons name="briefcase-outline" size={18} color="white" />
            <Text className="text-white text-base font-semibold">Create Project</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </>
  );
}