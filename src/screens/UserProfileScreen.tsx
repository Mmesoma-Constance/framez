import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Post, Profile } from '../types';
import { PostCard } from '../components/PostCard';

export const UserProfileScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { userId } = route.params;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const { user } = useAuth();

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);

      // Check if current user follows this profile
      const { data: followData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user?.id)
        .eq('following_id', userId)
        .single();

      setIsFollowing(!!followData);

      // Get follower and following counts
      const [{ count: followers }, { count: following }] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
      ]);

      setFollowerCount(followers || 0);
      setFollowingCount(following || 0);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false});

      if (error) throw error;

      const postsWithEngagement = await Promise.all(
        (data || []).map(async (post) => {
          const [{ count: likeCount }, { data: userLike }, { data: userSave }] = await Promise.all([
            supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
            supabase.from('likes').select('id').eq('post_id', post.id).eq('user_id', user?.id).single(),
            supabase.from('saved_posts').select('id').eq('post_id', post.id).eq('user_id', user?.id).single(),
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
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [userId]);

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await supabase.from('follows').delete().match({ follower_id: user?.id, following_id: userId });
        setIsFollowing(false);
        setFollowerCount(prev => prev - 1);
      } else {
        await supabase.from('follows').insert({ follower_id: user?.id, following_id: userId });
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
    fetchPosts();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profile?.username}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} onUpdate={fetchPosts} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.profileHeader}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarTextLarge}>
                {profile?.username.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.username}>{profile?.username}</Text>
            <Text style={styles.email}>{profile?.email}</Text>
            {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
            {profile?.location && <Text style={styles.location}>📍 {profile.location}</Text>}

            <View style={styles.statsContainer}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{posts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{followerCount}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{followingCount}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>

            {user?.id !== userId && (
              <TouchableOpacity
                style={[styles.followButton, isFollowing && styles.followingButton]}
                onPress={handleFollow}
              >
                <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  profileHeader: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 8,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarTextLarge: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 32,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  followButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 40,
    paddingVertical: 10,
    borderRadius: 8,
  },
  followingButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#000',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});