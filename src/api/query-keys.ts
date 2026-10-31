const queryKeys = {
  users: () => ['users'] as const,
  user: (userId: string) => ['users', userId] as const,
  postLists: () => ['posts', 'list'] as const,
  userPosts: (userId: string) => ['posts', 'list', 'user', userId] as const,
  feed: () => ['posts', 'list', 'feed'] as const,
  chats: () => ['chats'] as const,
  chat: (chatId: string) => ['chats', chatId] as const,
  chatMessages: (chatId: string) => ['chats', chatId, 'messages'] as const,
};

export { queryKeys };
