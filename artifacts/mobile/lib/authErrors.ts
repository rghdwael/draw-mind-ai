export function getAuthErrorMessage(code: string, rawMessage?: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "Invalid email address format.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Incorrect email or password. Please try again.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in.";
    case "auth/operation-not-allowed":
    case "auth/admin-restricted-operation":
      return "This sign-in method is not enabled. Please enable Email/Password in your Firebase Console under Authentication → Sign-in method.";
    case "auth/configuration-not-found":
      return "Firebase Authentication is not configured. Please enable it in your Firebase Console.";
    case "auth/weak-password":
      return "Password is too weak. Please choose a stronger password.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in was cancelled.";
    case "auth/popup-blocked":
      return "Sign-in popup was blocked. Please allow popups for this site.";
    case "auth/requires-recent-login":
      return "Please sign in again to continue.";
    case "auth/missing-password":
      return "Please enter your password.";
    case "auth/missing-email":
      return "Please enter your email address.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using a different sign-in method.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized in Firebase. Add it under Authentication → Settings → Authorized domains.";
    case "auth/internal-error":
      return "Firebase internal error. Please check your Firebase Console configuration.";
    case "auth/app-deleted":
    case "auth/app-not-authorized":
      return "Firebase app configuration error. Please check your API key and project settings.";
    default: {
      if (!code && !rawMessage) return "Something went wrong. Please try again.";
      if (rawMessage?.includes("auth/invalid-api-key") || rawMessage?.includes("invalid-api-key")) {
        return "Invalid Firebase API key. Please check your configuration.";
      }
      if (rawMessage?.includes("not-enabled") || rawMessage?.includes("OPERATION_NOT_ALLOWED")) {
        return "Email/Password sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.";
      }
      if (rawMessage?.includes("EMAIL_NOT_FOUND") || rawMessage?.includes("INVALID_PASSWORD")) {
        return "Incorrect email or password. Please try again.";
      }
      if (rawMessage?.includes("USER_DISABLED")) {
        return "This account has been disabled.";
      }
      if (rawMessage?.includes("INVALID_LOGIN_CREDENTIALS")) {
        return "Incorrect email or password. Please try again.";
      }
      return `Something went wrong (${code || "unknown"}). Please try again.`;
    }
  }
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "Email is required.";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim()))
    return "Please enter a valid email (e.g. name@example.com).";
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
