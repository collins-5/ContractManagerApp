import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Picker } from '@react-native-picker/picker';
import uuid from 'react-native-uuid';
import { insertPayment, getProjectById, getAllProjects } from '@/database/database';
import { Project } from '@/types';

// ─── Config ───────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'material',  label: 'Material',  icon: 'cube-outline',         dot: '#3B82F6', muted: '#1D3A6E' },
  { value: 'labor',     label: 'Labor',     icon: 'people-outline',        dot: '#10B981', muted: '#0C4A36' },
  { value: 'transport', label: 'Transport', icon: 'car-outline',           dot: '#F59E0B', muted: '#6B420A' },
  { value: 'permit',    label: 'Permit',    icon: 'document-text-outline', dot: '#A855F7', muted: '#4A1A6E' },
  { value: 'equipment', label: 'Equipment', icon: 'hardware-chip-outline', dot: '#EF4444', muted: '#5C1A1A' },
  { value: 'misc',      label: 'Misc',      icon: 'receipt-outline',       dot: '#8E8CA8', muted: '#2A2A36' },
] as const;

const METHODS = [
  { value: 'cash',          label: 'Cash',          icon: 'cash-outline'         },
  { value: 'mpesa',         label: 'M-PESA',         icon: 'phone-portrait-outline'},
  { value: 'bank_transfer', label: 'Bank Transfer',  icon: 'business-outline'     },
  { value: 'cheque',        label: 'Cheque',         icon: 'document-outline'     },
] as const;

type CatValue    = typeof CATEGORIES[number]['value'];
type MethodValue = typeof METHODS[number]['value'];

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <View className="flex-row items-center mb-1.5 gap-1">
      <Text className="text-foreground text-sm font-bold">{label}</Text>
      {required && <Text className="text-[#EF4444] text-sm font-bold">*</Text>}
    </View>
  );
}

function StyledInput({ iconName, ...props }: React.ComponentProps<typeof TextInput> & { iconName?: string }) {
  return (
    <View className="flex-row items-center bg-background border border-border rounded-xl mb-5 overflow-hidden">
      {iconName && <View className="px-3"><Ionicons name={iconName as any} size={16} color="#5C5A72" /></View>}
      <TextInput className="flex-1 py-3 pr-4 text-foreground text-sm" placeholderTextColor="#5C5A72" {...props} />
    </View>
  );
}

