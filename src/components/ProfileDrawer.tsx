import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as Icons from "lucide-react";
import { User, Role } from "../types";

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSelectUser: (user: User) => void;
  onRefreshAll: () => void;
  onLogout: () => void;
}

export default function ProfileDrawer({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
  onRefreshAll,
  onLogout
}: ProfileDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Edit form state
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    phone: "",
    customSize: "",
    password: "",
    picture: ""
  });

  // Sync edit form fields when entering editing mode or when user changes
  useEffect(() => {
    if (currentUser) {
      setEditForm({
        username: currentUser.username || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        customSize: currentUser.customSize || "",
        password: currentUser.password || "",
        picture: currentUser.picture || ""
      });
    }
  }, [currentUser, isEditing]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg("Profile image size must be smaller than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, picture: reader.result as string }));
        setErrorMsg("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!editForm.username || !editForm.email) {
      setErrorMsg("Username and Email address are required fields.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editForm.username,
          email: editForm.email,
          phone: editForm.phone || undefined,
          customSize: editForm.customSize || undefined,
          password: editForm.password || undefined,
          picture: editForm.picture || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to edit profile.");
      }

      // Update in local storage
      localStorage.setItem("buttons-current-user", JSON.stringify(data));
      onSelectUser(data);
      onRefreshAll();
      setIsEditing(false);
      setSuccessMsg("Profile details updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#000000] z-50 cursor-pointer"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 190 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white border-l border-[#EFEFEF] shadow-2xl z-50 flex flex-col justify-between font-sans text-black"
          >
            {/* Header segment */}
            <div className="p-6 border-b border-[#EFEFEF] flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="bg-magenta-light p-1.5 border border-magenta/25">
                  <Icons.User className="h-4 w-4 text-magenta" />
                </div>
                <div>
                  <h3 className="font-sans font-black uppercase tracking-widest text-[#000000] text-sm">
                    Atelier Profile
                  </h3>
                  <p className="text-[9px] text-gray-400 font-mono tracking-wider uppercase leading-none mt-1">
                    Identity & Membership Info
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-black p-1 transition-colors border-none bg-none cursor-pointer focus:outline-none"
              >
                <Icons.X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {successMsg && (
                <div className="p-3 bg-purple-50 border border-[#9C00BF]/30 text-[#9C00BF] font-mono text-[10px] uppercase tracking-wider flex items-center gap-2">
                  <Icons.Sparkles className="h-4 w-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-500 text-red-700 font-mono text-[10px] uppercase tracking-wider flex items-start gap-2">
                  <Icons.ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {!isEditing ? (
                /* VIEW PROFILE MODE */
                <div className="space-y-6">
                  <div className="flex flex-col items-center text-center space-y-4 pb-6 border-b border-[#F5F5F5]">
                    {/* Picture Avatar Container */}
                    <div className="relative group">
                      {currentUser.picture ? (
                        <img
                          src={currentUser.picture}
                          alt={currentUser.username}
                          className="h-24 w-24 object-cover border-2 border-black"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-24 w-24 bg-black text-white flex items-center justify-center font-bold text-3xl uppercase">
                          {currentUser.username.charAt(0)}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                        <label
                          htmlFor="direct-picture-upload"
                          className="text-[9px] text-white font-mono font-bold uppercase tracking-widest cursor-pointer px-2 py-1 text-center"
                        >
                          Change Photo
                        </label>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        id="direct-picture-upload"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              setErrorMsg("Profile image size must be smaller than 2MB.");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                              try {
                                const response = await fetch(`/api/users/${currentUser.id}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ picture: reader.result as string })
                                });
                                if (response.ok) {
                                  const updated = await response.json();
                                  localStorage.setItem("buttons-current-user", JSON.stringify(updated));
                                  onSelectUser(updated);
                                  onRefreshAll();
                                  setSuccessMsg("Profile photo uploaded!");
                                  setTimeout(() => setSuccessMsg(""), 3500);
                                }
                              } catch (err) {
                                console.error(err);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </div>

                    <div>
                      <h4 className="text-xl font-black uppercase tracking-wide text-black leading-none">
                        {currentUser.username}
                      </h4>
                      <p className="text-gray-400 text-xs font-mono mt-1.5">{currentUser.email}</p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 justify-center">
                      <span className="bg-magenta text-white font-mono text-[8px] font-black px-2.5 py-1 uppercase tracking-widest">
                        {currentUser.role.replace("_", " ")}
                      </span>
                      <span className="bg-gray-100 text-gray-600 border border-gray-200 font-mono text-[8px] font-bold px-2 py-1 uppercase tracking-wider">
                        {currentUser.statusCondition || "Good Standing"}
                      </span>
                    </div>
                  </div>

                  {/* Profile details details */}
                  <div className="space-y-4 font-sans text-xs">
                    <span className="text-[10px] font-mono font-black uppercase tracking-widest text-gray-400 block border-b pb-1">
                      Identity Particulars
                    </span>

                    <div className="grid grid-cols-3 py-1.5 border-b border-[#FAF9FB]">
                      <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Phone Number:</span>
                      <span className="col-span-2 text-black font-semibold text-right">
                        {currentUser.phone || <em className="text-gray-300">Not configured</em>}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 py-1.5 border-b border-[#FAF9FB]">
                      <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Calibrated Size:</span>
                      <span className="col-span-2 text-magenta font-black text-right">
                        {currentUser.customSize ? (
                          <span className="bg-magenta/10 border border-magenta/20 px-2.5 py-0.5 text-magenta font-mono text-[10px] font-bold uppercase">
                            {currentUser.customSize}
                          </span>
                        ) : (
                          <em className="text-gray-300 font-normal">No size calibrated</em>
                        )}
                      </span>
                    </div>

                    {/* Sizing Chart Tool Tab */}
                    <div className="py-2.5 border-b border-[#FAF9FB] flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Icons.Ruler className="h-4 w-4 text-magenta" />
                        <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Atelier Size Guide</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          setTimeout(() => {
                            window.dispatchEvent(new CustomEvent("open-size-guide"));
                          }, 150);
                        }}
                        className="bg-black hover:bg-magenta text-white font-mono text-[8.5px] font-black uppercase tracking-widest px-3 py-1.5 rounded-none cursor-pointer border-none transition-all"
                      >
                        Open Chart
                      </button>
                    </div>

                    <div className="grid grid-cols-3 py-1.5 border-b border-[#FAF9FB]">
                      <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Registered On:</span>
                      <span className="col-span-2 text-gray-600 text-right font-mono text-[11px]">
                        {new Date(currentUser.joinedAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric"
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Benefits Alert Box */}
                  <div className="bg-[#FAF0FF]/60 border border-[#9C00BF]/15 p-4 space-y-2">
                    <div className="text-[9px] font-black text-magenta font-mono uppercase tracking-widest flex items-center gap-1.5">
                      <Icons.Flame className="h-4 w-4" />
                      Client Privileges Applied
                    </div>
                    {currentUser.role === "student" ? (
                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        🏫 <strong>Scholar discount initialized</strong>. Verified scholar status automatically unlocks <strong>20% discount</strong> storewide.
                      </p>
                    ) : currentUser.role === "super_user" ? (
                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        🛡️ <strong>Super Administrator status</strong>. Access to inventory customization, client registers, and complaint dashboard is fully unlocked.
                      </p>
                    ) : (
                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        💼 <strong>Standard Tariff active</strong>. Fully customizable. Get premium posture-correct ateliers curated with beauty, growth, and strength.
                      </p>
                    )}
                  </div>

                  {/* Action row */}
                  <div className="pt-2">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full bg-[#000000] hover:bg-[#000000]/90 text-white font-mono font-bold text-[10px] py-3.5 rounded-none shadow-md transition-all uppercase tracking-widest cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Icons.UserCog className="h-4 w-4 text-white" />
                      Edit Profile details
                    </button>
                  </div>
                </div>
              ) : (
                /* EDIT PROFILE MODE */
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#9C00BF]">
                      EDIT DETAILS FORM
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="text-gray-400 hover:text-black font-mono text-[10px] uppercase font-bold bg-transparent border-none cursor-pointer p-0"
                    >
                      Go back
                    </button>
                  </div>

                  {/* Image edit block */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-400">Profile Photo</label>
                    <div className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-200">
                      {editForm.picture ? (
                        <img
                          src={editForm.picture}
                          alt="Preview"
                          className="w-12 h-12 object-cover border border-black"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-black text-white font-bold flex items-center justify-center text-xs">
                          {editForm.username.charAt(0) || "U"}
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          id="edit-profile-avatar-file"
                          className="hidden"
                        />
                        <label
                          htmlFor="edit-profile-avatar-file"
                          className="bg-black text-white text-[8px] font-mono font-bold uppercase tracking-widest py-1.5 px-3 rounded-none cursor-pointer hover:bg-gray-800"
                        >
                          Browse Image
                        </label>
                        {editForm.picture && (
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, picture: "" }))}
                            className="ml-2 text-red-500 hover:underline bg-transparent border-none cursor-pointer text-[9px] font-mono uppercase"
                          >
                            Clear Photo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Username / Name input */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-400">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      className="w-full bg-[#FAF9FB] border border-black text-xs px-3 py-2.5 focus:outline-none focus:border-[#9C00BF] text-black font-sans"
                    />
                  </div>

                  {/* Email input */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-400">Email address *</label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full bg-[#FAF9FB] border border-black text-xs px-3 py-2.5 focus:outline-none focus:border-[#9C00BF] text-black font-sans"
                    />
                  </div>

                  {/* Phone input */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-400">Phone Number</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="e.g. +1 555-0100"
                      className="w-full bg-[#FAF9FB] border border-black text-xs px-3 py-2.5 focus:outline-none focus:border-[#9C00BF] text-black font-sans"
                    />
                  </div>

                   {/* Custom Sizing list */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#9C00BF]">Bespoke Dress Size</label>
                    <select
                      value={editForm.customSize}
                      onChange={(e) => setEditForm({ ...editForm, customSize: e.target.value })}
                      className="w-full bg-[#FAF9FB] border border-black text-xs h-[42px] px-3 focus:outline-none focus:border-[#9C00BF]"
                    >
                      <option value="">-- No sizing selected --</option>
                      <option value="6">Size 6 (Bust 34 / Waist 25 / Hip 37)</option>
                      <option value="8">Size 8 (Bust 35 / Waist 26 / Hip 39)</option>
                      <option value="10">Size 10 (Bust 36 / Waist 28 / Hip 41)</option>
                      <option value="12">Size 12 (Bust 38 / Waist 30 / Hip 43)</option>
                      <option value="14">Size 14 (Bust 40 / Waist 32 / Hip 45)</option>
                      <option value="16">Size 16 (Bust 43 / Waist 35 / Hip 47)</option>
                      <option value="18">Size 18 (Bust 45 / Waist 36 / Hip 50)</option>
                      <option value="20">Size 20 (Bust 48 / Waist 38 / Hip 52)</option>
                      <option value="22">Size 22 (Bust 50 / Waist 40 / Hip 54)</option>
                      <option value="24">Size 24 (Bust 52 / Waist 42 / Hip 56)</option>
                    </select>
                  </div>

                  {/* Password field */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-400">Access Password</label>
                    <input
                      type="password"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      placeholder="Input security password"
                      className="w-full bg-[#FAF9FB] border border-black text-xs px-3 py-2.5 focus:outline-none focus:border-[#9C00BF] text-black font-mono"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-mono font-semibold text-[10px] py-3 uppercase tracking-widest border-none cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-black hover:bg-black/90 text-white font-mono font-bold text-[10px] py-3 uppercase tracking-widest border-none cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {loading ? (
                        <>
                          <Icons.Loader2 className="h-3 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Profile"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Logout control and Footer segment */}
            <div className="p-6 border-t border-[#EFEFEF] bg-[#FAF8FA] space-y-4 shrink-0">
              <button
                onClick={onLogout}
                className="w-full bg-red-50 hover:bg-red-100 text-red-650 hover:text-red-700 border border-red-200/50 hover:border-red-300 font-mono font-bold text-[10px] py-3 rounded-none uppercase tracking-widest cursor-pointer flex items-center justify-center gap-1.5 transition-colors focus:outline-none"
              >
                <Icons.LogOut className="h-3.5 w-3.5 text-red-600" />
                Sign Out and Exit
              </button>

              <div className="text-center space-y-2">
                <div className="flex justify-center gap-2 text-[8px] font-mono text-gray-400 uppercase tracking-widest select-none">
                  <span>BEAUTY</span>
                  <span>•</span>
                  <span>GROWTH</span>
                  <span>•</span>
                  <span>STRENGTH</span>
                </div>
                <p className="text-[9px] text-gray-400 max-w-xs mx-auto leading-relaxed select-none">
                  Empowering your transitions from academy to executive boards with tailored couture.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
