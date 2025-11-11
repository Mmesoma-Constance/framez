import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../types';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

interface PostCardProps {
  post: Post;
  onUpdate?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onUpdate }) => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [isSaved, setIsSaved] = useState(post.is_saved || false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleLike = async () => {
    try {
      if (isLiked) {
        await supabase.from('likes').delete().match({ user_id: user?.id, post_id: post.id });
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        await supabase.from('likes').insert({ user_id: user?.id, post_id: post.id });
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleSave = async () => {
    try {
      if (isSaved) {
        await supabase.from('saved_posts').delete().match({ user_id: user?.id, post_id: post.id });
        setIsSaved(false);
      } else {
        await supabase.from('saved_posts').insert({ user_id: user?.id, post_id: post.id });
        setIsSaved(true);
      }
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const navigateToProfile = () => {
    navigation.navigate('UserProfile' as never, { userId: post.user_id } as never);
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={navigateToProfile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {post.profiles?.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{post.profiles?.username}</Text>
          <Text style={styles.timestamp}>{formatDate(post.created_at)}</Text>
        </View>
      </TouchableOpacity>

      {post.image_url && (
        <Image source={{ uri: post.image_url }} style={styles.postImage} />
      )}

      <View style={styles.actions}>
        <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
          <Ionicons 
            name={isLiked ? 'heart' : 'heart-outline'} 
            size={24} 
            color={isLiked ? '#ef4444' : '#000'} 
          />
          <Text style={styles.actionText}>{likeCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSave} style={styles.actionButton}>
          <Ionicons 
            name={isSaved ? 'bookmark' : 'bookmark-outline'} 
            size={24} 
            color={isSaved ? '#6366f1' : '#000'} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.contentText}>
          <Text style={styles.usernameInContent}>{post.profiles?.username}</Text> {post.content}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  postImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  actions: {
    flexDirection: 'row',
    padding: 12,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  contentText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 20,
  },
  usernameInContent: {
    fontWeight: '600',
  },
});