export type PostTypes = {
  created: Date;
  imageUrl: string;
  ownerId: string;
  likes: string[];
  text: string;
  id: string;
};

export type ResPostTypes = {
  imageUrl?: string;
  text: string;
  ownerId: string;
};

export type PostDataTypes = {
  postsData: PostTypes[];
};
