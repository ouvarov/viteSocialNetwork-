const loginPage = (): string => '/sign-in';
const signUpPage = (): string => '/sign-up';
const usersPage = (): string => '/users';
const profilePage = (userId: string): string => `/profile/${userId}`;
const chatPage = (chatId: string): string => `/chat/${chatId}`;
const chatsPage = (): string => `/chats`;

export { loginPage, signUpPage, profilePage, usersPage, chatPage, chatsPage };
