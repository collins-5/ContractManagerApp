import { View, Text, TouchableOpacity, FlatList, ScrollView, Animated } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { useState, useCallback, useRef } from 'react';
import { getAllProjects } from '@/database/database';
import { Project } from '@/types';
import { Ionicons } from '@expo/vector-icons';

// Dynamic colors that can't be expressed with static Tailwind classes
const STATUS = {
  active:    { dot: '#10B981', muted: '#0C4A36', label: 'Active',    icon: 'pulse'          },
  proposal:  { dot: '#F59E0B', muted: '#6B420A', label: 'Proposal',  icon: 'document-text'  },
  completed: { dot: '#3B82F6', muted: '#1D3A6E', label: 'Completed', icon: 'checkmark-circle'},
  on_hold:   { dot: '#EF4444', muted: '#5C1A1A', label: 'On Hold',   icon: 'pause-circle'   },
} as const;

const PRIORITY = {
  urgent: { bg: '#EF4444', label: 'Urgent' },
  high:   { bg: '#F97316', label: 'High'   },
  medium: { bg: '#F59E0B', label: 'Medium' },
  low:    { bg: '#10B981', label: 'Low'    },
} as const;

type StatusKey   = keyof typeof STATUS;
type PriorityKey = keyof typeof PRIORITY;

const FILTERS: { key: string; label: string }[] = [
  { key: 'all',       label: 'All'       },
  { key: 'active',    label: 'Active'    },
  { key: 'proposal',  label: 'Proposal'  },
  { key: 'completed', label: 'Completed' },
  { key: 'on_hold',   label: 'On Hold'   },
];

const fmt = (n: number) => `KSh ${n.toLocaleString()}`;

