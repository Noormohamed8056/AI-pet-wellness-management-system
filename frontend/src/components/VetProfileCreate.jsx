import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveVetProfile, uploadVetDocuments } from "../api/api";

const VetProfileCreate = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Basic Details
  const [basicDetails, setBasicDetails] = useState({
    qualification: "",
    specialization: "",
    hospitalName: "",
    experienceYears: "",
    licenseNumber: "",
    consultationFee: "",
    bio: "",
  });

  // Step 2: Documents
  const [documents, setDocuments] = useState({
    degreeCertificate: null,
    medicalRegistrationCertificate: null,
    identityProof: null,
  });

  const handleBasicDetailsChange = (e) => {
    setBasicDetails({ ...basicDetails, [e.target.name]: e.target.value });
  };

  const handleDocumentChange = (e) => {
    setDocuments({
      ...documents,
      [e.target.name]: e.target.files[0]
    });
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Save basic profile first
      await saveVetProfile(userId, {
        ...basicDetails,
        experienceYears: parseInt(basicDetails.experienceYears),
        consultationFee: parseFloat(basicDetails.consultationFee) || 0,
      });
      
      // Move to step 2
      setStep(2);
    } catch (err) {
      setError(err.response?.data || "Failed to save profile details");
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      if (documents.degreeCertificate) {
        formData.append("degreeCertificate", documents.degreeCertificate);
      }
      
      if (documents.medicalRegistrationCertificate) {
        formData.append("medicalRegistrationCertificate", documents.medicalRegistrationCertificate);
      }
      
      if (documents.identityProof) {
        formData.append("identityProof", documents.identityProof);
      }

      // Upload documents
      await uploadVetDocuments(userId, formData);
      
      // Redirect to pending approval page
      navigate("/vet/pending");
    } catch (err) {
      setError(err.response?.data || "Failed to upload documents");
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Basic Details Form
  const renderStep1 = () => (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-[#fffdf5] font-['Inter'] relative overflow-hidden">
      {/* Background gradient circles */}
      <div className="absolute -top-32 -right-36 w-80 h-80 bg-[radial-gradient(circle,rgba(250,204,21,0.35)_0%,transparent_70%)] rounded-full pointer-events-none"></div>
      <div className="absolute -bottom-36 -left-44 w-96 h-96 bg-[radial-gradient(circle,rgba(250,204,21,0.2)_0%,transparent_72%)] rounded-full pointer-events-none"></div>

      {/* Decorative paw prints */}
      <span className="absolute top-[14%] left-[10%] text-yellow-400/35 text-4xl animate-[floatPaw_6s_ease-in-out_infinite]">🐾</span>
      <span className="absolute bottom-[18%] right-[12%] text-yellow-400/35 text-3xl animate-[floatPaw_6s_ease-in-out_infinite] animation-delay-1000">🐾</span>
      <span className="absolute top-[55%] right-[22%] text-yellow-400/35 text-3xl animate-[floatPaw_6s_ease-in-out_infinite] animation-delay-2000">🐾</span>

      {/* Back button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 text-gray-900 font-semibold text-xs z-10 hover:text-yellow-500 transition-colors"
      >
        ← Back to Home
      </button>

      {/* Main Card */}
      <div className="w-full max-w-[600px] bg-white/85 backdrop-blur-sm rounded-xl shadow-2xl border border-yellow-400/25 overflow-hidden relative z-10">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 font-['Poppins']">
                Veterinarian Profile
              </h2>
              <p className="text-xs text-gray-600 mt-1">Step 1 of 2 • Basic Information</p>
            </div>
            <span className="text-xs bg-yellow-400 text-gray-900 px-3 py-1.5 rounded-full font-bold">
              Step 1/2
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-5">
            Fill in your professional details to get started
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-xs animate-[slideDown_0.3s_ease-out]">
              {error}
            </div>
          )}

          <form onSubmit={handleStep1Submit} className="space-y-4">
            {/* Qualification */}
            <div>
              <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-1">
                Qualification <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full p-3 border border-transparent rounded-lg text-sm bg-gray-100 text-gray-900 transition-all focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/35 focus:bg-white"
                placeholder="e.g., BVSc, MVSc"
                name="qualification"
                value={basicDetails.qualification}
                onChange={handleBasicDetailsChange}
                required
              />
            </div>

            {/* Specialization */}
            <div>
              <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-1">
                Specialization <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full p-3 border border-transparent rounded-lg text-sm bg-gray-100 text-gray-900 transition-all focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/35 focus:bg-white"
                placeholder="e.g., Surgery, Dentistry"
                name="specialization"
                value={basicDetails.specialization}
                onChange={handleBasicDetailsChange}
                required
              />
            </div>

            {/* Hospital Name */}
            <div>
              <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-1">
                Hospital / Clinic Name <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full p-3 border border-transparent rounded-lg text-sm bg-gray-100 text-gray-900 transition-all focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/35 focus:bg-white"
                placeholder="Enter hospital or clinic name"
                name="hospitalName"
                value={basicDetails.hospitalName}
                onChange={handleBasicDetailsChange}
                required
              />
            </div>

            {/* Experience and License - Two columns */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-1">
                  Experience <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full p-3 border border-transparent rounded-lg text-sm bg-gray-100 text-gray-900 transition-all focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/35 focus:bg-white"
                  placeholder="Years"
                  name="experienceYears"
                  type="number"
                  min="0"
                  value={basicDetails.experienceYears}
                  onChange={handleBasicDetailsChange}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-1">
                  License Number <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full p-3 border border-transparent rounded-lg text-sm bg-gray-100 text-gray-900 transition-all focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/35 focus:bg-white"
                  placeholder="License #"
                  name="licenseNumber"
                  value={basicDetails.licenseNumber}
                  onChange={handleBasicDetailsChange}
                  required
                />
              </div>
            </div>

            {/* Consultation Fee */}
            <div>
              <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-1">
                Consultation Fee (₹)
              </label>
              <input
                className="w-full p-3 border border-transparent rounded-lg text-sm bg-gray-100 text-gray-900 transition-all focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/35 focus:bg-white"
                placeholder="Enter fee amount"
                name="consultationFee"
                type="number"
                min="0"
                step="0.01"
                value={basicDetails.consultationFee}
                onChange={handleBasicDetailsChange}
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-1">
                Professional Bio
              </label>
              <textarea
                className="w-full p-3 border border-transparent rounded-lg text-sm bg-gray-100 text-gray-900 transition-all focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/35 focus:bg-white resize-none"
                placeholder="Tell us about yourself and your experience (max 500 characters)"
                name="bio"
                rows={3}
                maxLength={500}
                value={basicDetails.bio}
                onChange={handleBasicDetailsChange}
              />
              <p className="text-right text-[10px] text-gray-500 mt-1">
                {basicDetails.bio.length}/500
              </p>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full p-3.5 bg-yellow-400 text-gray-900 border-none rounded-lg text-sm font-bold uppercase tracking-wide cursor-pointer mt-2 transition-all hover:bg-yellow-500 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-md hover:shadow-yellow-400/45 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:transform-none"
            >
              {loading ? '⏳ Saving...' : '✓ Save & Continue →'}
            </button>
          </form>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes floatPaw {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-5px);
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
      `}</style>
    </div>
  );

  // Step 2: Documents Upload Form
  const renderStep2 = () => (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-[#fffdf5] font-['Inter'] relative overflow-hidden">
      {/* Background gradient circles */}
      <div className="absolute -top-32 -right-36 w-80 h-80 bg-[radial-gradient(circle,rgba(250,204,21,0.35)_0%,transparent_70%)] rounded-full pointer-events-none"></div>
      <div className="absolute -bottom-36 -left-44 w-96 h-96 bg-[radial-gradient(circle,rgba(250,204,21,0.2)_0%,transparent_72%)] rounded-full pointer-events-none"></div>

      {/* Decorative paw prints */}
      <span className="absolute top-[14%] left-[10%] text-yellow-400/35 text-4xl animate-[floatPaw_6s_ease-in-out_infinite]">🐾</span>
      <span className="absolute bottom-[18%] right-[12%] text-yellow-400/35 text-3xl animate-[floatPaw_6s_ease-in-out_infinite] animation-delay-1000">🐾</span>
      <span className="absolute top-[55%] right-[22%] text-yellow-400/35 text-3xl animate-[floatPaw_6s_ease-in-out_infinite] animation-delay-2000">🐾</span>

      {/* Back button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 text-gray-900 font-semibold text-xs z-10 hover:text-yellow-500 transition-colors"
      >
        ← Back to Home
      </button>

      {/* Main Card */}
      <div className="w-full max-w-[600px] bg-white/85 backdrop-blur-sm rounded-xl shadow-2xl border border-yellow-400/25 overflow-hidden relative z-10">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 font-['Poppins']">
                Upload Documents
              </h2>
              <p className="text-xs text-gray-600 mt-1">Step 2 of 2 • Verification Documents</p>
            </div>
            <span className="text-xs bg-yellow-400 text-gray-900 px-3 py-1.5 rounded-full font-bold">
              Step 2/2
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-5">
            Upload required certificates (PDF only, max 5MB each)
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-xs animate-[slideDown_0.3s_ease-out]">
              {error}
            </div>
          )}

          <form onSubmit={handleStep2Submit} className="space-y-5">
            {/* Degree Certificate */}
            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                Degree Certificate <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-yellow-400/30 rounded-lg p-5 text-center hover:border-yellow-400 transition-colors bg-gray-50/50">
                <input
                  type="file"
                  name="degreeCertificate"
                  accept=".pdf,application/pdf"
                  onChange={handleDocumentChange}
                  className="hidden"
                  id="degreeCertificate"
                  required
                />
                <label htmlFor="degreeCertificate" className="cursor-pointer block">
                  {documents.degreeCertificate ? (
                    <div className="text-green-600 flex items-center justify-center gap-2">
                      <span className="text-xl">✓</span>
                      <span className="text-sm truncate max-w-[200px]">{documents.degreeCertificate.name}</span>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl mb-2">📄</div>
                      <div className="text-sm text-gray-600 font-medium">
                        Click to upload PDF
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Max size: 5MB
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Medical Registration Certificate */}
            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                Medical Registration Certificate <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-yellow-400/30 rounded-lg p-5 text-center hover:border-yellow-400 transition-colors bg-gray-50/50">
                <input
                  type="file"
                  name="medicalRegistrationCertificate"
                  accept=".pdf,application/pdf"
                  onChange={handleDocumentChange}
                  className="hidden"
                  id="medicalRegistrationCertificate"
                  required
                />
                <label htmlFor="medicalRegistrationCertificate" className="cursor-pointer block">
                  {documents.medicalRegistrationCertificate ? (
                    <div className="text-green-600 flex items-center justify-center gap-2">
                      <span className="text-xl">✓</span>
                      <span className="text-sm truncate max-w-[200px]">{documents.medicalRegistrationCertificate.name}</span>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl mb-2">📋</div>
                      <div className="text-sm text-gray-600 font-medium">
                        Click to upload PDF
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Max size: 5MB
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Identity Proof */}
            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                Identity Proof (Aadhaar/Passport) <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-yellow-400/30 rounded-lg p-5 text-center hover:border-yellow-400 transition-colors bg-gray-50/50">
                <input
                  type="file"
                  name="identityProof"
                  accept=".pdf,application/pdf"
                  onChange={handleDocumentChange}
                  className="hidden"
                  id="identityProof"
                  required
                />
                <label htmlFor="identityProof" className="cursor-pointer block">
                  {documents.identityProof ? (
                    <div className="text-green-600 flex items-center justify-center gap-2">
                      <span className="text-xl">✓</span>
                      <span className="text-sm truncate max-w-[200px]">{documents.identityProof.name}</span>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl mb-2">🆔</div>
                      <div className="text-sm text-gray-600 font-medium">
                        Click to upload PDF
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Max size: 5MB
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 p-3 border border-yellow-400 text-gray-700 rounded-lg text-sm font-bold hover:bg-yellow-50 transition-all"
              >
                ← Back
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="flex-1 p-3 bg-yellow-400 text-gray-900 border-none rounded-lg text-sm font-bold uppercase tracking-wide cursor-pointer transition-all hover:bg-yellow-500 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-md hover:shadow-yellow-400/45 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:transform-none"
              >
                {loading ? '⏳ Uploading...' : '✓ Complete Registration'}
              </button>
            </div>
          </form>

          <div className="mt-5 text-xs text-gray-500 text-center border-t border-gray-200 pt-4">
            <p>Your documents will be verified by our admin team.</p>
            <p className="mt-1">You'll be notified once approved.</p>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes floatPaw {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-5px);
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
      `}</style>
    </div>
  );

  return step === 1 ? renderStep1() : renderStep2();
};

export default VetProfileCreate;