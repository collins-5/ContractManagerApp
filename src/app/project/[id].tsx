import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getProjectById, getProjectPayments, getClientById, updateProjectStatus } from '@/database/database';
import { Project, Payment, Client } from '@/types';

const fmt = (n: number) => `KSh ${n.toLocaleString()}`;
const fmtDt = (ts: number | null) =>
  ts
    ? new Date(ts * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Not set';

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS = {
  active:    { dot: '#10B981', muted: '#0C4A36', label: 'Active',    icon: 'pulse'             },
  proposal:  { dot: '#F59E0B', muted: '#6B420A', label: 'Proposal',  icon: 'document-text'     },
  completed: { dot: '#3B82F6', muted: '#1D3A6E', label: 'Completed', icon: 'checkmark-circle'  },
  on_hold:   { dot: '#EF4444', muted: '#5C1A1A', label: 'On Hold',   icon: 'pause-circle'      },
} as const;

const PRIORITY = {
  urgent: { dot: '#EF4444', muted: '#5C1A1A', label: 'Urgent' },
  high:   { dot: '#F97316', muted: '#6B2A0A', label: 'High'   },
  medium: { dot: '#F59E0B', muted: '#6B420A', label: 'Medium' },
  low:    { dot: '#10B981', muted: '#0C4A36', label: 'Low'    },
} as const;

const CATEGORY_ICON: Record<string, string> = {
  material: 'cube-outline', labor: 'people-outline', transport: 'car-outline',
  permit: 'document-text-outline', equipment: 'hardware-chip-outline',
};

type StatusKey   = keyof typeof STATUS;
type PriorityKey = keyof typeof PRIORITY;

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, valueColor }: {
  icon: string; label: string; value: string; valueColor?: string;
}) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-border last:border-0">
      <View className="flex-row items-center gap-2">
        <Ionicons name={icon as any} size={15} color="#5C5A72" />
        <Text className="text-muted-foreground text-sm">{label}</Text>
      </View>
      <Text className="text-sm font-semibold" style={{ color: valueColor ?? '#F1F0FA' }}>{value}</Text>
    </View>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, accentColor, children }: {
  title: string; accentColor: string; children: React.ReactNode;
}) {
  return (
    <View className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
      <View style={{ height: 3, backgroundColor: accentColor }} />
      <View className="p-4">
        <Text className="text-foreground text-sm font-bold mb-3 uppercase tracking-widest"
          style={{ color: accentColor }}>
          {title}
        </Text>
        {children}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProjectDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [project,  setProject]  = useState<Project | null>(null);
  const [client,   setClient]   = useState<Client | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading,  setLoading]  = useState(true);

  const loadProjectData = async () => {
    try {
      const projectData = await getProjectById(id);
      setProject(projectData as Project);
      if (projectData) {
        const [clientData, paymentsData] = await Promise.all([
          getClientById(projectData.client_id),
          getProjectPayments(id),
        ]);
        setClient(clientData as Client);
        setPayments(paymentsData as Payment[]);
      }
    } catch {
      Alert.alert('Error', 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProjectData(); }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateProjectStatus(id, newStatus);
      await loadProjectData();
      Alert.alert('Success', `Status updated to ${newStatus}`);
    } catch {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background gap-3">
        <View className="w-12 h-12 rounded-2xl bg-card border border-border items-center justify-center">
          <Ionicons name="hourglass-outline" size={24} color="#5C5A72" />
        </View>
        <Text className="text-muted-foreground text-sm">Loading project…</Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View className="flex-1 justify-center items-center bg-background gap-3">
        <Ionicons name="alert-circle-outline" size={48} color="#5C5A72" />
        <Text className="text-foreground font-bold text-lg">Project not found</Text>
      </View>
    );
  }

  const sc = STATUS[project.status as StatusKey] ?? { dot: '#8E8CA8', muted: '#2A2A36', label: project.status, icon: 'ellipse' };
  const pc = PRIORITY[project.priority as PriorityKey] ?? { dot: '#8E8CA8', muted: '#2A2A36', label: project.priority };

  const totalPaid      = payments.reduce((s, p) => s + p.amount, 0);
  const remaining      = (project.budget || 0) - totalPaid;
  const pctSpent       = project.budget ? (totalPaid / project.budget) * 100 : 0;
  const overBudget     = remaining < 0;

  // Initials for project avatar
  const words = project.project_name.trim().split(' ');
  const ini   = words.length >= 2 ? words[0][0] + words[1][0] : project.project_name.slice(0, 2);

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>

      {/* ── Hero ── */}
      <View className="px-5 pt-14 pb-6">
        {/* Avatar + name */}
        <View className="flex-row items-center gap-4 mb-4">
          <View
            className="w-14 h-14 rounded-2xl items-center justify-center border-2"
            style={{ backgroundColor: sc.muted, borderColor: sc.dot }}
          >
            <Text className="text-xl font-black uppercase" style={{ color: sc.dot }}>
              {ini.toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-foreground text-xl font-black tracking-tight leading-tight">
              {project.project_name}
            </Text>
            {client && (
              <Text className="text-muted-foreground text-sm mt-0.5">{client.full_name}</Text>
            )}
          </View>
        </View>

        {/* Status + priority badges */}
        <View className="flex-row gap-2">
          <View className="flex-row items-center rounded-full px-3 py-1.5 gap-1.5" style={{ backgroundColor: sc.muted }}>
            <Ionicons name={sc.icon as any} size={12} color={sc.dot} />
            <Text className="text-xs font-bold tracking-wide" style={{ color: sc.dot }}>{sc.label.toUpperCase()}</Text>
          </View>
          <View className="flex-row items-center rounded-full px-3 py-1.5 gap-1.5" style={{ backgroundColor: pc.muted }}>
            <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pc.dot }} />
            <Text className="text-xs font-bold tracking-wide" style={{ color: pc.dot }}>{pc.label.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View className="px-5 pb-10">

        {/* ── Client ── */}
        {client && (
          <SectionCard title="Client" accentColor="#7C5CFC">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-[#2E1A6E] items-center justify-center">
                <Ionicons name="person" size={18} color="#7C5CFC" />
              </View>
              <View>
                <Text className="text-foreground font-bold">{client.full_name}</Text>
                <Text className="text-muted-foreground text-sm">{client.phone_number}</Text>
                {client.email && <Text className="text-muted-foreground text-xs">{client.email}</Text>}
              </View>
            </View>
          </SectionCard>
        )}

        {/* ── Budget overview ── */}
        <SectionCard title="Budget Overview" accentColor={overBudget ? '#EF4444' : '#10B981'}>
          <InfoRow icon="wallet-outline"   label="Total Budget" value={fmt(project.budget)} />
          <InfoRow icon="cash-outline"     label="Total Paid"   value={fmt(totalPaid)}      valueColor="#10B981" />
          <InfoRow
            icon="trending-down-outline"
            label="Remaining"
            value={`${overBudget ? '−' : ''}${fmt(Math.abs(remaining))}${overBudget ? ' (Overspent)' : ''}`}
            valueColor={overBudget ? '#EF4444' : '#F1F0FA'}
          />

          {/* Progress bar */}
          <View className="mt-4">
            <View className="h-2.5 bg-border rounded-full overflow-hidden mb-1.5">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(pctSpent, 100)}%`,
                  backgroundColor: overBudget ? '#EF4444' : '#10B981',
                }}
              />
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted-foreground text-[10px]">0%</Text>
              <Text className="text-[10px] font-semibold" style={{ color: overBudget ? '#EF4444' : '#8E8CA8' }}>
                {pctSpent.toFixed(1)}% spent
              </Text>
              <Text className="text-muted-foreground text-[10px]">100%</Text>
            </View>
          </View>
        </SectionCard>

        {/* ── Timeline ── */}
        <SectionCard title="Timeline" accentColor="#3B82F6">
          <InfoRow icon="calendar-outline" label="Start Date"     value={fmtDt(project.start_date)}        />
          <InfoRow icon="flag-outline"     label="Expected End"   value={fmtDt(project.expected_end_date)} />
        </SectionCard>

        {/* ── Description ── */}
        {project.description && (
          <SectionCard title="Description" accentColor="#F59E0B">
            <Text className="text-muted-foreground text-sm leading-relaxed">{project.description}</Text>
          </SectionCard>
        )}

        {/* ── Recent Payments ── */}
        {payments.length > 0 && (
          <SectionCard title="Recent Payments" accentColor="#10B981">
            {payments.slice(0, 5).map((payment, i) => {
              const catIcon = CATEGORY_ICON[payment.category] ?? 'receipt-outline';
              return (
                <View
                  key={payment.id}
                  className={`flex-row items-center gap-3 py-3 ${i < Math.min(payments.length, 5) - 1 ? 'border-b border-border' : ''}`}
                >
                  <View className="w-9 h-9 rounded-xl bg-[#0C4A36] items-center justify-center">
                    <Ionicons name={catIcon as any} size={15} color="#10B981" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
                      {payment.item_description}
                    </Text>
                    <Text className="text-muted-foreground text-[11px] mt-0.5 capitalize">
                      {payment.category} · {fmtDt(payment.payment_date)}
                    </Text>
                  </View>
                  <Text className="text-[#10B981] font-black text-sm">{fmt(payment.amount)}</Text>
                </View>
              );
            })}
          </SectionCard>
        )}

        {/* ── Actions ── */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 bg-primary rounded-2xl py-3.5 flex-row justify-center items-center gap-2"
            activeOpacity={0.85}
            onPress={() => router.push(`/payment/add?projectId=${project.id}`)}
          >
            <Ionicons name="cash-outline" size={18} color="white" />
            <Text className="text-white font-bold text-sm">Add Payment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-card border border-border rounded-2xl py-3.5 flex-row justify-center items-center gap-2"
            activeOpacity={0.85}
            onPress={() =>
              Alert.alert('Update Status', 'Select new status',
                (['proposal', 'active', 'on_hold', 'completed'] as StatusKey[]).map(s => ({
                  text: STATUS[s].label,
                  onPress: () => handleStatusChange(s),
                }))
              )
            }
          >
            <Ionicons name="sync-outline" size={18} color="#8E8CA8" />
            <Text className="text-muted-foreground font-bold text-sm">Change Status</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
}