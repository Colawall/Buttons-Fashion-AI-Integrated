import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as Icons from "lucide-react";
import { User, Role } from "../types";
import BrandLogo from "./BrandLogo";

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupForm, setSignupForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    role: "non_student" as Role,
    picture: ""
  });

  // Student ID card states for GAI verification
  const [studentIdBase64, setStudentIdBase64] = useState<string>("");
  const [isVerifyingStudentId, setIsVerifyingStudentId] = useState(false);
  const [studentIdVerified, setStudentIdVerified] = useState(false);
  const [studentVerificationError, setStudentVerificationError] = useState<string | null>(null);

  const isSuperAdminEmail = loginEmail.trim().toLowerCase() === "sunshinekolawole1@gmail.com";

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: isSuperAdminEmail ? "" : loginPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to log in");
      }

      // Save user to localStorage & notify success
      localStorage.setItem("buttons-current-user", JSON.stringify(data));
      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyStudentId = async () => {
    if (!studentIdBase64) {
      setStudentVerificationError("Please upload a student ID card image first.");
      return;
    }
    setIsVerifyingStudentId(true);
    setStudentVerificationError(null);
    try {
      const response = await fetch("/api/verify-student-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: studentIdBase64 })
      });
      const data = await response.json();
      if (data.valid) {
        setStudentIdVerified(true);
        setStudentVerificationError(null);
      } else {
        setStudentIdVerified(false);
        setStudentVerificationError(data.reason || "Atelier AI could not verify your student card. Please verify visibility of names and logo.");
      }
    } catch (err: any) {
      setStudentVerificationError("Connection error during AI authentication. Please try again.");
    } finally {
      setIsVerifyingStudentId(false);
    }
  };

  const handleStudentIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setStudentVerificationError("Student ID photo size must be smaller than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setStudentIdBase64(reader.result as string);
        setStudentIdVerified(false);
        setStudentVerificationError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!signupForm.username || !signupForm.email || !signupForm.password) {
      setError("Please complete all required fields (*).");
      setLoading(false);
      return;
    }

    if (signupForm.role === "student" && !studentIdVerified) {
      if (!studentIdBase64) {
        setError("Please attach a valid Student ID Card for verification to unlock your 20% discount.");
        setLoading(false);
        return;
      }

      setError(null);
      setSuccess("Authenticating your Student ID card via Atelier GAI...");
      try {
        const verifyRes = await fetch("/api/verify-student-id", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: studentIdBase64 })
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.valid) {
          setError(verifyData.reason || "Atelier AI could not verify your student card. Please check the card image and try again.");
          setLoading(false);
          return;
        }
        setStudentIdVerified(true);
        setSuccess("Atelier AI has authenticated your student status! Finalizing registry profile...");
      } catch (err) {
        setError("Atelier AI student verification server timed out. Please verify manually or retry.");
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to register profile.");
      }

      // Track newly registered user status to show size guide automatic popup later
      localStorage.setItem("is-new-user", "true");

      // Instead of logging in automatically, clear state, prefill email, route to login tab and prompt
      const registeredEmail = signupForm.email;
      setSignupForm({
        username: "",
        email: "",
        phone: "",
        password: "",
        role: "non_student" as Role,
        picture: ""
      });
      setStudentIdBase64("");
      setStudentIdVerified(false);
      setStudentVerificationError(null);
      
      setLoginEmail(registeredEmail);
      setLoginPassword("");
      setTab("login");
      setSuccess("Your account registry has been successfully logged! Please input your password to access Buttons Atelier.");
    } catch (err: any) {
      setError(err.message || "Failed to sign up.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size must be smaller than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignupForm(prev => ({ ...prev, picture: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9FB] flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-md bg-white border-2 border-black p-8 relative flex flex-col space-y-6">
        
        {/* Absolute flat shadow style for avant-garde brutalist touch */}
        <div className="absolute top-1.5 left-1.5 -z-10 w-full h-full bg-black border-2 border-black" />

        {/* Brand Banner */}
        <div className="text-center flex flex-col items-center space-y-3">
          <BrandLogo className="h-12 w-12 text-black" color="#000000" />
          <div>
            <h1 className="text-2xl font-black tracking-[0.2em] leading-none text-black uppercase">
              BUTTONS
            </h1>
            <p className="text-[9px] text-[#000000]/70 tracking-[0.4em] uppercase font-light mt-1 pl-0.5 font-sans">
              ATELIER COUTURE
            </p>
          </div>
          <div className="flex items-center gap-2 text-[8px] font-mono tracking-widest text-gray-400 uppercase">
            <span>Beauty</span>
            <span>•</span>
            <span>Growth</span>
            <span>•</span>
            <span>Strength</span>
          </div>
        </div>

        {/* Action selector tabs */}
        <div className="flex border border-black p-1 bg-[#F5F5F5] rounded-none">
          <button
            onClick={() => { setTab("login"); setError(null); setSuccess(null); }}
            className={`flex-1 py-2 text-[10px] font-mono font-bold tracking-widest uppercase transition-colors cursor-pointer ${
              tab === "login" ? "bg-black text-white" : "text-gray-400 hover:text-black"
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => { setTab("signup"); setError(null); setSuccess(null); }}
            className={`flex-1 py-2 text-[10px] font-mono font-bold tracking-widest uppercase transition-colors cursor-pointer ${
              tab === "signup" ? "bg-black text-white" : "text-gray-400 hover:text-black"
            }`}
          >
            Create Profile
          </button>
        </div>

        {/* Dynamic Error Indicator */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 bg-red-50 border border-red-500 text-red-655 font-mono text-[10px] uppercase tracking-wider flex items-start gap-2"
            >
              <Icons.ShieldAlert className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Success Notification */}
        <AnimatePresence mode="wait">
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 bg-[#EEFDF4] border border-[#22C55E] text-[#15803D] font-mono text-[10px] uppercase tracking-wider flex items-start gap-2"
            >
              <Icons.CheckCircle2 className="h-4 w-4 shrink-0 text-[#22C55E] mt-0.5" />
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {tab === "login" ? (
            <motion.form
              key="login-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleLoginSubmit}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-500">Email Address *</label>
                <div className="relative">
                  <Icons.Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="rachel@university.edu"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-[#FAF9FB] border border-black rounded-none pl-10 pr-4 py-3 text-xs focus:outline-none text-black font-sans placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-500">
                    Password {isSuperAdminEmail ? "(Bypassed)" : "*"}
                  </label>
                </div>
                <div className="relative">
                  <Icons.Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    required={!isSuperAdminEmail}
                    disabled={isSuperAdminEmail}
                    placeholder={isSuperAdminEmail ? "No authentication password required." : "Enter account password"}
                    value={isSuperAdminEmail ? "" : loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className={`w-full border rounded-none pl-10 pr-4 py-3 text-xs focus:outline-none text-black font-mono placeholder-gray-400 ${
                      isSuperAdminEmail 
                        ? "bg-[#F3F4F6] border-dashed border-gray-300 text-gray-400 italic" 
                        : "bg-[#FAF9FB] border-black"
                    }`}
                  />
                </div>
              </div>

              {isSuperAdminEmail && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-none flex items-center gap-2 font-mono text-[9px] text-[#9C00BF] uppercase tracking-wider">
                  <Icons.Sparkles className="h-4 w-4 shrink-0 text-[#9C00BF]" />
                  <span>Sole Super Admin detected. Bypass active.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black hover:bg-black/90 disabled:bg-gray-400 text-white font-mono font-bold text-[10px] tracking-widest uppercase py-4 rounded-none border-none cursor-pointer transition-all flex items-center justify-center gap-2 shadow-md leading-none"
              >
                {loading ? (
                  <>
                    <Icons.Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Icons.Key className="h-3.5 w-3.5" />
                    Access Client Dashboard
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="signup-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSignupSubmit}
              className="space-y-4 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin"
            >
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-500">Full Name / Username *</label>
                <div className="relative">
                  <Icons.User className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rachel Foster"
                    value={signupForm.username}
                    onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                    className="w-full bg-[#FAF9FB] border border-black rounded-none pl-10 pr-4 py-3 text-xs focus:outline-none text-black font-sans placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-500">Email Address *</label>
                <div className="relative">
                  <Icons.Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. rachel@university.edu"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    className="w-full bg-[#FAF9FB] border border-black rounded-none pl-10 pr-4 py-3 text-xs focus:outline-none text-black font-sans placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-500">Phone Number</label>
                <div className="relative">
                  <Icons.Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="e.g. +1 555-0199"
                    value={signupForm.phone}
                    onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                    className="w-full bg-[#FAF9FB] border border-black rounded-none pl-10 pr-4 py-3 text-xs focus:outline-none text-black font-sans placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-500">Password *</label>
                <div className="relative">
                  <Icons.Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    placeholder="Create access password"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    className="w-full bg-[#FAF9FB] border border-black rounded-none pl-10 pr-4 py-3 text-xs focus:outline-none text-black font-mono placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-500">Membership Group / Standing Eligibility</label>
                <select
                  value={signupForm.role}
                  onChange={(e) => setSignupForm({ ...signupForm, role: e.target.value as Role })}
                  className="w-full bg-[#FAF9FB] border border-black rounded-none h-11 px-3.5 py-2 text-xs focus:outline-none font-sans cursor-pointer"
                >
                  <option value="student">Student Scholar (20% off automatic discount)</option>
                  <option value="non_student">Standard Client (Regular atelier access)</option>
                </select>
              </div>

              {signupForm.role === "student" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-2 border border-[#9C00BF]/30 bg-[#9C00BF]/5 p-3 rounded-none"
                >
                  <div className="flex items-center gap-1">
                    <Icons.Shield className="h-3.5 w-3.5 text-magenta" />
                    <span className="text-[9px] font-mono font-black uppercase tracking-widest text-magenta">Atelier ID Verification Required</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-sans leading-relaxed">
                    Under standard protocol, a valid Student ID Card is authenticated securely by our Atelier GAI in order to activate your automatic 20% membership discount.
                  </p>

                  <div className="border border-dashed border-[#9C00BF]/40 p-3 bg-white flex flex-col items-center justify-center space-y-2">
                    {studentIdBase64 ? (
                      <div className="w-full space-y-2.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={studentIdBase64}
                            alt="Student ID Preview"
                            className="w-14 h-10 object-contain border border-black rounded-none shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] text-black font-bold uppercase tracking-wider">Student ID Card</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {studentIdVerified ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-mono font-black text-[#15803D] bg-[#EEFDF4] border border-[#22C55E] uppercase tracking-wider">
                                  <Icons.CheckCircle2 className="h-2 w-2" /> Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-mono font-black text-amber-800 bg-amber-50 border border-amber-400 uppercase tracking-wider">
                                  <Icons.Loader2 className="h-2 w-2 animate-spin" /> Unverified
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setStudentIdBase64("");
                              setStudentIdVerified(false);
                              setStudentVerificationError(null);
                            }}
                            className="text-[9px] uppercase font-bold text-red-500 hover:underline bg-transparent border-none cursor-pointer p-1"
                          >
                            Remove
                          </button>
                        </div>

                        {studentVerificationError && (
                          <div className="p-2 bg-red-50 border border-red-200 text-red-655 font-mono text-[9px] uppercase tracking-wider leading-relaxed">
                            <strong>AI Rejection Reason:</strong> {studentVerificationError}
                          </div>
                        )}

                        {!studentIdVerified && (
                          <button
                            type="button"
                            disabled={isVerifyingStudentId}
                            onClick={handleVerifyStudentId}
                            className="w-full bg-black hover:bg-magenta disabled:bg-gray-400 text-white font-mono font-bold text-[9px] tracking-widest uppercase py-2 border-none cursor-pointer transition-all flex items-center justify-center gap-1.5"
                          >
                            {isVerifyingStudentId ? (
                              <>
                                <Icons.Loader2 className="h-3 w-3 animate-spin text-white" />
                                Analyzing Document...
                              </>
                            ) : (
                              <>
                                <Icons.Cpu className="h-3 w-3 text-magenta" />
                                Verify via Atelier AI
                              </>
                            )}
                          </button>
                        )}
                        {studentIdVerified && (
                          <div className="p-1.5 bg-[#EEFDF4] border border-[#22C55E] text-[#15803D] font-mono text-[9px] uppercase tracking-wide text-center">
                            🎉 Access granted by Atelier GAI
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <Icons.FileText className="h-6 w-6 text-[#9C00BF]/50" />
                        <p className="text-[9px] text-[#000000]/60 uppercase font-bold tracking-wider text-center">Upload Student ID Photo</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleStudentIdUpload}
                          className="hidden"
                          id="student-id-file-input"
                        />
                        <label
                          htmlFor="student-id-file-input"
                          className="bg-[#9C00BF] text-white text-[8px] font-mono font-bold uppercase tracking-widest py-1.5 px-3 rounded-none cursor-pointer hover:bg-magenta"
                        >
                          Select Card Image
                        </label>
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-500">Profile Identity Photo (Optional)</label>
                <div className="border border-black border-dashed p-4 flex flex-col items-center justify-center space-y-2 bg-[#FAF9FB]">
                  {signupForm.picture ? (
                    <div className="flex items-center gap-3 w-full">
                      <img
                        src={signupForm.picture}
                        alt="Preview"
                        className="w-10 h-10 rounded-full object-cover border border-black shadow"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-black font-bold truncate">Photo Attached</p>
                        <button
                          type="button"
                          onClick={() => setSignupForm(prev => ({ ...prev, picture: "" }))}
                          className="text-[9px] uppercase font-bold text-red-500 hover:underline bg-transparent border-none cursor-pointer pl-0"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Icons.Upload className="h-5 w-5 text-gray-400" />
                      <p className="text-[9px] text-[#000000]/60 uppercase font-bold tracking-wider text-center">Drag image here or click select</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="signup-img-file"
                      />
                      <label
                        htmlFor="signup-img-file"
                        className="bg-black text-white text-[8px] font-mono font-bold uppercase tracking-widest py-1.5 px-3 rounded-none cursor-pointer hover:bg-gray-800"
                      >
                        Browse File
                      </label>
                    </>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#9C00BF] hover:bg-[#9C00BF]/90 disabled:bg-gray-400 text-white font-mono font-bold text-[10px] tracking-widest uppercase py-4 rounded-none border-none cursor-pointer transition-all flex items-center justify-center gap-2 shadow-md leading-none"
              >
                {loading ? (
                  <>
                    <Icons.Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <Icons.UserPlus className="h-3.5 w-3.5" />
                    Register Account Registry
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}