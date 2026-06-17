import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/api";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "OWNER",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      };

      if (!/^[6-9]\d{9}$/.test(payload.phone)) {
        setError("Phone number must be 10 digits and start with 6, 7, 8, or 9.");
        return;
      }

      const res = await registerUser(payload);

      // store newly created user id
      localStorage.setItem("userId", res.data.id);
      localStorage.setItem("role", res.data.role);

      // No verification step — go directly to login
      navigate("/login", {
        state: {
          email: form.email,
          password: form.password,
          role: res.data.role,
        },
      });


    } catch (err) {
      const data = err.response?.data;
      if (typeof data === "string") setError(data);
      else if (data?.message) setError(data.message);
      else if (data?.error) setError(`${data.error}. Please check your details.`);
      else if (err.request) setError("Backend is not running. Start the backend on port 8080.");
      else setError("Registration failed. Please check your details.");
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

      {/* Register Card - Made larger */}
      <div className="w-full max-w-[1000px] bg-white/85 backdrop-blur-sm rounded-2xl shadow-2xl border border-yellow-400/25 grid grid-cols-1 md:grid-cols-[minmax(300px,1fr)_minmax(380px,500px)] overflow-hidden relative z-10">
        
        {/* Left side with image - Made taller */}
        <div className="p-8 flex flex-col justify-center items-center bg-gradient-to-b from-yellow-500/10 to-yellow-500/5">
          <img
            src="https://images.pexels.com/photos/17055519/pexels-photo-17055519.png"
            alt="Happy pet owner with dog"
            className="w-full max-w-[380px] rounded-2xl shadow-2xl object-cover aspect-square"
          />
          <div className="mt-6 font-semibold text-gray-900 text-base">
            Join our pet-loving community!
          </div>
          <p className="text-gray-600 text-sm mt-2 text-center max-w-[300px]">
            Connect with expert vets and track your pet's health journey
          </p>
        </div>

        {/* Right side with form - Made taller with more padding */}
        <div className="p-10 md:p-12 flex items-start justify-center max-h-[90vh] overflow-y-auto">
          <div className="w-full max-w-[450px]">
            

            <h2 className="text-4xl font-bold text-gray-900 mb-2 font-['Poppins']">
              Create Account
            </h2>
            <p className="text-gray-700 text-base mb-8">
              Join Smart Pet Care today
            </p>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 text-sm animate-[slideDown_0.3s_ease-out]">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              {/* Name field */}
              <div>
                <label htmlFor="name" className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="John Doe"
                  disabled={loading}
                  className="w-full p-4 border border-transparent rounded-xl text-sm bg-gray-100 text-gray-900 transition-all focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/35 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Email field */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  disabled={loading}
                  className="w-full p-4 border border-transparent rounded-xl text-sm bg-gray-100 text-gray-900 transition-all focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/35 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Password field */}
              <div>
                <label htmlFor="password" className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full p-4 border border-transparent rounded-xl text-sm bg-gray-100 text-gray-900 transition-all focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/35 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Phone field */}
              <div>
                <label htmlFor="phone" className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  placeholder="9876543210"
                  disabled={loading}
                  className="w-full p-4 border border-transparent rounded-xl text-sm bg-gray-100 text-gray-900 transition-all focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/35 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Role selection */}
              <div>
                <label htmlFor="role" className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  I am a
                </label>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full p-4 border border-transparent rounded-xl text-sm bg-gray-100 text-gray-900 transition-all focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/35 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="OWNER">Pet Owner</option>
                  <option value="VET">Veterinarian</option>
                </select>
              </div>

              {/* Submit button */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full p-4 bg-yellow-400 text-gray-900 border-none rounded-full text-base font-bold uppercase tracking-wide cursor-pointer mt-4 transition-all hover:bg-yellow-500 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-xl hover:shadow-yellow-400/45 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:transform-none"
              >
                {loading ? '⏳ Creating Account...' : '✓ Register'}
              </button>
            </form>

            {/* Footer link */}
            <div className="text-center mt-6 text-sm text-gray-700">
              Already have an account?{' '}
              <Link to="/login" className="text-gray-900 font-bold hover:text-yellow-500 hover:underline">
                Login
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
        
        .register-container {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Register;
