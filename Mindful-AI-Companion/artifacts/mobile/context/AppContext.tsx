import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { registerUser, signInUser, socialLogin, type AuthResult } from "@/utils/authStorage";

export interface Child {
  id: string;
  name: string;
  age: number;
  gender: string;
  favoriteActivities: string;
  emotionalNotes: string;
  parentNotes: string;
  avatarColor: string;
  initials: string;
  icon: string;
}

export interface EmotionScore {
  name: string;
  percentage: number;
  color: string;
}

export interface Drawing {
  id: string;
  childId: string;
  date: string;
  pathsJson: string;
  mainEmotion: string;
  confidence: number;
  emotions: EmotionScore[];
  summary: string;
  emotionalState: string;
  socialIndicators: string;
  stressSignals: string;
  creativityLevel: number;
  confidenceLevel: number;
  imagePath?: string;
  recommendations: string[];
}

interface AppContextType {
  isLoggedIn: boolean;
  userName: string;
  userEmail: string;
  userId: number | null;
  userPhone: string;
  userRelationship: string;
  children: Child[];
  drawings: Drawing[];
  fetchDrawings: (childId: string) => Promise<void>;
  login: (email: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string, name: string, userRole: string) => Promise<AuthResult>;
  loginWithSocial: (email: string, name: string, provider: "google" | "apple") => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateUserProfile: (name: string, email: string, phone: string, relationship: string) => Promise<void>;
  addChild: (child: Omit<Child, "id">) => Promise<void>;
  updateChild: (childId: string, updates: Omit<Child, "id">) => Promise<void>;
  addDrawing: (drawing: Omit<Drawing, "id" | "date">) => Promise<string>;
  getChildDrawings: (childId: string) => Drawing[];
  deleteDrawing?: (drawingId: string, childId: string) => Promise<boolean>;
  getChildEmotionSummary: (childId: string) => string;
}

export const AppContext = createContext<AppContextType | null>(null);

const AVATAR_COLORS = ["#6C4DFF", "#FF6B9D", "#48CAE4", "#F8961E", "#90BE6D", "#F3722C", "#577590"];
const STORAGE_KEY_AUTH = "@drawmind_auth";
const STORAGE_KEY_CHILDREN = "@drawmind_children";
const STORAGE_KEY_DRAWINGS = "@drawmind_drawings";

