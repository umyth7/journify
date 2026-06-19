export type Mood =
  | "HYPNOTIC"
  | "EUPHORIC"
  | "TRIBAL"
  | "FLOATING"
  | "DARK"
  | "MELANCHOLIC"
  | "RAW"
  | "COSMIC";

export interface Set {
  id: string;
  title: string;
  description: string;
  genre: string;
  mood: Mood | null;
  duration: number;
  audioUrl: string;
  coverUrl: string | null;
  status: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  createdAt: Date;
  userId: string;
  user: User;
  likesCount: number;
  isLiked?: boolean;
  reactions?: ReactionCount[];
}

export interface User {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
}

export interface ReactionCount {
  emoji: string;
  count: number;
  isReacted: boolean;
}
