import { useEffect, useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { FcGoogle } from "react-icons/fc";
import { useSelector, useDispatch } from "react-redux";
import { auth, googleProvider } from "../utils/firebase";
import api from "../utils/axios";
import { setUserdata } from "../redux/userSlice";
import ChatArea from "../components/chatArea.jsx";
import SideBar from "../components/SideBar.jsx";
import Artifact from "../components/Artifact.jsx";

function Home() {
  const userData = useSelector((state) => state.user?.userData);
  const artifacts = useSelector((state) => state.message?.artifacts) ?? [];
  const [artifactOpen, setArtifactOpen] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (artifacts.length > 0) {
      setSelectedArtifact(artifacts[artifacts.length - 1]);
      setArtifactOpen(true);
    } else {
      setSelectedArtifact(null);
    }
  }, [artifacts]);

  const handleLogin = async (token) => {
    try {
      const { data } = await api.post("/api/auth/login", { token });
      dispatch(setUserdata(data));
    } catch (error) {
      console.log("Backend error:", error);
    }
  };

  const googleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      await handleLogin(token);
    } catch (error) {
      console.error("Google Login Error:", error.code, error.message);
    }
  };

  const handleSelectArtifact = (art) => {
    if (art) setSelectedArtifact(art);
    setArtifactOpen(true);
  };

  return (
    <div className="h-screen flex bg-[#07090e] text-white overflow-hidden">
      <SideBar />

      <ChatArea
        artifactOpen={artifactOpen}
        onToggleArtifact={() => setArtifactOpen((prev) => !prev)}
        onSelectArtifact={handleSelectArtifact}
      />

      {artifactOpen && (
        <Artifact
          artifact={selectedArtifact}
          onClose={() => setArtifactOpen(false)}
        />
      )}

      {!userData && (
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
              className="w-full flex items-center justify-center gap-3 py-[11px] rounded-xl text-sm font-medium text-black/90 bg-white hover:bg-gray-200 transition-all duration-150 cursor-pointer"
              onClick={googleLogin}
            >
              <FcGoogle size={15} />
              Continue With Google
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;