export function AppProvider({ children: reactChildren }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("Anna");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [userRelationship, setUserRelationship] = useState("");
  const [children, setChildren] = useState<Child[]>([]);
  const [drawings, setDrawings] = useState<Drawing[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [authData, childrenData, drawingsData] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_AUTH),
          AsyncStorage.getItem(STORAGE_KEY_CHILDREN),
          AsyncStorage.getItem(STORAGE_KEY_DRAWINGS),
        ]);
        if (authData) {
          const parsed = JSON.parse(authData);
          setIsLoggedIn(parsed.isLoggedIn);
          setUserName(parsed.userName || "Anna");
          setUserEmail(parsed.userEmail || "");
          setUserPhone(parsed.userPhone || "");
          setUserRelationship(parsed.userRelationship || "");
        }
        if (childrenData) {
          const parsed = JSON.parse(childrenData);
          if (parsed.length > 0) setChildren(parsed);
        }
        if (drawingsData) {
          const parsed = JSON.parse(drawingsData);
          if (parsed.length > 0) setDrawings(parsed);
        }
      } catch {}
    })();
  }, []);

  const _persistAuth = async (name: string, email: string, id: number) => {
    // 🚨 Save userId to local storage
    const data = { isLoggedIn: true, userName: name, userEmail: email, userId: id, userPhone, userRelationship };
    await AsyncStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(data));
    setIsLoggedIn(true);
    setUserName(name);
    setUserEmail(email);
    setUserId(id); // 🚨 Fixed the capitalization here!
    await fetchChildren(email);
  };

  const login = useCallback(async (email: string, name: string) => { await _persistAuth(name, email, 0); }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const result = await signInUser(email, password);
    if (result.success && result.user) {
      // 🚨 Added (as any) to bypass the strict TypeScript check!
      await _persistAuth(result.user.name, result.user.email, (result.user as any).id || 0);
    }
    return result;
  }, []);

  const register = useCallback(async (email: string, password: string, name: string,userRole: string): Promise<AuthResult> => {
    const result = await registerUser(email, password, name, userRole);
    if (result.success && result.user) {
      // 🚨 Added (as any) here too
      await _persistAuth(result.user.name, result.user.email, (result.user as any).id || 0);
    }
    return result;
  }, []);

  const loginWithSocial = useCallback(async (email: string, name: string, provider: "google" | "apple"): Promise<AuthResult> => {
    const result = await socialLogin(email, name, provider);
    if (result.success && result.user) {
      // 🚨 Added (as any) here too
      await _persistAuth(result.user.name, result.user.email, (result.user as any).id || 0);
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify({ isLoggedIn: false })),
      AsyncStorage.removeItem(STORAGE_KEY_CHILDREN),
      AsyncStorage.removeItem(STORAGE_KEY_DRAWINGS),
    ]);
    setIsLoggedIn(false); setUserName("Anna"); setUserEmail(""); setUserPhone(""); setUserRelationship("");
    setChildren([]); setDrawings([]); 
  }, []); 

  const updateUserProfile = useCallback(async (name: string, email: string, phone: string, relationship: string) => {
    const data = { isLoggedIn: true, userName: name, userEmail: email, userPhone: phone, userRelationship: relationship };
    await AsyncStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(data));
    setUserName(name); setUserEmail(email); setUserPhone(phone); setUserRelationship(relationship);
  }, []);

  const fetchChildren = useCallback(async (email: string) => {
    try {
      const response = await fetch(`http://172.20.10.14:8000/children?user_email=${encodeURIComponent(email)}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setChildren(data.children);
        await AsyncStorage.setItem(STORAGE_KEY_CHILDREN, JSON.stringify(data.children));
      }
    } catch (error) { console.error("Error fetching children:", error); }
  }, []);

  const addChild = useCallback(async (child: Omit<Child, "id">) => {
    const avatarColor = child.avatarColor || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const icon = child.icon || "happy-outline"; // Default icon if none selected
    const initials = child.name.slice(0, 2).toUpperCase();
    
    try {
      const response = await fetch("http://172.20.10.14:8000/children", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_email: userEmail, 
          child_name: child.name, 
          age: child.age, 
          gender: child.gender,
          icon: icon,               // 🚨 SENDING THE ICON
          avatar_color: avatarColor // 🚨 SENDING THE COLOR
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const newChildForUI: Child = { ...child, id: data.child.id, name: data.child.name, avatarColor: avatarColor, initials: initials };
        const updated = [...children, newChildForUI];
        setChildren(updated);
        await AsyncStorage.setItem(STORAGE_KEY_CHILDREN, JSON.stringify(updated));
      }
    } catch (error) { console.error("Network Error adding child:", error); }
  }, [children, userEmail]);

  // ── الدالة المصححة لجلب الرسومات ──
  const fetchDrawings = useCallback(async (childId: string) => {
    try {
      const response = await fetch(`http://172.20.10.14:8000/drawings?child_id=${childId}`);
      const data = await response.json();
      if (response.ok && data.success) {
        const normalized = (data.drawings || []).map((d: any) => ({
          ...d,
          childId: String(d.childId || d.child_id || childId)
        }));
        setDrawings((prev) => {
          const others = prev.filter((d: any) => String(d.childId) !== String(childId));
          return [...others, ...normalized];
        });
        await AsyncStorage.setItem(STORAGE_KEY_DRAWINGS, JSON.stringify(data.drawings));
      }
    } catch (error) { console.error("Error fetching drawings:", error); }
  }, []);

  const updateChild = useCallback(async (childId: string, updates: Omit<Child, "id">) => {
    const updated = children.map((c: Child) => c.id === childId ? { ...c, ...updates } : c);
    setChildren(updated);
    await AsyncStorage.setItem(STORAGE_KEY_CHILDREN, JSON.stringify(updated));
  }, [children]);

  const deleteDrawing = async (drawingId: string, childId: string) => {
    try {
      const response = await fetch(`http://172.20.10.14:8000/drawings/${drawingId}`, { method: "DELETE" });
      if (response.ok) {
        if (fetchDrawings) fetchDrawings(childId);
        return true;
      }
      return false;
    } catch (error) { return false; }
  };

  const addDrawing = useCallback(async (drawing: Omit<Drawing, "id" | "date">): Promise<string> => {
    try {
      const cleanChildId = parseInt(drawing.childId.replace("child-", "")) || 1;
      const response = await fetch("http://172.20.10.14:8000 /drawings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ child_id: cleanChildId, image_path: "uploads/child_drawing_" + Date.now() + ".png", parent_explanation: drawing.summary || "No explanation", status: "analyzed" }),
      });
      const data = await response.json();
      const newDrawing: Drawing = { ...drawing, id: data.success ? String(data.drawing_id) : `drawing-${Date.now()}`, date: new Date().toISOString().split("T")[0] };
      const updated = [newDrawing, ...drawings];
      setDrawings(updated);
      await AsyncStorage.setItem(STORAGE_KEY_DRAWINGS, JSON.stringify(updated));
      return newDrawing.id;
    } catch (error) { return `drawing-${Date.now()}`; }
  }, [drawings]);

  // ── الدالة المصححة للفلترة ──
  const getChildDrawings = useCallback((childId: string) => {
    return drawings.filter((d: any) => String(d.childId) === String(childId));
  }, [drawings]);

  const getChildEmotionSummary = useCallback((childId: string) => {
    const childDrawings = getChildDrawings(childId);
    if (childDrawings.length === 0) return "No data yet";
    const happy = childDrawings.filter((d: any) => d.mainEmotion?.toLowerCase().includes("happy"));
    const pct = Math.round((happy.length / childDrawings.length) * 100);
    return `${pct}% Happy`;
  }, [getChildDrawings]);

  return (
    <AppContext.Provider value={{ isLoggedIn, userName, userEmail, userPhone, userId, userRelationship, children, drawings, fetchDrawings, login, signIn, register, loginWithSocial, logout, updateUserProfile, addChild, updateChild, addDrawing, getChildDrawings, getChildEmotionSummary , deleteDrawing}}>
      {reactChildren}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}