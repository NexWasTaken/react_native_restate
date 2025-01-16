import { Client, Avatars, Account, OAuthProvider } from "react-native-appwrite";
import * as Linking from "expo-linking";
import { openAuthSessionAsync } from "expo-web-browser";

export const config = {
  platform: "com.nex.restate",
  endpoint: process.env["EXPO_PUBLIC_APPWRITE_ENDPOINT"]!,
  projectId: process.env["EXPO_PUBLIC_APPWRITE_PROJECT_ID"]!,
};

export const client = new Client();

client
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setPlatform(config.platform);

export const avatar = new Avatars(client);
export const account = new Account(client);

export async function login() {
  try {
    const redirectUri = Linking.createURL("/");

    const response = account.createOAuth2Token(
      OAuthProvider.Google,
      redirectUri
    );

    if (!response) throw new Error("Failed to login. What a sad day! :( [1]");

    const browserResult = await openAuthSessionAsync(
      response.toString(),
      redirectUri
    );

    console.log(browserResult);

    if (browserResult.type !== "success")
      throw new Error("Failed to login. What a sad day! :( [2]");

    const url = new URL(browserResult.url);

    const secret = url.searchParams.get("secret")?.toString();
    if (!secret)
      throw new Error(
        "Failed to get `secret` param from URL, login failed. What a sad day! :("
      );

    const userId = url.searchParams.get("userId")?.toString();
    if (!userId)
      throw new Error(
        "Failed to get `userId` param from URL, login failed. What a sad day! :("
      );

    const session = await account.createSession(userId, secret);

    if (!session)
      throw new Error("Failed to create a session. What a sad day! :(");

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function logout() {
  try {
    await account.deleteSession("current");
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function getCurrentUser() {
  try {
    const response = await account.get();

    if (response.$id) {
      const userAvatar = avatar.getInitials(response.name);
      return { ...response, avatar: userAvatar.toString() };
    } else {
      throw new Error("Unable to get account. What a sad day! :(");
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}
