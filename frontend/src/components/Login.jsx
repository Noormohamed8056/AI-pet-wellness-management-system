import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginUser({ email, password });

      const { userId, role, needsProfile, pendingApproval } = res.data;

      localStorage.setItem("userId", userId);
      localStorage.setItem("role", role);

      if (role === "ADMIN") {
        navigate("/dashboard/admin");
      }
      else if (role === "OWNER") {
        navigate("/dashboard/owner");
      }
      else if (role === "VET") {

        if (needsProfile) {
          navigate("/vet/profile/create");
        } else if (pendingApproval) {
          navigate("/vet/pending");
        } else {
          navigate("/dashboard/vet");
        }
      }

    } catch (err) {
      setError(err.response?.data || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-10 bg-[#fffdf5] font-['Inter'] relative overflow-hidden">
      {/* Background gradient circles */}
      <div className="absolute -top-32 -right-36 w-80 h-80 bg-[radial-gradient(circle,rgba(250,204,21,0.35)_0%,transparent_70%)] rounded-full pointer-events-none"></div>
      <div className="absolute -bottom-36 -left-44 w-96 h-96 bg-[radial-gradient(circle,rgba(250,204,21,0.2)_0%,transparent_72%)] rounded-full pointer-events-none"></div>

      {/* Decorative paw prints */}
      <span className="absolute top-[14%] left-[10%] text-yellow-400/35 text-4xl animate-[floatPaw_6s_ease-in-out_infinite]">🐾</span>
      <span className="absolute bottom-[18%] right-[12%] text-yellow-400/35 text-3xl animate-[floatPaw_6s_ease-in-out_infinite] animation-delay-1000">🐾</span>
      <span className="absolute top-[55%] right-[22%] text-yellow-400/35 text-3xl animate-[floatPaw_6s_ease-in-out_infinite] animation-delay-2000">🐾</span>

      {/* Back to Home Link */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 text-gray-900 font-semibold text-sm z-10 hover:text-yellow-500 transition-colors"
      >
        ← Back to Home
      </Link>

      {/* Login Card */}
      <div className="w-full max-w-[900px] bg-white/85 backdrop-blur-sm rounded-2xl shadow-2xl border border-yellow-400/25 grid grid-cols-1 md:grid-cols-[minmax(260px,1fr)_minmax(320px,420px)] overflow-hidden relative z-10">
        
        {/* Left side with image */}
        <div className="p-6 flex flex-col justify-center items-center bg-gradient-to-b from-yellow-500/10 to-yellow-500/5">
          <img
            src="https://images.pexels.com/photos/57416/cat-sweet-kitty-animals-57416.jpeg"
            alt="Happy pet"
            className="w-full max-w-[340px] rounded-2xl shadow-2xl object-cover"
          />
          <div className="mt-4 font-semibold text-gray-900 text-sm">
            Care that feels like home.
          </div>
        </div>

        {/* Right side with form */}
        <div className="p-10 md:p-9 flex items-center justify-center">
          <div className="w-full max-w-[420px]">
            {/* Paw icon */}
            <div className="w-12 h-12 rounded-full bg-yellow-400 text-gray-900 flex items-center justify-center text-2xl mb-3 shadow-lg shadow-yellow-400/40">
              🐾
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2 font-['Poppins']">
              Welcome Back
            </h2>
            <p className="text-gray-700 text-sm mb-7">
              Sign in to your Smart Pet Care account
            </p>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm animate-[slideDown_0.3s_ease-out]">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              {/* Email field */}
              <div className="mb-4">
                <label htmlFor="email" className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  disabled={loading}
                  className="w-full p-3.5 border border-transparent rounded-xl text-sm bg-gray-100 text-gray-900 transition-all focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/35 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Password field */}
              <div className="mb-4">
                <label htmlFor="password" className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full p-3.5 border border-transparent rounded-xl text-sm bg-gray-100 text-gray-900 transition-all focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/35 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Submit button */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full p-3.5 bg-yellow-400 text-gray-900 border-none rounded-full text-sm font-bold uppercase tracking-wide cursor-pointer mt-2 transition-all hover:bg-yellow-500 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-xl hover:shadow-yellow-400/45 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:transform-none"
              >
                {loading ? '⏳ Signing In...' : '✓ Sign In'}
              </button>
            </form>

            {/* Footer link */}
            <div className="text-center mt-5 text-sm text-gray-700">
              Don't have an account?{' '}
              <Link to="/register" className="text-gray-900 font-bold hover:text-yellow-500 hover:underline">
                Create one now
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Animation keyframes - add to your global CSS or create a style tag */}
      <style>{`
        @keyframes floatPaw {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .login-container {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Login;