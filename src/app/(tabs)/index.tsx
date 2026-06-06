import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Animated, Alert } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { useState, useCallback, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getAllProjects, getDashboardStats, getRecentPayments } from '@/database/database';
import { exportBackup } from '@/services/backupService';
import { Project } from '@/types';

const fmt = (n: number) => `KSh ${n.toLocaleString()}`;
const fmtCompact = (n: number) => {
  if (n >= 1_000_000) return `KSh ${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `KSh ${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}K`;
  return fmt(n);
};
const fmtDt = (ts: number | null) =>
  ts ? new Date(ts * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Not set';

const STATUS = {
  active: { dot: '#10B981', muted: '#E7F8EF', label: 'Active', icon: 'pulse' },
  proposal: { dot: '#F59E0B', muted: '#FFF4D9', label: 'Proposal', icon: 'document-text' },
  completed: { dot: '#3B82F6', muted: '#E8F0FF', label: 'Completed', icon: 'checkmark-circle' },
  on_hold: { dot: '#EF4444', muted: '#FDE8E8', label: 'On Hold', icon: 'pause-circle' },
  cancelled: { dot: '#6B7280', muted: '#F0F1F4', label: 'Cancelled', icon: 'close-circle' },
} as const;

const PRIORITY = {
  urgent: { color: '#DC2626', label: 'Urgent' },
  high: { color: '#EA580C', label: 'High' },
  medium: { color: '#D97706', label: 'Medium' },
  low: { color: '#059669', label: 'Low' },
} as const;

const QUICK_ACTIONS = [
  { icon: 'briefcase-outline', label: 'Project', href: '/project/add', tone: '#2A4B7C' },
  { icon: 'cash-outline', label: 'Payment', href: '/payment/add', tone: '#059669' },
  { icon: 'person-add-outline', label: 'Client', href: '/client/add', tone: '#D97706' },
  { icon: 'construct-outline', label: 'Worker', href: '/worker/add', tone: '#7C3AED' },
  { icon: 'cloud-upload-outline', label: 'Backup', href: null, tone: '#475569', isBackup: true },
] as const;

type StatusKey = keyof typeof STATUS;
type PriorityKey = keyof typeof PRIORITY;

type MetricProps = {
  label: string;
  value: number;
  caption: string;
  icon: any;
  color: string;
};

function PressableScale({ children, onPress, style }: { children: React.ReactNode; onPress?: () => void; style?: any }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  return (
    <TouchableOpacity activeOpacity={1} onPressIn={onIn} onPressOut={onOut} onPress={onPress} style={style}>
      <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
    </TouchableOpacity>
  );
}

function MetricCard({ label, value, caption, icon, color }: MetricProps) {
  return (
    <View className="flex-1 bg-card rounded-2xl border border-border p-4 min-h-[118px]">
      <View className="flex-row justify-between items-start mb-3">
        <View className="w-10 h-10 rounded-2xl items-center justify-center" style={{ backgroundColor: `${color}18` }}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View className="w-2 h-2 rounded-full mt-1" style={{ backgroundColor: color }} />
      </View>
      <Text className="text-foreground text-2xl font-black">{value}</Text>
      <Text className="text-muted-foreground text-[11px] uppercase tracking-widest mt-1">{label}</Text>
      <Text className="text-muted-foreground text-xs mt-2" numberOfLines={1}>
        {caption}
      </Text>
    </View>
  );
}

function QuickAction({ icon, label, href, tone, isBackup }: any) {
  const handleBackup = async () => {
    const result = await exportBackup();
    Alert.alert(
      result.success ? 'Success' : 'Error',
      result.success ? 'Backup created and shared!' : 'Failed to create backup'
    );
  };

  const content = (
    <PressableScale onPress={isBackup ? handleBackup : undefined} style={{ width: '31.5%' }}>
      <View className="bg-card rounded-2xl border border-border p-3 items-center min-h-[92px] justify-center">
        <View className="w-11 h-11 rounded-2xl items-center justify-center mb-2" style={{ backgroundColor: `${tone}16` }}>
          <Ionicons name={icon as any} size={21} color={tone} />
        </View>
        <Text className="text-foreground text-xs font-bold text-center" numberOfLines={1}>
          {label}
        </Text>
      </View>
    </PressableScale>
  );

  if (isBackup) return content;
  return (
    <Link href={href as any} asChild>
      {content}
    </Link>
  );
}

function ProjectRow({ project }: { project: Project }) {
  const status = STATUS[project.status as StatusKey] ?? STATUS.active;
  const priority = PRIORITY[project.priority as PriorityKey] ?? PRIORITY.medium;
  const pct = project.budget > 0 ? Math.min((project.actual_cost / project.budget) * 100, 100) : 0;
  const overBudget = project.actual_cost > project.budget;

  return (
    <Link href={`/project/${project.id}`} asChild>
      <PressableScale>
        <View className="bg-card rounded-2xl border border-border p-4 mb-3">
          <View className="flex-row items-start gap-3">
            <View className="w-11 h-11 rounded-2xl items-center justify-center" style={{ backgroundColor: status.muted }}>
              <Ionicons name={status.icon as any} size={20} color={status.dot} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-start justify-between gap-3">
                <Text className="text-foreground text-sm font-black flex-1" numberOfLines={2}>
                  {project.project_name}
                </Text>
                <Text className="text-[10px] font-black uppercase" style={{ color: priority.color }}>
                  {priority.label}
                </Text>
              </View>
              <View className="flex-row items-center gap-2 mt-1.5">
                <Text className="text-muted-foreground text-[11px]">{status.label}</Text>
                <View className="w-1 h-1 rounded-full bg-border" />
                <Text className="text-muted-foreground text-[11px]">Due {fmtDt(project.expected_end_date)}</Text>
              </View>
              <View className="h-1.5 bg-border rounded-full overflow-hidden mt-3">
                <View
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: overBudget ? '#EF4444' : status.dot }}
                />
              </View>
              <View className="flex-row justify-between mt-1.5">
                <Text className="text-muted-foreground text-[10px]">{pct.toFixed(0)}% spent</Text>
                <Text className="text-muted-foreground text-[10px]">{fmtCompact(project.actual_cost)} / {fmtCompact(project.budget)}</Text>
              </View>
            </View>
          </View>
        </View>
      </PressableScale>
    </Link>
  );
}

function PaymentRow({ payment }: { payment: any }) {
  return (
    <View className="bg-card rounded-2xl border border-border p-4 mb-3 flex-row items-center gap-3">
      <View className="w-11 h-11 rounded-2xl bg-[#E7F8EF] items-center justify-center">
        <Ionicons name="receipt-outline" size={20} color="#059669" />
      </View>
      <View className="flex-1">
        <Text className="text-foreground text-sm font-bold" numberOfLines={1}>
          {payment.item_description}
        </Text>
        <Text className="text-muted-foreground text-xs mt-0.5" numberOfLines={1}>
          {payment.project_name}
        </Text>
        <Text className="text-muted-foreground text-[11px] mt-1 capitalize">
          {fmtDt(payment.payment_date)} · {payment.category}
        </Text>
      </View>
      <Text className="text-[#059669] font-black text-sm">{fmtCompact(payment.amount)}</Text>
    </View>
  );
}

function SectionLabel({ title, action, href }: { title: string; action?: string; href?: string }) {
  return (
    <View className="flex-row justify-between items-center mb-3">
      <Text className="text-foreground text-base font-black">{title}</Text>
      {action && href && (
        <Link href={href as any} asChild>
          <TouchableOpacity className="flex-row items-center gap-1">
            <Text className="text-primary text-xs font-black">{action}</Text>
            <Ionicons name="chevron-forward" size={13} color="#2A4B7C" />
          </TouchableOpacity>
        </Link>
      )}
    </View>
  );
}

function CardDivider() {
  return <View className="h-px bg-border my-3" />;
}

export default function DashboardScreen() {
  const [stats, setStats] = useState({
    activeProjects: 0,
    proposalProjects: 0,
    completedProjects: 0,
    onHoldProjects: 0,
    totalBudget: 0,
    totalSpent: 0,
  });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const [s, p, projectList] = await Promise.all([
      getDashboardStats(),
      getRecentPayments(4),
      getAllProjects(),
    ]);
    setStats(s);
    setRecentPayments(p);
    setProjects(projectList);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const remaining = stats.totalBudget - stats.totalSpent;
  const pctSpent = stats.totalBudget > 0 ? (stats.totalSpent / stats.totalBudget) * 100 : 0;
  const overBudget = remaining < 0;
  const totalLive = stats.activeProjects + stats.proposalProjects + stats.onHoldProjects;

  const priorityProjects = projects
    .filter(
      p =>
        p.status === 'active' ||
        p.status === 'on_hold' ||
        p.priority === 'urgent' ||
        p.priority === 'high'
    )
    .sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 } as Record<string, number>;
      return (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
    })
    .slice(0, 3);

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2A4B7C" />}
      >
        {/* Standard Dashboard Header */}
        <View className="bg-primary/20 border-b border-l border-r border-primary/30 rounded-b-[30px] px-5 pt-14 pb-7">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-4">
              <Text className="text-primary text-[11px] font-bold tracking-[3px] uppercase">Contractor Command</Text>
              <Text className="text-foreground text-3xl font-black mt-1 tracking-tight">Dashboard</Text>
              <Text className="text-muted-foreground text-sm mt-2 leading-5">
                Track sites, budgets, crews, and payments from one place.
              </Text>
            </View>
            <View className="bg-card border border-border rounded-2xl px-3 py-2 items-end">
              <Text className="text-foreground text-2xl font-black">{totalLive}</Text>
              <Text className="text-muted-foreground text-[10px] font-bold uppercase">Live Jobs</Text>
            </View>
          </View>

          {/* Cash Position */}
          <View className="bg-card rounded-3xl mt-6 p-4 border border-border">
            <View className="flex-row justify-between items-center mb-3">
              <View>
                <Text className="text-muted-foreground text-[11px] uppercase tracking-widest font-bold">Cash Position</Text>
                <Text className="text-foreground text-2xl font-black mt-1">{fmtCompact(Math.abs(remaining))}</Text>
              </View>
              <View
                className="rounded-full px-3 py-1.5"
                style={{ backgroundColor: overBudget ? '#FDE8E8' : '#E7F8EF' }}
              >
                <Text className="text-[11px] font-black" style={{ color: overBudget ? '#EF4444' : '#059669' }}>
                  {overBudget ? 'Over budget' : 'Remaining'}
                </Text>
              </View>
            </View>

            <View className="h-2.5 bg-border rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{ width: `${Math.min(pctSpent, 100)}%`, backgroundColor: overBudget ? '#EF4444' : '#2A4B7C' }}
              />
            </View>

            <CardDivider />

            <View className="flex-row justify-between">
              <View>
                <Text className="text-muted-foreground text-[10px] uppercase font-bold">Spent</Text>
                <Text className="text-foreground text-sm font-black">{fmtCompact(stats.totalSpent)}</Text>
              </View>
              <View className="items-end">
                <Text className="text-muted-foreground text-[10px] uppercase font-bold">Budget</Text>
                <Text className="text-foreground text-sm font-black">{fmtCompact(stats.totalBudget)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Body */}
        <View className="px-5 pt-5">
          <View className="flex-row gap-3 mb-3">
            <MetricCard label="Active Sites" value={stats.activeProjects} caption="Projects in progress" icon="hammer-outline" color="#10B981" />
            <MetricCard label="Proposals" value={stats.proposalProjects} caption="Awaiting approval" icon="document-text-outline" color="#F59E0B" />
          </View>
          <View className="flex-row gap-3 mb-6">
            <MetricCard label="Completed" value={stats.completedProjects} caption="Closed projects" icon="checkmark-done-outline" color="#3B82F6" />
            <MetricCard label="On Hold" value={stats.onHoldProjects} caption="Needs attention" icon="alert-circle-outline" color="#EF4444" />
          </View>

          <SectionLabel title="Fast Workbench" />
          <View className="flex-row flex-wrap gap-2.5 mb-6">
            {QUICK_ACTIONS.map(action => <QuickAction key={action.label} {...action} />)}
          </View>

          <SectionLabel title="Site Priorities" action="Projects" href="/(tabs)/projects" />
          {priorityProjects.length === 0 ? (
            <View className="bg-card border border-border rounded-2xl py-10 items-center mb-6">
              <Ionicons name="construct-outline" size={34} color="#8E8CA8" />
              <Text className="text-foreground font-black text-base mt-3">No site priorities yet</Text>
              <Text className="text-muted-foreground text-sm mt-1">Active and urgent projects will appear here.</Text>
            </View>
          ) : (
            <View className="mb-3">
              {priorityProjects.map(project => <ProjectRow key={project.id} project={project} />)}
            </View>
          )}

          <SectionLabel title="Recent Payments" action="Payments" href="/(tabs)/payments" />
          {recentPayments.length === 0 ? (
            <View className="bg-card border border-border rounded-2xl py-10 items-center mb-10">
              <Ionicons name="receipt-outline" size={36} color="#8E8CA8" />
              <Text className="text-foreground font-black text-base mt-3">No payments yet</Text>
              <Text className="text-muted-foreground text-sm mt-1">Materials, labor, and permits will show here.</Text>
            </View>
          ) : (
            <View className="mb-10">
              {recentPayments.map(payment => <PaymentRow key={payment.id} payment={payment} />)}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

