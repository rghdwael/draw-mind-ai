// ── Server Configuration ──────────────────────────────────────────────────────
const API_URL = "http://localhost:5000"; // Change to your IP if using a physical phone

export interface StoredUser {
  name: string;
  email: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: StoredUser;
}

// ── Validation helpers (Kept exactly the same for great UX!) ──────────────

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

// ── Public API (Now talking to your FastAPI Python Kitchen!) ────────────────

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

  try {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // This catches the "Email already registered" error from FastAPI
      return { success: false, error: data.detail || "Registration failed." };
    }

    return { success: true, user: data.user };
  } catch (error) {
    console.error("Registration Error:", error);
    return { success: false, error: "Network error. Is the FastAPI server running?" };
  }
}

export async function signInUser(
  email: string,
  password: string
): Promise<AuthResult> {
  const emailErr = validateEmail(email);
  if (emailErr) return { success: false, error: emailErr };
  if (!password) return { success: false, error: "Password is required." };

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // This catches the "Invalid email or password" error from FastAPI
      return { success: false, error: data.detail || "Login failed." };
    }

    return { success: true, user: data.user };
  } catch (error) {
    console.error("Login Error:", error);
    return { success: false, error: "Network error. Is the FastAPI server running?" };
  }
}

// ── Stubbed Social Logins (To prevent app crashes if clicked) ───────────────

export async function socialLogin(
  email: string,
  name: string,
  provider: "google" | "apple"
): Promise<AuthResult> {
  // Can be wired up to FastAPI later! 
  return { success: false, error: "Social login is under construction." };
}

export async function checkEmailExists(email: string): Promise<boolean> {
  // Can be wired up later if you add a specific /check-email route in Python
  return false; 
}