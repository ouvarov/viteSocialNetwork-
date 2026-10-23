export type PostTypes = {
  id: string;
  ownerId: string;
  imageUrl: string | null;
  text: string;
  created: string;
  likeCount: number;
  likedByMe: boolean;
};

export type ResPostTypes = {
  imageUrl?: string;
  text: string;
};

export type PostPageTypes = {
  items: PostTypes[];
  nextCursor: string | null;
};
