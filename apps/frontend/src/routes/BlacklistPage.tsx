import React, { useEffect, useState } from "react";
import { ref, get, update, remove } from "firebase/database";
import { database } from "../../../backend/firebaseConfig";
import { getAuth } from "firebase/auth";

const BlacklistPage = () => {
  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestName, setGuestName] = useState("");
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchBlacklist = async () => {
      try {
        const blacklistRef = ref(database, "blacklist");
        const snapshot = await get(blacklistRef);
        if (snapshot.exists()) {
          setBlacklist(Object.values(snapshot.val()));
        } else {
          setBlacklist([]);
        }
      } catch (err) {
        console.error("Error fetching blacklist:", err);
        setError("Failed to load the blacklist.");
      } finally {
        setLoading(false);
      }
    };

    fetchBlacklist();
  }, []);

  // Ensure only admins can access this page
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists() && snapshot.val().status !== "Admin") {
          setError("Access Denied: Only admins can access this page.");
        }
      }
    };
    checkAdminStatus();
  }, [user]);

  const handleAddToBlacklist = async () => {
    if (!guestName) {
      setError("Guest name is required.");
      return;
    }

    if (blacklist.includes(guestName)) {
      setError("This guest is already on the blacklist.");
      return;
    }

    try {
      const blacklistRef = ref(database, "blacklist");
      const updatedBlacklist = [...blacklist, guestName];
      await update(blacklistRef, updatedBlacklist.reduce((obj, name, idx) => ({ ...obj, [idx]: name }), {}));
      setBlacklist(updatedBlacklist);
      setGuestName("");
      setError("");
      setNotification("Guest added to the blacklist.");
    } catch (err) {
      console.error("Error adding to blacklist:", err);
      setError("Failed to add guest to the blacklist.");
    }
  };

  const handleRemoveFromBlacklist = async (name: string) => {
    try {
      const blacklistRef = ref(database, "blacklist");
      const updatedBlacklist = blacklist.filter((guest) => guest !== name);
      await update(blacklistRef, updatedBlacklist.reduce((obj, name, idx) => ({ ...obj, [idx]: name }), {}));
      setBlacklist(updatedBlacklist);
      setNotification("Guest removed from the blacklist.");
    } catch (err) {
      console.error("Error removing from blacklist:", err);
      setError("Failed to remove guest from the blacklist.");
    }
  };

  if (loading) {
    return <div className="text-center mt-20 text-gray-700 text-xl">Loading blacklist...</div>;
  }

  if (error) {
    return <div className="text-center mt-20 text-red-500 text-xl">{error}</div>;
  }

  return (
    <div className="h-screen w-screen overflow-auto bg-gradient-to-b from-blue-50 to-gray-100 py-10 px-5 md:px-20">
      <h1 className="text-4xl font-bold text-center col-span-full mt-10 text-gray-800 w-100 h-10">Blacklist Management</h1>
      <div className="bg-white shadow-md rounded-lg p-6 mt-5">
        <div className="mb-6 justify-center">
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Enter Guest Name"
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleAddToBlacklist}
            className="mt-4 w-50 bg-red-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-600"
          >
            Add to Blacklist
          </button>
        </div>

        {notification && (
          <p className="text-green-500 text-center font-medium mt-4">{notification}</p>
        )}

        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Blacklisted Guests</h2>
        {blacklist.length > 0 ? (
          <ul className="space-y-4">
            {blacklist.map((name, idx) => (
              <li
                key={idx}
                className="p-4 border border-gray-200 rounded-lg flex justify-between items-center"
              >
                <p className="text-lg font-semibold text-gray-700">{name}</p>
                <button
                  onClick={() => handleRemoveFromBlacklist(name)}
                  className="bg-red-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-600"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No guests are currently blacklisted.</p>
        )}
      </div>
    </div>
  );
};

export default BlacklistPage;
