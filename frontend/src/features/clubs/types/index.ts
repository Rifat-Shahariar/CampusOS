export interface ClubCount {
  events: number;
  posts: number;
}

export interface Club {
  id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  contactEmail: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: ClubCount;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ClubPostAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface ClubPost {
  id: string;
  clubId: string;
  title: string;
  content: string;
  coverImageUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUser: ClubPostAuthor;
}

export interface ClubsQueryParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface ClubPostsQueryParams {
  page?: number;
  limit?: number;
}
