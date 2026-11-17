import { Tabs } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Home, Search, PlusCircle, Inbox, User } from "lucide-react-native";
import { fetchConversations } from "@/src/services/api/messaging";
import { useAuthStore } from "@/src/store/authStore";
import { colors, typography } from "@/src/theme";

export default function TabLayout() {
  const user = useAuthStore((s) => s.user);
  const conversations = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
    enabled: Boolean(user),
    staleTime: 15_000,
  });

  const unreadTotal =
    conversations.data?.reduce(
      (sum, item) => sum + (item.userUnreadCount || 0),
      0
    ) ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontFamily: typography.fonts.sansSemibold,
          fontSize: 11,
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarAccessibilityLabel: "Home",
          tabBarButtonTestID: "tab-home",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: "Browse",
          tabBarAccessibilityLabel: "Browse listings",
          tabBarButtonTestID: "tab-browse",
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: "Sell",
          tabBarAccessibilityLabel: "Sell",
          tabBarButtonTestID: "tab-sell",
          tabBarIcon: ({ color, size }) => (
            <PlusCircle color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
          tabBarAccessibilityLabel:
            unreadTotal > 0 ? `Inbox, ${unreadTotal} unread` : "Inbox",
          tabBarButtonTestID: "tab-inbox",
          tabBarBadge: unreadTotal > 0 ? unreadTotal : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.destructive,
            color: colors.primaryForeground,
            fontSize: 10,
          },
          tabBarIcon: ({ color, size }) => <Inbox color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarAccessibilityLabel: "Account",
          tabBarButtonTestID: "tab-account",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
