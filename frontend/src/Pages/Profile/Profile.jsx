import React, { useState, useRef, useEffect } from "react";
import Navbar from "../../components/Navbar/navbar";
import Footer from "../../components/Footer/footer";
import styles from "./Profile.module.css";
import {
  Bell,
  Settings,
  Pencil,
  Check,
  X,
  Camera,
  Trash2,
  Plus,
  CheckCircle,
  CloudRain,
  Lock,
} from "lucide-react";
import { getAuth, onAuthStateChanged, updateProfile } from "firebase/auth";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
// Using Supabase for persistence (storage + database)

// Register components of ChartJS to enable Bar chart
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Initial notifications data (could be fetched later)
const notificationsInitial = [
  { id: 1, type: "New job posted", caption: "Check the latest job openings." },
  { id: 2, type: "Sale successful", caption: "Your produce has been sold." },
  { id: 3, type: "Weather alert", caption: "Rain expected tomorrow." },
];

// Default user profile data to show before data loads
const defaultProfile = {
  name: "Your Name",
  location: "Enter Location",
  job: "Job/Designation",
  image: "/logo192.png",
};

// Sample experiences initial state
const experiencesInitial = [
  { id: 1, role: "Field Supervisor", company: "Green Farms", years: 2 },
  { id: 2, role: "Market Liaison", company: "AgroMart", years: 1 },
];

// Mock data for the produce sales bar chart
const marketStatsMock = {
  labels: ["Tomatoes", "Potatoes", "Onions", "Spinach"],
  datasets: [
    {
      label: "Tons Sold",
      backgroundColor: "#29c175",
      data: [12, 19, 3, 5],
    },
  ],
};

