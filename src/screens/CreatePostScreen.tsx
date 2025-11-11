import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export const CreatePostScreen: React.FC = () => {
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const navigation = useNavigation();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library access');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileExt = uri.split('.').pop();
    const fileName = `${user?.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('posts')
      .upload(fileName, blob);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('posts').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handlePost = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please add some content to your post');
      return;
    }

    setUploading(true);

    try {
      let imageUrl = null;

      if (imageUri) {
        imageUrl = await uploadImage(imageUri);
      }

      const { error } = await supabase.from('posts').insert({
        user_id: user?.id,
        content: content.trim(),
        image_url: imageUrl,
      });

      if (error) throw error;

      Alert.alert('Success', 'Post created!');
      setContent('');
      setImageUri(null);
      navigation.navigate('Feed' as never);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <TextInput
          style={styles.textInput}
          placeholder="What's on your mind?"
          value={content}
          onChangeText={setContent}
          multiline
          maxLength={500}
        />

        {imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => setImageUri(null)}
            >
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.pickImageButton} onPress={pickImage}>
          <Text style={styles.pickImageText}>📷 Add Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.postButton, uploading && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  textInput: {
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  pickImageButton: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  pickImageText: {
    fontSize: 16,
    color: '#333',
  },
  postButton: {
    backgroundColor: '#6366f1',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  postButtonDisabled: {
    opacity: 0.6,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
