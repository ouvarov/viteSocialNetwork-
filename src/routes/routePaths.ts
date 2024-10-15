const loginPage = (): string => '/sign-in';
const signUpPage = (): string => '/sign-up';
const profilePage = (userId: string): string => `/profile/${userId}`;

export { loginPage, signUpPage, profilePage };
