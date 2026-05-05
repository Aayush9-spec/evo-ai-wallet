import React, { createContext, useContext, useEffect, useState } from "react";
import {
    User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendEmailVerification,
    signInWithPopup,
    GoogleAuthProvider
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signUp: (email: string, password: string, name: string) => Promise<void>;
    logOut: () => Promise<void>;
    verifyEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const isMockMode = !import.meta.env.VITE_FIREBASE_API_KEY;

    useEffect(() => {
        if (isMockMode) {
            try {
                const mockUser = localStorage.getItem("mock_user");
                if (mockUser) {
                    setUser(JSON.parse(mockUser));
                }
            } catch (error) {
                console.error("Failed to parse mock user:", error);
                localStorage.removeItem("mock_user");
            }
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isMockMode]);

    const signIn = async (email: string, password: string) => {
        if (isMockMode) {
            const mockUser = { email, displayName: email.split('@')[0], emailVerified: true } as User;
            setUser(mockUser);
            localStorage.setItem("mock_user", JSON.stringify(mockUser));
            return;
        }
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signInWithGoogle = async () => {
        if (isMockMode) {
            const mockUser = { email: "google-user@example.com", displayName: "Google User", emailVerified: true } as User;
            setUser(mockUser);
            localStorage.setItem("mock_user", JSON.stringify(mockUser));
            return;
        }
        await signInWithPopup(auth, googleProvider);
    };

    const signUp = async (email: string, password: string, name: string) => {
        if (isMockMode) {
            const mockUser = { email, displayName: name, emailVerified: true } as User;
            setUser(mockUser);
            localStorage.setItem("mock_user", JSON.stringify(mockUser));
            return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
            displayName: name,
        });
        await userCredential.user.reload();
        setUser(auth.currentUser);
        await sendEmailVerification(userCredential.user);
    };

    const verifyEmail = async () => {
        if (isMockMode) return;
        if (auth.currentUser) {
            await sendEmailVerification(auth.currentUser);
        }
    };

    const logOut = async () => {
        if (isMockMode) {
            setUser(null);
            localStorage.removeItem("mock_user");
            return;
        }
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signInWithGoogle, signUp, logOut, verifyEmail }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
