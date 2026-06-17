import { useLocation, useNavigate } from "react-router-dom";
import { loginUser } from "../api/api";
import { useState } from "react";

const CheckEmail = () => {
  const navigate = useNavigate();
  const { state } = useLocation(); // contains { email, password, role }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

// Deprecated: verification flow removed
  const handleVerified = async () => {
    setLoading(false);
    setError("");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-100 to-purple-200">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md text-center space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Email verification is disabled</h1>

        <p className="text-gray-600">
          Your account is ready. Click below to go to login.
        </p>


        <a
          href="https://mail.google.com"
          target="_blank"
          className="block w-full py-3 rounded-lg bg-violet-200 hover:bg-violet-300 font-semibold"
        >
          Open Gmail
        </a>

        <button
          onClick={handleVerified}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-violet-600 text-white hover:bg-violet-700"
        >
          {loading ? "Checking..." : "I’ve Verified"}
        </button>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={() => navigate("/register")}
          className="text-sm text-gray-500 hover:underline"
        >
          ← Back to Register
        </button>
      </div>
    </div>
  );
};

export default CheckEmail;
