import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import { Post, Profile } from "../types";
import { PostCard } from "../components/PostCard";

type TabType = "posts" | "liked" | "saved";

export const ProfileScreen: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const { user, signOut } = useAuth();

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchPosts = async (tab: TabType) => {
    setLoading(true);
    try {
      let query;

      if (tab === "posts") {
        const { data, error } = await supabase
          .from("posts")
          .select(
            `
            *,
            profiles!posts_user_id_fkey (*)
          `
          )
          .eq("user_id", user?.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        query = data;
      } else if (tab === "liked") {
        const { data, error } = await supabase
          .from("likes")
          .select(
            `
            post_id,
            posts!inner (
              *,
              profiles!posts_user_id_fkey (*)
            )
          `
          )
          .eq("user_id", user?.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        query = data?.map((item) => item.posts).filter(Boolean);
      } else {
        const { data, error } = await supabase
          .from("saved_posts")
          .select(
            `
            post_id,
            posts!inner (
              *,
              profiles!posts_user_id_fkey (*)
            )
          `
          )
          .eq("user_id", user?.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        query = data?.map((item) => item.posts).filter(Boolean);
      }

      // Add engagement data
      const postsWithEngagement = await Promise.all(
        (query || []).map(async (post: any) => {
          const [{ count: likeCount }, { data: userLike }, { data: userSave }] =
            await Promise.all([
              supabase
                .from("likes")
                .select("*", { count: "exact", head: true })
                .eq("post_id", post.id),
              supabase
                .from("likes")
                .select("id")
                .eq("post_id", post.id)
                .eq("user_id", user?.id)
                .maybeSingle(),
              supabase
                .from("saved_posts")
                .select("id")
                .eq("post_id", post.id)
                .eq("user_id", user?.id)
                .maybeSingle(),
            ]);

          return {
            ...post,
            like_count: likeCount || 0,
            is_liked: !!userLike,
            is_saved: !!userSave,
          };
        })
      );

      setPosts(postsWithEngagement);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch on screen focus
  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
      fetchPosts(activeTab);
    }, [activeTab])
  );

  useEffect(() => {
    fetchProfile();
    fetchPosts(activeTab);
  }, [activeTab, user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
    fetchPosts(activeTab);
  };

  if (loading && posts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard post={item} onUpdate={() => fetchPosts(activeTab)} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            <View style={styles.profileHeader}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarTextLarge}>
                  {profile?.username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.username}>{profile?.username}</Text>
              <Text style={styles.email}>{profile?.email}</Text>
              {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
              {profile?.location && (
                <Text style={styles.location}>📍 {profile.location}</Text>
              )}

              <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, activeTab === "posts" && styles.activeTab]}
                onPress={() => setActiveTab("posts")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "posts" && styles.activeTabText,
                  ]}
                >
                  Posts
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === "liked" && styles.activeTab]}
                onPress={() => setActiveTab("liked")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "liked" && styles.activeTabText,
                  ]}
                >
                  Liked
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === "saved" && styles.activeTab]}
                onPress={() => setActiveTab("saved")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "saved" && styles.activeTabText,
                  ]}
                >
                  Saved
                </Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === "posts"
                ? "No posts yet"
                : activeTab === "liked"
                ? "No liked posts"
                : "No saved posts"}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileHeader: {
    backgroundColor: "#fff",
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarTextLarge: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  username: {
    fontSize: 22,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: "#000",
    textAlign: "center",
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#6366f1",
  },
  tabText: {
    fontSize: 16,
    color: "#666",
  },
  activeTabText: {
    color: "#6366f1",
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
