import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { FcGoogle } from "react-icons/fc";

import { auth, googleProvider } from "../utils/firebase";
import api from "../utils/axios";

function Home() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async (token) => {
    try {
      const { data } = await api.post("/api/auth/login", { token });
      console.log("Backend data:", data);
    } catch (error) {
      console.log("Backend error:", error);
    }
  };

  const googleLogin = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);

      const token = await result.user.getIdToken();

      console.log("Firebase token:", token);

      await handleLogin(token);
    } catch (error) {
      console.error("Google Login Error:", error.code, error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-[#0d0f14] text-white overflow-hidden">
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur">
        <div className="w-[340px] bg-[#13151c] border border-white/[0.08] rounded-2xl p-7 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-[17px] font-semibold text-slate-100 tracking-tight">
              Welcome to Lumina
            </h2>

            <p className="text-[13px] text-slate-500">
              Please login to continue using the app.
            </p>
          </div>

          <button
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-[11px] rounded-xl text-sm font-medium text-black/90 bg-white hover:bg-gray-200 transition-all duration-150 cursor-pointer disabled:opacity-50"
            onClick={googleLogin}
          >
            <FcGoogle size={15} />
            {loading ? "Logging in..." : "Continue With Google"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;