function ChipPicker<T extends string>({
  options, value, onChange,
}: {
  options: readonly { value: T; label: string; icon?: string; dot?: string; muted?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2 mb-5">
      {options.map(opt => {
        const active = value === opt.value;
        const dot    = opt.dot   ?? '#7C5CFC';
        const muted  = opt.muted ?? '#2E1A6E';
        return (
          <TouchableOpacity
            key={opt.value}
            className={`flex-row items-center rounded-xl px-3 py-2 border gap-1.5 ${active ? '' : 'bg-background border-border'}`}
            style={active ? { backgroundColor: muted, borderColor: dot } : {}}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.75}
          >
            {opt.icon && <Ionicons name={opt.icon as any} size={13} color={active ? dot : '#5C5A72'} />}
            <Text className="text-xs font-semibold" style={{ color: active ? dot : '#8E8CA8' }}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AddPaymentScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const [project,         setProject]         = useState<Project | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || '');
  const [projects,        setProjects]        = useState<Project[]>([]);
  const [itemDescription, setItemDescription] = useState('');
  const [amount,          setAmount]          = useState('');
  const [category,        setCategory]        = useState<CatValue>('material');
  const [paymentMethod,   setPaymentMethod]   = useState<MethodValue>('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes,           setNotes]           = useState('');
  const [date,            setDate]            = useState(new Date());
  const [showDatePicker,  setShowDatePicker]  = useState(false);
  const [receiptImage,    setReceiptImage]    = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
    requestPermissions();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      getProjectById(selectedProjectId).then(p => setProject(p as Project));
    } else {
      setProject(null);
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    const allProjects = await getAllProjects();
    setProjects(allProjects as Project[]);
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take receipt photos');
    }
  };

  const copyImageToAppStorage = async (uri: string): Promise<string | null> => {
    try {
      const imageDir = `${FileSystem.documentDirectory}receipts/`;
      const dirInfo = await FileSystem.getInfoAsync(imageDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(imageDir, { intermediates: true });
      }
      
      const fileName = `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
      const newPath = `${imageDir}${fileName}`;
      
      await FileSystem.copyAsync({
        from: uri,
        to: newPath
      });
      
      return newPath;
    } catch (error) {
      console.error('Error copying image:', error);
      return null;
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      const savedPath = await copyImageToAppStorage(result.assets[0].uri);
      if (savedPath) {
        setReceiptImage(savedPath);
      } else {
        setReceiptImage(result.assets[0].uri);
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const savedPath = await copyImageToAppStorage(result.assets[0].uri);
      if (savedPath) {
        setReceiptImage(savedPath);
      } else {
        setReceiptImage(result.assets[0].uri);
      }
    }
  };

  const handleSave = async () => {
    if (!selectedProjectId) {
      Alert.alert('Error', 'Please select a project');
      return;
    }
    if (!itemDescription.trim()) {
      Alert.alert('Error', 'Please enter item description');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      const paymentData = {
        id: uuid.v4() as string,
        project_id: selectedProjectId,
        payment_date: Math.floor(date.getTime() / 1000),
        category: category,
        item_description: itemDescription,
        quantity: 1,
        unit_price: parseFloat(amount),
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        reference_number: referenceNumber || null,
        notes: notes || null,
        receipt_image_path: receiptImage || null,
      };

      await insertPayment(paymentData);
      
      Alert.alert('Success', 'Payment added successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving payment:', error);
      Alert.alert('Error', 'Failed to add payment. Please make sure you selected a project.');
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
      {/* ── Header ── */}
      <View className="px-5 pt-14 pb-6">
        <TouchableOpacity className="flex-row items-center gap-1.5 mb-4" onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color="#10B981" />
          <Text className="text-[#10B981] text-sm font-semibold">Back</Text>
        </TouchableOpacity>
        <Text className="text-[#10B981] text-[11px] font-semibold tracking-[3px] uppercase mb-0.5">New Entry</Text>
        <Text className="text-foreground text-3xl font-black tracking-tight">Add Payment</Text>
      </View>

      <View className="px-5 pb-12">

        {/* ── Project Selection ── */}
        <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
          <View style={{ height: 3, backgroundColor: '#7C5CFC' }} />
          <View className="p-5">
            <FieldLabel label="Select Project" required />
            <View className="bg-background border border-border rounded-xl mb-5 overflow-hidden">
              <Picker
                selectedValue={selectedProjectId}
                onValueChange={(value) => setSelectedProjectId(value)}
                dropdownIconColor="hsl(var(--foreground))"
              >
                <Picker.Item label="Select a project..." value="" />
                {projects.map((p) => (
                  <Picker.Item key={p.id} label={p.project_name} value={p.id} />
                ))}
              </Picker>
            </View>

            {/* Project banner when selected */}
            {project && (
              <View className="bg-primary/10 rounded-xl p-3 flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-lg bg-primary/20 items-center justify-center">
                  <Ionicons name="briefcase" size={16} color="#7C5CFC" />
                </View>
                <View className="flex-1">
                  <Text className="text-muted-foreground text-[10px] uppercase tracking-widest">Selected Project</Text>
                  <Text className="text-foreground font-bold text-sm">{project.project_name}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ── Details ── */}
        <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
          <View style={{ height: 3, backgroundColor: '#10B981' }} />
          <View className="p-5">
            <Text className="text-[#10B981] text-[10px] font-bold tracking-widest uppercase mb-4">Payment Details</Text>

            <FieldLabel label="Payment Date" required />
            <TouchableOpacity
              className="flex-row items-center bg-background border border-border rounded-xl mb-5 px-4 py-3"
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={16} color="#5C5A72" style={{ marginRight: 10 }} />
              <Text className="text-foreground text-sm flex-1">{date.toLocaleDateString('en-GB')}</Text>
              <Ionicons name="chevron-down" size={14} color="#5C5A72" />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date} mode="date" display="default"
                onChange={(_, d) => { setShowDatePicker(false); if (d) setDate(d); }}
              />
            )}

            <FieldLabel label="Item Description" required />
            <StyledInput
              iconName="create-outline"
              placeholder="e.g. Cement, Mabati, Labour payment"
              value={itemDescription}
              onChangeText={setItemDescription}
            />

            <FieldLabel label="Amount (KSh)" required />
            <StyledInput
              iconName="cash-outline"
              placeholder="0.00"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
        </View>

        {/* ── Category ── */}
        <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
          <View style={{ height: 3, backgroundColor: '#3B82F6' }} />
          <View className="p-5">
            <Text className="text-[#3B82F6] text-[10px] font-bold tracking-widest uppercase mb-4">Category</Text>
            <ChipPicker options={CATEGORIES} value={category} onChange={setCategory} />
          </View>
        </View>

        {/* ── Payment Method ── */}
        <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
          <View style={{ height: 3, backgroundColor: '#A855F7' }} />
          <View className="p-5">
            <Text className="text-[#A855F7] text-[10px] font-bold tracking-widest uppercase mb-4">Payment Method</Text>
            <ChipPicker
              options={METHODS.map(m => ({ ...m, dot: '#A855F7', muted: '#4A1A6E' }))}
              value={paymentMethod}
              onChange={setPaymentMethod}
            />

            {/* M-PESA reference */}
            {paymentMethod === 'mpesa' && (
              <>
                <FieldLabel label="M-PESA Reference" />
                <StyledInput
                  iconName="phone-portrait-outline"
                  placeholder="e.g. QWK3L4M9"
                  autoCapitalize="characters"
                  value={referenceNumber}
                  onChangeText={setReferenceNumber}
                />
              </>
            )}
          </View>
        </View>

        {/* ── Receipt Image Section ── */}
        <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
          <View style={{ height: 3, backgroundColor: '#F59E0B' }} />
          <View className="p-5">
            <Text className="text-[#F59E0B] text-[10px] font-bold tracking-widest uppercase mb-4">Receipt / Evidence</Text>
            
            {receiptImage ? (
              <View>
                <Image 
                  source={{ uri: receiptImage }} 
                  className="w-full h-48 rounded-xl mb-3"
                  resizeMode="cover"
                />
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className="flex-1 bg-warning py-2 rounded-xl flex-row justify-center items-center gap-2"
                    onPress={takePhoto}
                  >
                    <Ionicons name="camera" size={16} color="white" />
                    <Text className="text-white font-semibold text-sm">Retake</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-destructive py-2 rounded-xl flex-row justify-center items-center gap-2"
                    onPress={() => setReceiptImage(null)}
                  >
                    <Ionicons name="trash" size={16} color="white" />
                    <Text className="text-white font-semibold text-sm">Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 bg-primary py-3 rounded-xl flex-row justify-center items-center gap-2"
                  onPress={takePhoto}
                >
                  <Ionicons name="camera" size={18} color="white" />
                  <Text className="text-white font-semibold text-sm">Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-secondary py-3 rounded-xl flex-row justify-center items-center gap-2"
                  onPress={pickImage}
                >
                  <Ionicons name="images" size={18} color="white" />
                  <Text className="text-white font-semibold text-sm">Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* ── Notes ── */}
        <View className="bg-card rounded-2xl border border-border overflow-hidden mb-6">
          <View style={{ height: 3, backgroundColor: '#5C5A72' }} />
          <View className="p-5">
            <Text className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase mb-4">Notes</Text>
            <View className="flex-row bg-background border border-border rounded-xl overflow-hidden">
              <View className="px-3 pt-3"><Ionicons name="document-text-outline" size={16} color="#5C5A72" /></View>
              <TextInput
                className="flex-1 py-3 pr-4 text-foreground text-sm"
                placeholder="Any additional notes…"
                placeholderTextColor="#5C5A72"
                multiline numberOfLines={4} textAlignVertical="top"
                value={notes} onChangeText={setNotes}
                style={{ minHeight: 96 }}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity className="bg-primary rounded-2xl py-4 flex-row justify-center items-center gap-2" activeOpacity={0.85} onPress={handleSave}>
          <Ionicons name="cash-outline" size={18} color="white" />
          <Text className="text-white text-base font-bold">Add Payment</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}