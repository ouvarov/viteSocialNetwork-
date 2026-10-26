const queryKeys = {
  users: () => ['users'] as const,
  user: (userId: string) => ['users', userId] as const,
  posts: (userId: string) => ['users', userId, 'posts'] as const,
  chats: () => ['chats'] as const,
  chat: (chatId: string) => ['chats', chatId] as const,
};

export { queryKeys };
