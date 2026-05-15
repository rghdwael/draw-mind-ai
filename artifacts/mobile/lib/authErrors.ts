export function getAuthErrorMessage(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "Invalid email address format.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return "Incorrect email or password. Please try again.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in.";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled. Please contact support.";
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
    default:
      return "Something went wrong. Please try again.";
  }
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "Email is required.";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) return "Please enter a valid email (e.g. name@example.com).";
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
