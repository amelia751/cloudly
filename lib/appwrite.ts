import { Client, Databases, Account, OAuthProvider } from 'appwrite';

const client = new Client();
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const account = new Account(client);
export const databases = new Databases(client);

export async function getCurrentUser() {
  try {
    return await account.get();
  } catch (error) {
    return null;
  }
} 

export async function logout() {
  try {
    await account.deleteSession('current');
    return true;
  } catch (error) {
    return false;
  }
}

export function signInWithGoogle(redirectUrl: string) {
  return account.createOAuth2Session(OAuthProvider.Google, redirectUrl, redirectUrl);
}

export { client };