import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import uuid from 'react-native-uuid';
import { insertProject, getAllClients } from '@/database/database';
import { Client } from '@/types';

export default function AddProjectScreen() {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [budget, setBudget] = useState('');
  const [status, setStatus] = useState('proposal');
  const [priority, setPriority] = useState('medium');
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const clientsData = await getAllClients();
    setClients(clientsData);
  };

  const handleSave = async () => {
    if (!projectName.trim()) {
      Alert.alert('Error', 'Please enter project name');
      return;
    }
    if (!clientId) {
      Alert.alert('Error', 'Please select a client');
      return;
    }
    if (!budget || parseFloat(budget) <= 0) {
      Alert.alert('Error', 'Please enter a valid budget');
      return;
    }

    const project = {
      id: uuid.v4() as string,
      project_name: projectName,
      description: description || "",
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
    };

    try {
      await insertProject(project);
      Alert.alert('Success', 'Project added successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add project');
      console.error(error);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <View className="bg-card rounded-xl p-5 shadow-sm">
        {/* Project Name */}
        <Text className="text-sm font-semibold text-foreground mb-1">
          Project Name <Text className="text-destructive">*</Text>
        </Text>
        <TextInput
          className="bg-input border border-border rounded-lg px-4 py-3 mb-4 text-foreground"
          placeholder="Enter project name"
          placeholderTextColor="hsl(var(--muted-foreground))"
          value={projectName}
          onChangeText={setProjectName}
        />

        {/* Client */}
        <Text className="text-sm font-semibold text-foreground mb-1">
          Client <Text className="text-destructive">*</Text>
        </Text>
        <View className="bg-input border border-border rounded-lg mb-4">
          <Picker
            selectedValue={clientId}
            onValueChange={(itemValue) => setClientId(itemValue)}
            dropdownIconColor="hsl(var(--foreground))"
          >
            <Picker.Item label="Select a client..." value="" />
            {clients.map((client) => (
              <Picker.Item key={client.id} label={client.full_name} value={client.id} />
            ))}
          </Picker>
        </View>

        {/* Budget */}
        <Text className="text-sm font-semibold text-foreground mb-1">
          Budget (KSH) <Text className="text-destructive">*</Text>
        </Text>
        <TextInput
          className="bg-input border border-border rounded-lg px-4 py-3 mb-4 text-foreground"
          placeholder="0.00"
          placeholderTextColor="hsl(var(--muted-foreground))"
          keyboardType="numeric"
          value={budget}
          onChangeText={setBudget}
        />

        {/* Description */}
        <Text className="text-sm font-semibold text-foreground mb-1">Description</Text>
        <TextInput
          className="bg-input border border-border rounded-lg px-4 py-3 mb-4 text-foreground"
          placeholder="Project description"
          placeholderTextColor="hsl(var(--muted-foreground))"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
        />

        {/* Status */}
        <Text className="text-sm font-semibold text-foreground mb-1">Status</Text>
        <View className="bg-input border border-border rounded-lg mb-4">
          <Picker
            selectedValue={status}
            onValueChange={setStatus}
            dropdownIconColor="hsl(var(--foreground))"
          >
            <Picker.Item label="Proposal" value="proposal" />
            <Picker.Item label="Active" value="active" />
            <Picker.Item label="On Hold" value="on_hold" />
            <Picker.Item label="Completed" value="completed" />
          </Picker>
        </View>

        {/* Priority */}
        <Text className="text-sm font-semibold text-foreground mb-1">Priority</Text>
        <View className="bg-input border border-border rounded-lg mb-4">
          <Picker
            selectedValue={priority}
            onValueChange={setPriority}
            dropdownIconColor="hsl(var(--foreground))"
          >
            <Picker.Item label="Low" value="low" />
            <Picker.Item label="Medium" value="medium" />
            <Picker.Item label="High" value="high" />
            <Picker.Item label="Urgent" value="urgent" />
          </Picker>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          className="bg-primary py-4 rounded-lg mt-2"
          onPress={handleSave}
        >
          <Text className="text-primary-foreground text-center font-semibold text-base">
            Create Project
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}