export interface Set {
  id: string;
  title: string;
  description: string;
  genre: string;
  duration: number;
  audioUrl: string;
  coverUrl: string | null;
  status: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  createdAt: Date;
  userId: string;
  user: User;
  likesCount: number;
}

export interface User {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
}
