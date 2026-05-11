import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

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
  recommendations: string[];
}

interface AppContextType {
  isLoggedIn: boolean;
  userName: string;
  userEmail: string;
  children: Child[];
  drawings: Drawing[];
  login: (email: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  addChild: (child: Omit<Child, "id">) => Promise<void>;
  addDrawing: (drawing: Omit<Drawing, "id" | "date">) => Promise<void>;
  getChildDrawings: (childId: string) => Drawing[];
  getChildEmotionSummary: (childId: string) => string;
}

const AppContext = createContext<AppContextType | null>(null);

const AVATAR_COLORS = [
  "#6C4DFF",
  "#FF6B9D",
  "#48CAE4",
  "#F8961E",
  "#90BE6D",
  "#F3722C",
  "#577590",
];

const MOCK_CHILDREN: Child[] = [
  {
    id: "child-rud",
    name: "Rud",
    age: 7,
    gender: "Male",
    favoriteActivities: "Drawing, Building blocks",
    emotionalNotes: "Generally happy, sometimes anxious about school",
    parentNotes: "Very creative child",
    avatarColor: "#6C4DFF",
    initials: "RD",
  },
  {
    id: "child-emmi",
    name: "Emmi",
    age: 5,
    gender: "Female",
    favoriteActivities: "Painting, Dancing",
    emotionalNotes: "Expressive and joyful",
    parentNotes: "Loves art activities",
    avatarColor: "#FF6B9D",
    initials: "EM",
  },
  {
    id: "child-alex",
    name: "Alex",
    age: 9,
    gender: "Male",
    favoriteActivities: "Reading, Lego",
    emotionalNotes: "Thoughtful and introspective",
    parentNotes: "Very mature for his age",
    avatarColor: "#48CAE4",
    initials: "AL",
  },
];

const mockEmotions1: EmotionScore[] = [
  { name: "Happiness", percentage: 92, color: "#90BE6D" },
  { name: "Anxiety", percentage: 18, color: "#F8961E" },
  { name: "Sadness", percentage: 11, color: "#577590" },
  { name: "Anger", percentage: 5, color: "#F3722C" },
];

const mockEmotions2: EmotionScore[] = [
  { name: "Happiness", percentage: 75, color: "#90BE6D" },
  { name: "Sadness", percentage: 87, color: "#577590" },
  { name: "Anxiety", percentage: 34, color: "#F8961E" },
  { name: "Anger", percentage: 12, color: "#F3722C" },
];

const mockEmotions3: EmotionScore[] = [
  { name: "Happiness", percentage: 68, color: "#90BE6D" },
  { name: "Anger", percentage: 76, color: "#F3722C" },
  { name: "Sadness", percentage: 22, color: "#577590" },
  { name: "Anxiety", percentage: 41, color: "#F8961E" },
];

const MOCK_DRAWINGS: Drawing[] = [
  {
    id: "drawing-1",
    childId: "child-rud",
    date: "2026-05-08",
    pathsJson: "[]",
    mainEmotion: "Happy",
    confidence: 92,
    emotions: mockEmotions1,
    summary:
      "This drawing suggests emotional comfort, creativity, and positive social feelings. The child appears to be in a secure and nurturing environment.",
    emotionalState: "Positive and stable emotional baseline with high energy",
    socialIndicators: "Strong peer connections, feels included and valued",
    stressSignals: "Minimal stress indicators present",
    creativityLevel: 88,
    confidenceLevel: 79,
    recommendations: [
      "Encourage outdoor play and exploration",
      "Maintain positive reinforcement strategies",
      "Continue creative activities to boost expression",
    ],
  },
  {
    id: "drawing-2",
    childId: "child-emmi",
    date: "2026-05-07",
    pathsJson: "[]",
    mainEmotion: "Sad",
    confidence: 87,
    emotions: mockEmotions2,
    summary:
      "This drawing indicates some underlying sadness. The child may be processing a recent emotional experience. Overall creative expression remains healthy.",
    emotionalState: "Experiencing mild melancholy, needs extra attention",
    socialIndicators: "Some social withdrawal, may need encouragement",
    stressSignals: "Moderate stress indicators — monitor closely",
    creativityLevel: 72,
    confidenceLevel: 55,
    recommendations: [
      "Create open conversations about feelings",
      "Schedule more play dates and social activities",
      "Offer comfort activities like drawing or reading together",
    ],
  },
  {
    id: "drawing-3",
    childId: "child-alex",
    date: "2026-05-06",
    pathsJson: "[]",
    mainEmotion: "Angry",
    confidence: 76,
    emotions: mockEmotions3,
    summary:
      "The drawing reveals feelings of frustration and anger. This is healthy emotional expression. The child is processing big feelings through art.",
    emotionalState: "Processing frustration in a healthy way through art",
    socialIndicators: "Needs help expressing feelings verbally",
    stressSignals: "Elevated stress — check for triggers at school or home",
    creativityLevel: 80,
    confidenceLevel: 64,
    recommendations: [
      "Teach emotional regulation techniques",
      "Identify and address sources of frustration",
      "Practice calming exercises together daily",
    ],
  },
  {
    id: "drawing-4",
    childId: "child-rud",
    date: "2026-05-01",
    pathsJson: "[]",
    mainEmotion: "Happy",
    confidence: 85,
    emotions: mockEmotions1,
    summary:
      "A vibrant drawing full of life and color. This child is thriving and shows excellent emotional development.",
    emotionalState: "Excellent emotional stability and positivity",
    socialIndicators: "Very socially engaged and connected",
    stressSignals: "No concerning stress signals",
    creativityLevel: 95,
    confidenceLevel: 88,
    recommendations: [
      "Maintain current positive environment",
      "Introduce new creative challenges",
      "Celebrate achievements to build confidence",
    ],
  },
];

const STORAGE_KEY_AUTH = "@drawmind_auth";
const STORAGE_KEY_CHILDREN = "@drawmind_children";
const STORAGE_KEY_DRAWINGS = "@drawmind_drawings";

export function AppProvider({ children: reactChildren }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("Anna");
  const [userEmail, setUserEmail] = useState("");
  const [children, setChildren] = useState<Child[]>(MOCK_CHILDREN);
  const [drawings, setDrawings] = useState<Drawing[]>(MOCK_DRAWINGS);

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

  const login = useCallback(async (email: string, name: string) => {
    const data = { isLoggedIn: true, userName: name, userEmail: email };
    await AsyncStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(data));
    setIsLoggedIn(true);
    setUserName(name);
    setUserEmail(email);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY_AUTH,
      JSON.stringify({ isLoggedIn: false })
    );
    setIsLoggedIn(false);
    setUserName("Anna");
    setUserEmail("");
  }, []);

  const addChild = useCallback(
    async (child: Omit<Child, "id">) => {
      const newChild: Child = {
        ...child,
        id: `child-${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
        avatarColor:
          AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
        initials: child.name.slice(0, 2).toUpperCase(),
      };
      const updated = [...children, newChild];
      setChildren(updated);
      await AsyncStorage.setItem(
        STORAGE_KEY_CHILDREN,
        JSON.stringify(updated)
      );
    },
    [children]
  );

  const addDrawing = useCallback(
    async (drawing: Omit<Drawing, "id" | "date">) => {
      const newDrawing: Drawing = {
        ...drawing,
        id: `drawing-${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
        date: new Date().toISOString().split("T")[0],
      };
      const updated = [newDrawing, ...drawings];
      setDrawings(updated);
      await AsyncStorage.setItem(
        STORAGE_KEY_DRAWINGS,
        JSON.stringify(updated)
      );
    },
    [drawings]
  );

  const getChildDrawings = useCallback(
    (childId: string) => drawings.filter((d) => d.childId === childId),
    [drawings]
  );

  const getChildEmotionSummary = useCallback(
    (childId: string) => {
      const childDrawings = drawings.filter((d) => d.childId === childId);
      if (childDrawings.length === 0) return "No data yet";
      const happy = childDrawings.filter((d) =>
        d.mainEmotion.toLowerCase().includes("happy")
      );
      const pct = Math.round((happy.length / childDrawings.length) * 100);
      return `${pct}% Happy`;
    },
    [drawings]
  );

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        userName,
        userEmail,
        children,
        drawings,
        login,
        logout,
        addChild,
        addDrawing,
        getChildDrawings,
        getChildEmotionSummary,
      }}
    >
      {reactChildren}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
