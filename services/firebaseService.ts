import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { Message, ChatSession } from '../types';

// Your web app's Firebase configuration
// IMPORTANT: You need to replace this with your actual Firebase config in production
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dummy-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dummy-auth-domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dummy-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dummy-storage-bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "dummy-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "dummy-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const provider = new GoogleAuthProvider();

export const firebaseService = {
  // Authentication
  signInWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
      throw error;
    }
  },

  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },

  // Database operations
  saveChatSession: async (userId: string, chatId: string, messages: Message[], title?: string) => {
    if (!userId) return;
    
    try {
      // Determine a title if none provided (e.g. first user message)
      const chatTitle = title || (messages.find(m => m.role === 'user')?.content.substring(0, 30) || "New Chat");
      
      const sessionRef = doc(db, 'users', userId, 'chats', chatId);
      await setDoc(sessionRef, {
        id: chatId,
        userId: userId,
        title: chatTitle,
        updatedAt: Date.now()
      }, { merge: true });

      // Firestore rejects undefined values, so we stringify and parse to remove them
      const cleanMessages = JSON.parse(JSON.stringify(messages));

      const messagesRef = doc(db, 'users', userId, 'chats', chatId, 'data', 'messages');
      await setDoc(messagesRef, { messages: cleanMessages });
    } catch (error) {
      console.error("Error saving chat session", error);
      // We don't throw to prevent interrupting the chat experience
    }
  },

  getUserChatHistory: async (userId: string): Promise<ChatSession[]> => {
    if (!userId) return [];
    
    try {
      const chatsRef = collection(db, 'users', userId, 'chats');
      const q = query(chatsRef, orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const chats: ChatSession[] = [];
      querySnapshot.forEach((doc) => {
        chats.push(doc.data() as ChatSession);
      });
      
      return chats;
    } catch (error) {
      console.error("Error fetching chat history", error);
      return [];
    }
  },

  getChatMessages: async (userId: string, chatId: string): Promise<Message[]> => {
    if (!userId || !chatId) return [];
    
    try {
      const messagesRef = doc(db, 'users', userId, 'chats', chatId, 'data', 'messages');
      const docSnap = await getDoc(messagesRef);
      
      if (docSnap.exists()) {
        return docSnap.data().messages as Message[];
      }
      return [];
    } catch (error) {
      console.error("Error fetching messages", error);
      return [];
    }
  }
};
