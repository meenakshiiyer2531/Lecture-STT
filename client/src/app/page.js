"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    if (username === "anya" && password === "12092002") {
      router.push("/dashboard/courses");
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center px-4">
      <div className="w-full max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-2 p-30">
        {/* Left - Login Form */}
        <div className="w-full md:w-[70%] md:h-[100%] bg-white/10 backdrop-blur-md p-12 rounded-3xl shadow-2xl border border-white/20">
          <h2 className="text-5xl font-extrabold text-white text-center mb-4">LOGIN</h2>
          <p className="text-center text-gray-300 mb-8 text-base">
            Welcome back! Please login to continue.
          </p>

          <input
            type="text"
            placeholder="👤 Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full mb-5 px-5 py-4 rounded-xl bg-white/10 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 text-lg"
          />
          <input
            type="password"
            placeholder="🔒 Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-8 px-5 py-4 rounded-xl bg-white/10 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 text-lg"
          />

          <button
            onClick={handleLogin}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-lg hover:scale-105 transform transition duration-300 shadow-lg hover:shadow-purple-500/50"
          >
           Login Now
          </button>
        </div>

        {/* Right - Hover Image */}
        <div className="w-full md:w-[40%] flex items-center justify-center">
          <div className="book hover:scale-105 transition-transform duration-300">
            <img
              src="/me.jpg"
              alt="Login Front"
              className="object-cover w-[360px] h-[480px] rounded-lg"
            />
            <div className="cover">
              <img
                src="/login-image.png"
                alt="Login Hover"
                className="object-cover w-[360px] h-[480px] rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Book Hover Effect CSS */}
      <style jsx>{`
        .book {
          position: relative;
          border-radius: 12px;
          width: 360px;
          height: 480px;
          background-color: whitesmoke;
          box-shadow: 0 0 25px rgba(255, 255, 255, 0.2);
          transform-style: preserve-3d;
          perspective: 2000px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cover {
          position: absolute;
          top: 0;
          background-color: lightgray;
          width: 100%;
          height: 100%;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.6s ease-in-out;
          transform-origin: 0;
          box-shadow: 1px 1px 12px #000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .book:hover .cover {
          transform: rotateY(-80deg);
        }
      `}</style>
    </div>
  );
}
