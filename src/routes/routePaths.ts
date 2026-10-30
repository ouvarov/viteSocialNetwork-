const feedPage = (): string => '/';
const loginPage = (): string => '/sign-in';
const signUpPage = (): string => '/sign-up';
const peoplePage = (): string => '/people';
const legacyUsersPage = (): string => '/users';
const profilePage = (userId: string): string => `/profile/${userId}`;
const chatPage = (chatId: string): string => `/chat/${chatId}`;
const chatsPage = (): string => `/chats`;

export {
  chatPage,
  chatsPage,
  feedPage,
  legacyUsersPage,
  loginPage,
  peoplePage,
  profilePage,
  signUpPage,
};