const Profile = () => {
  // Firebase auth user and loading indicator state
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
    });
    return unsubscribe; // Cleanup listener on unmount
  }, []);

  // User profile data state + editing state
  const [profile, setProfile] = useState(defaultProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [editProfile, setEditProfile] = useState(defaultProfile);

  // Profile image preview and file selected refs
  const [imagePreview, setImagePreview] = useState(defaultProfile.image);
  const [imageFile, setImageFile] = useState(null);
  const [avatarError, setAvatarError] = useState(false);

  // Loading and status message for async ops
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Ref for hidden file input for image upload
  const fileInputRef = useRef();

  // Experience list + form and editing id states
  const [experiences, setExperiences] = useState(experiencesInitial);
  const [expForm, setExpForm] = useState({ role: "", company: "", years: "" });
  const [expEditingId, setExpEditingId] = useState(null);

  // Notification dropdown state and reference for outside clicks
  const [notifSettingsDropdown, setNotifSettingsDropdown] = useState(false);
  const notifSettingsRef = useRef(null);

  // Settings dropdown container ref (anchor for close detection)
  const settingsRef = useRef(null);

  // Notifications list + modal visibility state
  const [notifications, setNotifications] = useState(notificationsInitial);
  const [showSettings, setShowSettings] = useState(false);

// ✅ Updated apiFetch to use env vars with fallback
const apiFetch = async (path, opts = {}) => {
  const base =
    process.env.REACT_APP_API_URL || "http://localhost:4000"; // fallback for dev
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const token = await user.getIdToken();
  const headers = opts.headers || {};
  headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${base}${path}`, { ...opts, headers });
};


  // Persist experiences/notifications to backend when they change
  useEffect(() => {
    if (!firebaseUser) return;
    (async () => {
      try {
        await apiFetch("/api/profile/me/lists", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ experiences, notifications }),
        });
      } catch (err) {
        console.error("Failed to persist lists to backend:", err);
      }
    })();
  }, [experiences, notifications, firebaseUser]);

  // Update profile and preview when Firebase user data changes
  useEffect(() => {
    if (firebaseUser) {
      (async () => {
        try {
          const res = await apiFetch("/api/profile/me");
          if (res.ok) {
            const data = await res.json();
            if (data && data.found === false) {
              const merged = {
                name: firebaseUser.displayName || defaultProfile.name,
                location: defaultProfile.location,
                job: defaultProfile.job,
                image: firebaseUser.photoURL || defaultProfile.image,
              };
              setProfile(merged);
              setEditProfile(merged);
              setImagePreview(merged.image);
              return;
            }
            const merged = {
              name:
                data.name || firebaseUser.displayName || defaultProfile.name,
              location: data.location || defaultProfile.location,
              job: data.job || defaultProfile.job,
              image:
                data.image_url || firebaseUser.photoURL || defaultProfile.image,
            };
            setProfile(merged);
            setEditProfile(merged);
            setImagePreview(merged.image);
            if (data.experiences) setExperiences(data.experiences);
            if (data.notifications) setNotifications(data.notifications);
          } else {
            console.error(
              "Failed to fetch profile from backend",
              await res.text()
            );
          }
        } catch (err) {
          console.error("Error loading profile from backend:", err);
        }
      })();
    }
  }, [firebaseUser]);

  // Close notification settings dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notifSettingsRef.current &&
        !notifSettingsRef.current.contains(event.target)
      ) {
        setNotifSettingsDropdown(false);
      }
    }
    if (notifSettingsDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifSettingsDropdown]);

  // Close anchored settings dropdown when clicking outside
  useEffect(() => {
    function handleSettingsOutside(e) {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    }
    if (showSettings)
      document.addEventListener("mousedown", handleSettingsOutside);
    return () =>
      document.removeEventListener("mousedown", handleSettingsOutside);
  }, [showSettings]);

  // Show loading indicator until Firebase auth finishes
  if (authLoading) return <div>Loading...</div>;

  // Ask user to login if not authenticated
  if (!firebaseUser) return <div>Please log in.</div>;

  // Handlers for editing profile mode
  const handleEdit = () => {
    setEditProfile(profile);
    setImagePreview(profile.image);
    setIsEditing(true);
  };

  // Cancel edits and reset to existing profile state
  const handleCancel = () => {
    setEditProfile(profile);
    setImagePreview(profile.image);
    setImageFile(null);
    setIsEditing(false);
  };

  // Update form state when input changes
  const handleChange = (e) => {
    setEditProfile({ ...editProfile, [e.target.name]: e.target.value });
  };

  // Trigger the file input when user clicks profile image in edit mode
  const handleImageClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle user selecting new profile image file
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => {
        setImagePreview(evt.target.result);
        setAvatarError(false);
      };
      reader.readAsDataURL(file);
    } else {
      setStatusMsg("Please select a valid image file.");
    }
  };

  // Fallback if image fails to load
  const handleAvatarError = () => {
    setAvatarError(true);
  };

  // Save profile changes and upload new image if selected
  const handleSave = async () => {
    setLoading(true);

    let photoURL = profile.image;

    try {
      let form = new FormData();
      form.append("name", editProfile.name || "");
      form.append("location", editProfile.location || "");
      form.append("job", editProfile.job || "");
      if (imageFile) form.append("image", imageFile);
      form.append("experiences", JSON.stringify(experiences));
      form.append("notifications", JSON.stringify(notifications));

      const res = await apiFetch("/api/profile/me", {
        method: "PUT",
        body: form,
      });

      if (!res.ok) {
        setStatusMsg("Failed to save profile.");
        setLoading(false);
        return;
      }

      const updated = await res.json();
      const photo = updated.image_url || profile.image;

      try {
        await updateProfile(firebaseUser, {
          displayName: editProfile.name,
          photoURL: photo,
        });
      } catch (e) {
        console.warn("Failed to update firebase profile:", e);
      }

      setProfile({ ...editProfile, image: photo });
      setImagePreview(photo);
      setStatusMsg("Profile updated!");
      setAvatarError(false);
      setIsEditing(false);
      setImageFile(null);
    } catch (error) {
      console.error("Profile update error:", error);
      setStatusMsg("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  // Experience form input change handler
  const handleExpChange = (e) => {
    setExpForm({ ...expForm, [e.target.name]: e.target.value });
  };

  // Add or update experience entry
  const handleExpSave = () => {
    if (!expForm.role || !expForm.company || !expForm.years) {
      setStatusMsg("All fields required!");
      setTimeout(() => setStatusMsg(""), 2000);
      return;
    }
    if (expEditingId !== null) {
      setExperiences(
        experiences.map((exp) =>
          exp.id === expEditingId ? { ...exp, ...expForm } : exp
        )
      );
      setExpEditingId(null);
      setStatusMsg("Experience updated!");
    } else {
      setExperiences([
        ...experiences,
        {
          id: Date.now(),
          role: expForm.role,
          company: expForm.company,
          years: expForm.years,
        },
      ]);
      setStatusMsg("Experience added!");
    }
    setExpForm({ role: "", company: "", years: "" });
    setTimeout(() => setStatusMsg(""), 2300);
  };

  // Prepare form for editing existing experience entry
  const handleExpEdit = (exp) => {
    setExpEditingId(exp.id);
    setExpForm({
      role: exp.role,
      company: exp.company,
      years: exp.years,
    });
  };

  // Delete experience and reset editing if needed
  const handleExpDelete = (id) => {
    setExperiences(experiences.filter((exp) => exp.id !== id));
    if (expEditingId === id) setExpEditingId(null);
    setStatusMsg("Experience deleted.");
    setTimeout(() => setStatusMsg(""), 1800);
  };

  // Clear all notifications
  const handleNotifClear = () => setNotifications([]);

  // Delete a specific notification
  const handleNotifDelete = (id) =>
    setNotifications(notifications.filter((n) => n.id !== id));

  // We render an anchored settings dropdown inside the profile actions (below the buttons)

  // Main profile page render
  return (
    <div className={styles.pageBg}>
      <Navbar />
      <div className={styles.profileWrapper}>
        <div className={styles.gridContainer}>
          {/* Profile Card with image, info, and editable fields */}
          <div className={styles.profileCard}>
            <div
              className={`${styles.avatarWrapper} ${
                isEditing ? styles.avatarEdit : ""
              }`}
              onClick={handleImageClick}
              title={isEditing ? "Click to change profile image" : ""}
              style={{ cursor: isEditing ? "pointer" : "default" }}
            >
              {/* Profile image or fallback initials */}
              {!avatarError ? (
                <img
                  src={imagePreview}
                  alt="Profile"
                  className={styles.avatar}
                  onError={handleAvatarError}
                />
              ) : (
                <span className={styles.avatarFallback}>
                  {profile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </span>
              )}

              {/* File input for uploading new profile pic, shown only in edit mode */}
              {isEditing && (
                <>
                  <div className={styles.avatarOverlay}>
                    <Camera size={28} />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className={styles.avatarInput}
                    onChange={handleImageChange}
                    tabIndex={-1}
                  />
                </>
              )}
            </div>

            {/* Profile info fields (editing or display mode) */}
            <div className={styles.profileInfo}>
              {isEditing ? (
                <>
                  <input
                    className={styles.profileInput}
                    name="name"
                    value={editProfile.name}
                    onChange={handleChange}
                  />
                  <input
                    className={styles.profileInput}
                    name="location"
                    value={editProfile.location}
                    onChange={handleChange}
                  />
                  <input
                    className={styles.profileInput}
                    name="job"
                    value={editProfile.job}
                    onChange={handleChange}
                  />
                </>
              ) : (
                <>
                  <div className={styles.profileName}>{profile.name}</div>
                  <div className={styles.profileLoc}>{profile.location}</div>
                  <div className={styles.profileJob}>{profile.job}</div>
                </>
              )}
            </div>

            {/* Action buttons: Save/Cancel or Edit/Settings */}
            <div className={styles.profileActions}>
              {isEditing ? (
                <>
                  <button
                    className={styles.saveBtn}
                    aria-label="Save"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    <Check size={18} />
                    {loading ? "Saving..." : "Save"}
                  </button>
                  <button
                    className={styles.cancelBtn}
                    aria-label="Cancel"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    <X size={18} /> Cancel
                  </button>
                </>
              ) : (
                <div className={styles.settingsAnchor} ref={settingsRef}>
                  <button
                    className={styles.editBtn}
                    aria-label="Edit"
                    onClick={handleEdit}
                  >
                    <Pencil size={18} /> Edit
                  </button>
                  <button
                    className={styles.settingsBtn}
                    aria-label="Settings"
                    onClick={() => setShowSettings((s) => !s)}
                  >
                    <Settings size={18} />
                  </button>
                  {showSettings && (
                    <div
                      className={styles.settingsDropdown}
                      role="menu"
                      aria-label="Profile settings"
                    >
                      <button
                        className={styles.dropdownItem}
                        role="menuitem"
                        tabIndex={0}
                        onClick={() => {
                          /* stub */
                        }}
                      >
                        Password settings (Coming soon)
                      </button>
                      <button
                        className={styles.dropdownItem}
                        role="menuitem"
                        tabIndex={0}
                        onClick={() => {
                          /* stub */
                        }}
                      >
                        Account privacy
                      </button>
                      <button
                        className={styles.dropdownItem}
                        role="menuitem"
                        tabIndex={0}
                        onClick={() => {
                          /* stub */
                        }}
                      >
                        Notification preferences
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Status message popup */}
            {statusMsg && (
              <div className={styles.statusMessage}>{statusMsg}</div>
            )}
          </div>

          {/* Experience section with clickable edit/delete and input form */}
          <div className={styles.expCard}>
            <div className={styles.cardTitle}>Experience</div>
            <ul className={styles.expList}>
              {experiences.length === 0 ? (
                <li style={{ color: "#d4ae56" }}>No experience added.</li>
              ) : (
                experiences.map((exp) => (
                  <li key={exp.id} className={styles.expItem}>
                    <span>
                      <strong>{exp.role}</strong> @ {exp.company} — {exp.years}{" "}
                      yrs
                    </span>
                    <button
                      className={`${styles.iconBtn} ${styles.iconEdit}`}
                      aria-label="Edit Experience"
                      onClick={() => handleExpEdit(exp)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className={`${styles.iconBtn} ${styles.iconDelete}`}
                      aria-label="Delete Experience"
                      onClick={() => handleExpDelete(exp.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))
              )}
            </ul>
            <div className={styles.expForm}>
              <button
                className={`${styles.expPrimaryBtn} ${styles.expPlusBtn}`}
                aria-label={
                  expEditingId ? "Update Experience" : "Add Experience"
                }
                onClick={handleExpSave}
                title={expEditingId ? "Update" : "Add"}
              >
                {expEditingId ? <Check size={18} /> : <Plus size={18} />}
              </button>
              {expEditingId && (
                <button
                  className={styles.expCancelBtn}
                  aria-label="Cancel Experience Edit"
                  title="Cancel"
                  onClick={() => {
                    setExpEditingId(null);
                    setExpForm({ role: "", company: "", years: "" });
                  }}
                >
                  <X size={18} />
                </button>
              )}
              <input
                placeholder="Role"
                name="role"
                value={expForm.role}
                onChange={handleExpChange}
              />
              <input
                placeholder="Company"
                name="company"
                value={expForm.company}
                onChange={handleExpChange}
              />
              <input
                placeholder="Years"
                type="number"
                name="years"
                value={expForm.years}
                min="0"
                onChange={handleExpChange}
              />
            </div>
          </div>

          {/* Market statistics bar chart rendered */}
          <div className={styles.marketCard}>
            <div className={styles.cardTitle}>Market Statistics</div>
            <Bar
              data={marketStatsMock}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: true,
                  },
                  title: {
                    display: true,
                    text: "Produce Sales (Tons)",
                  },
                },
              }}
              style={{ maxWidth: 300, background: "#fff" }}
            />
          </div>

          {/* Agmarknet info card */}
          <div className={styles.agmarkCard}>
            <div className={styles.cardTitle}>Mandi Price & Market Reports</div>
            <p className={styles.agmarkDesc}>
              Stay updated with daily Mandi prices, commodity-wise price trends,
              arrivals, and market reports across India. Explore historical
              trends, compare commodities, and access state/district-wise
              dashboards to plan your sales and purchases better.
            </p>
            <a
              href="https://agmarknet.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.agmarkBtn}
            >
              Go to Agmarknet
            </a>
          </div>

          {/* Notifications panel */}
          <div className={styles.notificationsPanel}>
            <div
              className={styles.notificationsHeader}
              style={{ position: "relative" }}
            >
              <Bell size={20} />
              <span className={styles.notifTitle}>Notifications</span>
              <button
                className={styles.clearNotifLink}
                onClick={handleNotifClear}
                disabled={notifications.length === 0}
                aria-label="Clear Notifications"
              >
                Clear All
              </button>
              <button
                className={styles.settingsBtn}
                onClick={() => setNotifSettingsDropdown((prev) => !prev)}
                aria-label="Notification Settings"
                ref={notifSettingsRef}
                style={{ marginLeft: 6 }}
              >
                <Settings size={18} />
              </button>
              {notifSettingsDropdown && (
                <div
                  className={styles.notifSettingsDropdown}
                  role="menu"
                  aria-label="Notification settings"
                >
                  <button
                    className={styles.notifDropdownItem}
                    role="menuitem"
                    tabIndex={0}
                  >
                    Account privacy
                  </button>
                  <button
                    className={styles.notifDropdownItem}
                    role="menuitem"
                    tabIndex={0}
                  >
                    Notification preferences
                  </button>
                  <button
                    className={styles.notifDropdownItem}
                    role="menuitem"
                    tabIndex={0}
                  >
                    Password settings (Coming soon)
                  </button>
                </div>
              )}
            </div>

            <div className={styles.notificationsList}>
              {notifications.length === 0 ? (
                <div style={{ color: "#b7e7d1" }}>No notifications.</div>
              ) : (
                notifications.map((notif) => (
                  <div
                    className={`${styles.notificationItem} ${
                      notif.type?.toLowerCase().includes("sale")
                        ? styles.notifSuccess
                        : notif.type?.toLowerCase().includes("weather")
                        ? styles.notifWarning
                        : ""
                    }`}
                    key={notif.id}
                  >
                    <div className={styles.notifIconWrap}>
                      {notif.type?.toLowerCase().includes("sale") ? (
                        <CheckCircle size={18} />
                      ) : notif.type?.toLowerCase().includes("weather") ? (
                        <CloudRain size={18} />
                      ) : (
                        <Bell size={18} />
                      )}
                    </div>
                    <div className={styles.notifTextBlock}>
                      <div className={styles.notifType}>{notif.type}</div>
                      <div className={styles.notifCaption}>{notif.caption}</div>
                    </div>
                    <div className={styles.notifRightIcons}>
                      <Lock size={14} />
                      <button
                        className={styles.notifDeleteBtn}
                        aria-label="Delete Notification"
                        onClick={() => handleNotifDelete(notif.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Anchored dropdown replaces previous modal; rendering handled inline in profileActions */}

      <Footer />
    </div>
  );
};

export default Profile;
