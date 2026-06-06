import { View, Text, TouchableOpacity, FlatList, Animated } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { useState, useCallback, useRef } from 'react';
import { Client, Worker, Engineer } from '@/types';
import { getAllClients, getAllWorkers, getAllEngineers } from '@/database/database';
import { Ionicons } from '@expo/vector-icons';

type Tab = 'all' | 'clients' | 'workers' | 'engineers';
type ContactItem = (Client | Worker | Engineer) & {
  contactType: 'client' | 'worker' | 'engineer';
};

// Dynamic colors that can't be expressed with static Tailwind classes
const TYPE = {
  client:   { dot: '#3B82F6', muted: '#1D3A6E', label: 'Client'   },
  worker:   { dot: '#10B981', muted: '#0C4A36', label: 'Worker'   },
  engineer: { dot: '#F59E0B', muted: '#6B420A', label: 'Engineer' },
} as const;

const TAB_ORDER: { key: Tab; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all',       icon: 'people'    },
  { key: 'clients',   icon: 'person'    },
  { key: 'workers',   icon: 'hammer'    },
  { key: 'engineers', icon: 'construct' },
];

function initials(name: string) {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

// ─── Contact Card ─────────────────────────────────────────────────────────────
function ContactCard({ item, href }: { item: ContactItem; href: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const tc = TYPE[item.contactType];
  const ini = initials(item.full_name);

  const onPressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 30 }).start();

  const subtitle =
    item.contactType === 'worker'   ? (item as Worker).trade :
    item.contactType === 'engineer' ? (item as Engineer).specialty :
                                      (item as Client).email;

  const meta =
    item.contactType === 'worker'   ? ((item as Worker).daily_wage    ? `KSh ${(item as Worker).daily_wage}/day`      : null) :
    item.contactType === 'engineer' ? ((item as Engineer).hourly_rate ? `KSh ${(item as Engineer).hourly_rate}/hr`    : null) :
                                      ((item as Client).address       ? (item as Client).address!                      : null);

  return (
    <Link href={href} asChild>
      <TouchableOpacity activeOpacity={1} onPressIn={onPressIn} onPressOut={onPressOut}>
        <Animated.View
          className="flex-row items-center bg-card rounded-2xl mb-2.5 border border-border overflow-hidden"
          style={{ transform: [{ scale }] }}
        >
          {/* Left accent bar — dynamic color */}
          <View style={{ width: 3, alignSelf: 'stretch', backgroundColor: tc.dot }} />

          {/* Avatar */}
          <View
            className="w-11 h-11 rounded-xl items-center justify-center ml-3 my-3.5 border-2"
            style={{ backgroundColor: tc.muted, borderColor: tc.dot }}
          >
            <Text className="text-sm font-extrabold" style={{ color: tc.dot }}>{ini}</Text>
          </View>

          {/* Body */}
          <View className="flex-1 pl-3 py-3.5">
            <Text className="text-foreground text-[15px] font-bold tracking-tight" numberOfLines={1}>
              {item.full_name}
            </Text>
            <Text className="text-muted-foreground text-xs mt-0.5">{item.phone_number}</Text>
            {subtitle ? (
              <Text className="text-xs font-semibold mt-1" style={{ color: tc.dot }} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
            {meta ? (
              <Text className="text-muted-foreground text-[11px] mt-0.5" numberOfLines={1}>{meta}</Text>
            ) : null}
          </View>

          {/* Badge + chevron */}
          <View className="items-end pr-3.5 py-3">
            <View className="flex-row items-center rounded-full px-2 py-1 gap-1" style={{ backgroundColor: tc.muted }}>
              <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tc.dot }} />
              <Text className="text-[10px] font-bold tracking-wide" style={{ color: tc.dot }}>
                {tc.label}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#5C5A72" style={{ marginTop: 8 }} />
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Link>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ count, tab }: { count: number; tab: Tab }) {
  const labels: Record<Tab, string> = {
    all: 'All Contacts', clients: 'Clients',
    workers: 'Workers',  engineers: 'Engineers',
  };
  return (
    <View className="flex-row items-center mb-3 gap-2">
      <Text className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
        {labels[tab]}
      </Text>
      <View className="bg-card rounded-full px-2 py-0.5">
        <Text className="text-muted-foreground text-[11px] font-bold">{count}</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ContactsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [clients,   setClients]   = useState<Client[]>([]);
  const [workers,   setWorkers]   = useState<Worker[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [allContacts, setAllContacts] = useState<ContactItem[]>([]);

  const loadData = async () => {
    const [c, w, e] = await Promise.all([getAllClients(), getAllWorkers(), getAllEngineers()]);
    setClients(c as Client[]);
    setWorkers(w as Worker[]);
    setEngineers(e as Engineer[]);
    const combined: ContactItem[] = [
      ...(c as Client[]).map(x  => ({ ...x, contactType: 'client'   as const })),
      ...(w as Worker[]).map(x  => ({ ...x, contactType: 'worker'   as const })),
      ...(e as Engineer[]).map(x => ({ ...x, contactType: 'engineer' as const })),
    ];
    setAllContacts(combined.sort((a, b) => a.full_name.localeCompare(b.full_name)));
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const ADD_LINKS: Record<Tab, string>  = { all: '/client/add', clients: '/client/add', workers: '/worker/add', engineers: '/engineer/add' };
  const ADD_LABELS: Record<Tab, string> = { all: 'Add Contact', clients: 'Add Client',  workers: 'Add Worker',  engineers: 'Add Engineer'  };

  const displayData: ContactItem[] =
    activeTab === 'all'       ? allContacts :
    activeTab === 'clients'   ? (clients   as any[]).map(x => ({ ...x, contactType: 'client'   })) :
    activeTab === 'workers'   ? (workers   as any[]).map(x => ({ ...x, contactType: 'worker'   })) :
                                (engineers as any[]).map(x => ({ ...x, contactType: 'engineer' }));

  return (
    <View className="flex-1 bg-background">

      {/* ── Header ── */}
      <View
        className="flex-row justify-between bg-primary/20 border border-primary/30 items-end px-5 pt-14 pb-5"
        style={{ borderRadius: 24, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 }}
      >
        <View>
          <Text className="text-primary text-[11px] font-semibold tracking-[3px] uppercase mb-0.5">
            Directory
          </Text>
          <Text className="text-foreground text-3xl font-black tracking-tight">Contacts</Text>
        </View>
        <Link href={ADD_LINKS[activeTab]} asChild>
          <TouchableOpacity
            className="flex-row items-center bg-primary rounded-xl px-3.5 py-2.5 gap-1"
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="white" />
            <Text className="text-white text-[13px] font-bold">{ADD_LABELS[activeTab]}</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* ── Tabs ── */}
      <View className="flex-row px-5 gap-2 py-2 mb-2">
        {TAB_ORDER.map(({ key, icon }) => {
          const active = activeTab === key;
          return (
            <TouchableOpacity
              key={key}
              className={`flex-1 flex-row items-center justify-center rounded-xl py-2.5 border ${
                active
                  ? 'bg-primary border-primary'
                  : 'bg-card border-border'
              }`}
              onPress={() => setActiveTab(key)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={icon}
                size={14}
                color={active ? '#fff' : '#5C5A72'}
                style={{ marginRight: 4 }}
              />
              <Text className={`text-[11px] font-semibold capitalize ${active ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                {key}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── List ── */}
      <FlatList
        data={displayData}
        keyExtractor={item => `${item.contactType}-${item.id}`}
        renderItem={({ item }) => (
          <ContactCard item={item} href={`/${item.contactType}/${item.id}`} />
        )}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<SectionHeader count={displayData.length} tab={activeTab} />}
        ListEmptyComponent={
          <View className="items-center pt-16 gap-2">
            <Ionicons name="people-outline" size={52} color="#5C5A72" />
            <Text className="text-foreground text-lg font-bold mt-2">No contacts yet</Text>
            <Text className="text-muted-foreground text-sm">Tap the button above to add one.</Text>
          </View>
        }
      />
    </View>
  );
}