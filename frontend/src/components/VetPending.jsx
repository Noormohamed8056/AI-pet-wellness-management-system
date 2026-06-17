import { useNavigate } from "react-router-dom";

const VetPending = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-[#fffdf5] font-['Inter'] relative overflow-hidden">
      {/* Background gradient circles */}
      <div className="absolute -top-32 -right-36 w-80 h-80 bg-[radial-gradient(circle,rgba(250,204,21,0.35)_0%,transparent_70%)] rounded-full pointer-events-none"></div>
      <div className="absolute -bottom-36 -left-44 w-96 h-96 bg-[radial-gradient(circle,rgba(250,204,21,0.2)_0%,transparent_72%)] rounded-full pointer-events-none"></div>

      {/* Decorative paw prints */}
      <span className="absolute top-[14%] left-[10%] text-yellow-400/35 text-4xl animate-[floatPaw_6s_ease-in-out_infinite]">🐾</span>
      <span className="absolute bottom-[18%] right-[12%] text-yellow-400/35 text-3xl animate-[floatPaw_6s_ease-in-out_infinite] animation-delay-1000">🐾</span>
      <span className="absolute top-[55%] right-[22%] text-yellow-400/35 text-3xl animate-[floatPaw_6s_ease-in-out_infinite] animation-delay-2000">🐾</span>

      {/* Back to Home Link */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 text-gray-900 font-semibold text-xs z-10 hover:text-yellow-500 transition-colors"
      >
        ← Back to Home
      </button>

      {/* Main Card */}
      <div className="w-full max-w-[450px] bg-white/85 backdrop-blur-sm rounded-xl shadow-2xl border border-yellow-400/25 overflow-hidden relative z-10">
        <div className="p-8 md:p-10 text-center">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-400/20 flex items-center justify-center">
            <span className="text-4xl">⏳</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3 font-['Poppins']">
            Profile Under Review
          </h1>

          {/* Description */}
          <div className="space-y-3 mb-8">
            <p className="text-gray-600 text-sm leading-relaxed">
              Your vet profile has been submitted and is waiting for admin approval.
            </p>
            <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4">
              <p className="text-xs text-gray-700">
                <span className="font-bold text-yellow-600">⏱️ Processing time:</span> Usually takes 24-48 hours
              </p>
            </div>
            <p className="text-gray-500 text-xs">
              You will be able to log in once approved. We'll notify you via email.
            </p>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
            <span className="text-xs font-medium text-gray-600">Pending Review</span>
          </div>

          {/* Login Button */}
          <button
            onClick={() => navigate("/login")}
            className="w-full p-3.5 bg-yellow-400 text-gray-900 border-none rounded-lg text-sm font-bold uppercase tracking-wide cursor-pointer transition-all hover:bg-yellow-500 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-md hover:shadow-yellow-400/45"
          >
            ✓ Go to Login
          </button>

        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes floatPaw {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};

export default VetPending;