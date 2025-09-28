"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthCallback() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log("=== AUTH CALLBACK HANDLER ===");
    console.log("Status:", status);
    console.log("Session user:", session?.user);
    console.log("Is new user:", session?.user?.isNewUser);

    if (status === "loading") return; // Still loading

    if (status === "authenticated" && session) {
      if (session.user?.isNewUser) {
        console.log("Redirecting new user to registration");
        router.push("/register");
      } else {
        console.log("Redirecting existing user to home");
        router.push("/home");
      }
    } else if (status === "unauthenticated") {
      console.log("No session found, redirecting to signin");
      router.push("/signin");
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center"
         style={{ backgroundImage: "url('/assets/bg_signin.png')" }}>
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-lg">Completing sign in...</p>
      </div>
    </div>
  );
}