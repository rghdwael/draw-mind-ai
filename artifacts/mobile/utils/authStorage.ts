import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

const USERS_KEY = "@drawmind_registered_users";

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  provider: "email" | "google" | "apple";
  createdAt: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: StoredUser;
}

// ── Validation helpers ────────────────────────────────────────────────────────

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "Email is required.";
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!re.test(email.trim())) return "Please enter a valid email address.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}

export function validateName(name: string): string | null {
  if (!name.trim()) return "Full name is required.";
  if (name.trim().length < 2) return "Name must be at least 2 characters.";
  return null;
}

// ── Storage helpers ───────────────────────────────────────────────────────────

async function getUsers(): Promise<StoredUser[]> {
  try {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

async function saveUsers(users: StoredUser[]): Promise<void> {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

async function hashPassword(password: string, salt: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    salt + password
  );
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<AuthResult> {
  const emailErr = validateEmail(email);
  if (emailErr) return { success: false, error: emailErr };
  const passErr = validatePassword(password);
  if (passErr) return { success: false, error: passErr };
  const nameErr = validateName(name);
  if (nameErr) return { success: false, error: nameErr };

  const users = await getUsers();
  const exists = users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  );
  if (exists) {
    return {
      success: false,
      error: "An account with this email already exists.",
    };
  }

  const salt = generateId();
  const passwordHash = await hashPassword(password, salt);

  const newUser: StoredUser = {
    id: generateId(),
    email: email.trim().toLowerCase(),
    name: name.trim(),
    passwordHash,
    salt,
    provider: "email",
    createdAt: new Date().toISOString(),
  };

  await saveUsers([...users, newUser]);
  return { success: true, user: newUser };
}

export async function signInUser(
  email: string,
  password: string
): Promise<AuthResult> {
  const emailErr = validateEmail(email);
  if (emailErr) return { success: false, error: emailErr };
  if (!password) return { success: false, error: "Password is required." };

  const users = await getUsers();
  const user = users.find(
    (u) => u.email === email.trim().toLowerCase()
  );

  if (!user || user.provider !== "email") {
    return { success: false, error: "No account found with this email." };
  }

  const hash = await hashPassword(password, user.salt);
  if (hash !== user.passwordHash) {
    return { success: false, error: "Incorrect password. Please try again." };
  }

  return { success: true, user };
}

export async function socialLogin(
  email: string,
  name: string,
  provider: "google" | "apple"
): Promise<AuthResult> {
  const users = await getUsers();
  let user = users.find((u) => u.email === email.toLowerCase());

  if (!user) {
    user = {
      id: generateId(),
      email: email.toLowerCase(),
      name,
      passwordHash: "",
      salt: "",
      provider,
      createdAt: new Date().toISOString(),
    };
    await saveUsers([...users, user]);
  }

  return { success: true, user };
}

export async function checkEmailExists(email: string): Promise<boolean> {
  const users = await getUsers();
  return users.some((u) => u.email === email.trim().toLowerCase());
}
