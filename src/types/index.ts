export interface Profile {
  id: string;
  email: string;
  username: string;
  bio?: string;
  location?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  created_at: string;
  profiles?: Profile;
  likes?: Like[];
  like_count?: number;
  is_liked?: boolean;
  is_saved?: boolean;
  comment_count?: number;
}

export interface Like {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}

export interface SavedPost {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
  posts?: Post;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}