// ─── Project Card ─────────────────────────────────────────────────────────────
function ProjectCard({ item }: { item: Project }) {
  const scale = useRef(new Animated.Value(1)).current;
  const sc = STATUS[item.status as StatusKey] ?? { dot: '#8E8CA8', muted: '#2A2A36', label: item.status, icon: 'ellipse' };
  const pc = PRIORITY[item.priority as PriorityKey] ?? { bg: '#5C5A72', label: item.priority };

  const pct = item.budget > 0 ? Math.min((item.actual_cost / item.budget) * 100, 100) : 0;
  const overBudget = item.actual_cost > item.budget;

  const onPressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 30 }).start();

  return (
    <Link href={`/project/${item.id}`} asChild>
      <TouchableOpacity activeOpacity={1} onPressIn={onPressIn} onPressOut={onPressOut}>
        <Animated.View
          className="bg-card rounded-2xl mb-3 border border-border overflow-hidden"
          style={{ transform: [{ scale }] }}
        >
          {/* Top accent bar */}
          <View style={{ height: 3, backgroundColor: sc.dot }} />

          <View className="p-4">
            {/* Row 1: name + priority badge */}
            <View className="flex-row items-start justify-between mb-2 gap-3">
              <Text className="text-foreground text-base font-bold flex-1 tracking-tight" numberOfLines={2}>
                {item.project_name}
              </Text>
              <View className="rounded-full px-2.5 py-1 flex-row items-center gap-1" style={{ backgroundColor: pc.bg + '22' }}>
                <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pc.bg }} />
                <Text className="text-[10px] font-bold capitalize" style={{ color: pc.bg }}>{pc.label}</Text>
              </View>
            </View>

            {/* Status pill */}
            <View
              className="self-start flex-row items-center rounded-full px-2.5 py-1 mb-3 gap-1.5"
              style={{ backgroundColor: sc.muted }}
            >
              <Ionicons name={sc.icon as any} size={11} color={sc.dot} />
              <Text className="text-[11px] font-semibold tracking-wide" style={{ color: sc.dot }}>
                {sc.label.toUpperCase()}
              </Text>
            </View>

            {/* Budget row */}
            <View className="flex-row justify-between mb-2">
              <View>
                <Text className="text-muted-foreground text-[10px] uppercase tracking-widest mb-0.5">Budget</Text>
                <Text className="text-foreground text-sm font-semibold">{fmt(item.budget)}</Text>
              </View>
              <View className="items-end">
                <Text className="text-muted-foreground text-[10px] uppercase tracking-widest mb-0.5">Spent</Text>
                <Text
                  className="text-sm font-semibold"
                  style={{ color: overBudget ? '#EF4444' : '#F1F0FA' }}
                >
                  {fmt(item.actual_cost)}
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View className="h-1.5 bg-border rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  backgroundColor: overBudget ? '#EF4444' : sc.dot,
                }}
              />
            </View>
            <Text className="text-muted-foreground text-[10px] mt-1 text-right">
              {pct.toFixed(0)}% used
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Link>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProjectsScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState('all');

  useFocusEffect(
    useCallback(() => {
      getAllProjects().then(setProjects);
    }, [])
  );

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  const counts = {
    all:       projects.length,
    active:    projects.filter(p => p.status === 'active').length,
    proposal:  projects.filter(p => p.status === 'proposal').length,
    completed: projects.filter(p => p.status === 'completed').length,
    on_hold:   projects.filter(p => p.status === 'on_hold').length,
  } as Record<string, number>;

  return (
    <View className="flex-1 bg-background">

      {/* ── Header ── */}
      <View className="flex-row justify-between bg-primary/20 border border-primary/30 rounded-[24px] items-end px-5 pt-14 pb-5" style={{ borderTopLeftRadius: 30, borderTopRightRadius: 30, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 }}>
        <View>
          <Text className="text-primary text-[11px] font-semibold tracking-[3px] uppercase mb-0.5">
            Overview
          </Text>
          <Text className="text-foreground text-3xl font-black tracking-tight">Projects</Text>
        </View>
        <Link href="/project/add" asChild>
          <TouchableOpacity
            className="flex-row items-center bg-primary rounded-xl px-3.5 py-2.5 gap-1"
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="white" />
            <Text className="text-white text-[13px] font-bold">New Project</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* ── Filter Pills ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        className="mb-3 py-2 flex-grow-0"
      >
        {FILTERS.map(({ key, label }) => {
          const active = filter === key;
          const sc = STATUS[key as StatusKey];
          return (
            <TouchableOpacity
              key={key}
              className={`flex-row items-center rounded-xl px-3.5 py-2 border gap-1.5 ${
                active ? 'border-transparent' : 'bg-card border-border'
              }`}
              style={active ? { backgroundColor: sc?.dot ?? '#7C5CFC', borderColor: 'transparent' } : {}}
              onPress={() => setFilter(key)}
              activeOpacity={0.75}
            >
              <Text
                className={`text-xs font-bold capitalize ${active ? 'text-white' : 'text-muted-foreground'}`}
              >
                {label}
              </Text>
              <View
                className={`rounded-full px-1.5 py-0.5 min-w-[18px] items-center ${active ? 'bg-white/20' : 'bg-border'}`}
              >
                <Text className={`text-[10px] font-bold ${active ? 'text-white' : 'text-muted-foreground'}`}>
                  {counts[key] ?? 0}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── List ── */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ProjectCard item={item} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="flex-row items-center gap-2 mb-3">
            <Text className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
              {FILTERS.find(f => f.key === filter)?.label}
            </Text>
            <View className="bg-card rounded-full px-2 py-0.5">
              <Text className="text-muted-foreground text-[11px] font-bold">{filtered.length}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center pt-16 gap-2">
            <Ionicons name="folder-open-outline" size={52} color="#5C5A72" />
            <Text className="text-foreground text-lg font-bold mt-2">No projects here</Text>
            <Text className="text-muted-foreground text-sm">Tap "New Project" to get started.</Text>
          </View>
        }
      />
    </View>
  );
}