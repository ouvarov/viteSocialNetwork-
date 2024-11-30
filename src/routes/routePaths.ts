const loginPage = (): string => '/sign-in';
const signUpPage = (): string => '/sign-up';
const usersPage = (): string => '/users';
const profilePage = (userId: string): string => `/profile/${userId}`;

export { loginPage, signUpPage, profilePage, usersPage };
