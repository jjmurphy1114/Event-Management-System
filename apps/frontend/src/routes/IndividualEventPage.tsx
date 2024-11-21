import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { database } from "../../../backend/firebaseConfig";
import { ref, get, update } from "firebase/database";
import Event from "../../../backend/Event";
import Guest from "../../../backend/Guest";
import User from "../../../backend/User";
import { getAuth } from "firebase/auth";

const IndividualEventPage = () => {
  
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [maleGuestName, setMaleGuestName] = useState("");
  const [femaleGuestName, setFemaleGuestName] = useState("");
  const [error, setError] = useState("");
  const [userNames, setUserNames] = useState<{ [key: string]: string }>({});
  const [eventName, setEventName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;

  // Fetch event details from the Firebase Realtime Database when the component mounts
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const eventRef = ref(database, `events/${id}`);
        const snapshot = await get(eventRef);
        if (snapshot.exists()) {
          setEvent(snapshot.val());
        } else {
          setError("Event not found.");
        }
      } catch (fetchError) {
        console.error("Error fetching event data:", fetchError);
        setError("Failed to load event data.");
      } finally {
        setLoading(false);
      }
    };

    const fetchAdminStatus = async () => {
      try {
        if (user) {
          const userRef = ref(database, `users/${user.uid}`);
          const snapshot = await get(userRef);
          if (snapshot.exists() && snapshot.val().status === "Admin") {
            setIsAdmin(true);
          }
        }
      } catch (fetchError) {
        console.error("Error fetching user data:", fetchError);
      }
    };

    fetchEvent();
    fetchAdminStatus();
  }, [id, user]);

  // Guarded render
  if (loading) {
    return <div className="text-center mt-20 text-gray-700 text-xl">Loading event details...</div>;
  }

  if (error) {
    return <div className="text-center mt-20 text-red-500 text-xl">{error}</div>;
  }

  if (!event) {
    return <div className="text-center mt-20 text-gray-700 text-xl">No event data available.</div>;
  }

  // Function to count the number of guests added by a specific user
  const countUserGuests = (guestList: Guest[], userId: string) => {
    return guestList.filter(guest => guest.addedBy === userId).length;
  };

  // Function to handle adding a guest (either male or female) to the event
  const handleAddGuest = async (gender: 'male' | 'female') => {
    if (!event || !user) return; // Ensure event and user are available

    const userId = user.uid;
    // Count the number of male and female guests added by the current user
    const userAddedMales = countUserGuests(event.maleGuestList || [], userId);
    const userAddedFemales = countUserGuests(event.femaleGuestList || [], userId);
    const totalUserGuests = userAddedMales + userAddedFemales;

    // Maximum limits for male, female, and total guests
    const maxMales = event.maxMales;
    const maxFemales = event.maxFemales;
    const maxGuests = event.maxGuests;

    // Determine the new guest's name based on gender
    const newGuestName = gender === 'male' ? maleGuestName : femaleGuestName;
    if (!newGuestName) {
      setError(`Guest name cannot be empty.`);
      return;
    }

    // Check if the user can add more guests
    if (isAdmin || totalUserGuests < maxGuests) {
      if (gender === 'male' && (isAdmin || userAddedMales < maxMales)) {
        const newGuest = new Guest(newGuestName, userId, false);
        const updatedMaleGuestList = [...(event.maleGuestList || []), newGuest].filter(Boolean);

        try {
          const eventRef = ref(database, `events/${id}`);
          await update(eventRef, { maleGuestList: updatedMaleGuestList });
          setEvent(prevEvent => ({
            ...prevEvent!,
            maleGuestList: updatedMaleGuestList,
          }));
          setMaleGuestName("");
          setError("");
        } catch (error) {
          console.error("Error updating male guest list: ", error);
        }
      } else if (gender === 'female' && (isAdmin || userAddedFemales < maxFemales)) {
        const newGuest = new Guest(newGuestName, userId, false);
        const updatedFemaleGuestList = [...(event.femaleGuestList || []), newGuest].filter(Boolean);

        try {
          const eventRef = ref(database, `events/${id}`);
          await update(eventRef, { femaleGuestList: updatedFemaleGuestList });
          setEvent(prevEvent => ({
            ...prevEvent!,
            femaleGuestList: updatedFemaleGuestList,
          }));
          setFemaleGuestName("");
          setError("");
        } catch (error) {
          console.error("Error updating female guest list: ", error);
        }
      } else {
        setError(`Invite limit for ${gender} guests reached.`);
      }
    } else {
      const newGuest = new Guest(newGuestName, userId, false);
      if (gender === 'male') {
        const updatedMaleWaitList = [...(event.maleWaitList || []), newGuest].filter(Boolean);

        try {
          const eventRef = ref(database, `events/${id}`);
          await update(eventRef, { maleWaitList: updatedMaleWaitList });
          setEvent(prevEvent => ({
            ...prevEvent!,
            maleWaitList: updatedMaleWaitList,
          }));
        } catch (error) {
          console.error("Error updating male waitlist: ", error);
        }
      } else {
        const updatedFemaleWaitList = [...(event.femaleWaitList || []), newGuest].filter(Boolean);

        try {
          const eventRef = ref(database, `events/${id}`);
          await update(eventRef, { femaleWaitList: updatedFemaleWaitList });
          setEvent(prevEvent => ({
            ...prevEvent!,
            femaleWaitList: updatedFemaleWaitList,
          }));
        } catch (error) {
          console.error("Error updating female waitlist: ", error);
        }
      }

      setError("Added to waitlist due to " + `${gender}` + " invite limit.");
      if (gender === 'male') {
        setMaleGuestName("");
      } else {
        setFemaleGuestName("");
      }
    }
  };

  // Function to get a user's name from their ID
  const getNameFromID = async (userID: string) => {
    try {
      // Reference to the user's data in Firebase
      const userRef = ref(database, `users/${userID}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        return snapshot.val().displayName; // Return the user's name if it exists
      } else {
        console.error("No user found with ID: ", userID); // Log an error if no user is found
        return "Unknown User";
      }
    } catch (error) {
      console.error("Error fetching user name: ", error); // Log an error if fetching fails
      return "Unknown User";
    }
  };

  // Function to get and cache the user's name to avoid multiple fetches
  const fetchUserName = async (userID: string) => {
    if (userNames[userID]) {
      return userNames[userID]; // Return cached name if available
    } else {
      const displayName = await getNameFromID(userID);
      setUserNames(prevNames => ({ ...prevNames, [userID]: displayName })); // Cache the name
      return displayName;
    }
  }

  // Function to handle deleting guests from the list and on firebase
  const handleDeleteGuest = async (
    gender: 'male' | 'female',
    index: number,
    listType: 'guestList' | 'waitList'
  ) => {
    if (!event || !user) return;
  
    try {
      if (gender === 'male') {
        if (listType === 'guestList') {
          const updatedMaleGuestList = event.maleGuestList.filter((_, i) => i !== index).filter(Boolean);
          const eventRef = ref(database, `events/${id}`);
          await update(eventRef, { maleGuestList: updatedMaleGuestList });
          setEvent((prevEvent) => ({
            ...prevEvent!,
            maleGuestList: updatedMaleGuestList,
          }));
        } else if (listType === 'waitList') {
          const updatedMaleWaitList = event.maleWaitList.filter((_, i) => i !== index).filter(Boolean);
          const eventRef = ref(database, `events/${id}`);
          await update(eventRef, { maleWaitList: updatedMaleWaitList });
          setEvent((prevEvent) => ({
            ...prevEvent!,
            maleWaitList: updatedMaleWaitList,
          }));
        }
      } else if (gender === 'female') {
        if (listType === 'guestList') {
          const updatedFemaleGuestList = event.femaleGuestList.filter((_, i) => i !== index).filter(Boolean);
          const eventRef = ref(database, `events/${id}`);
          await update(eventRef, { femaleGuestList: updatedFemaleGuestList });
          setEvent((prevEvent) => ({
            ...prevEvent!,
            femaleGuestList: updatedFemaleGuestList,
          }));
        } else if (listType === 'waitList') {
          const updatedFemaleWaitList = event.femaleWaitList.filter((_, i) => i !== index).filter(Boolean);
          const eventRef = ref(database, `events/${id}`);
          await update(eventRef, { femaleWaitList: updatedFemaleWaitList });
          setEvent((prevEvent) => ({
            ...prevEvent!,
            femaleWaitList: updatedFemaleWaitList,
          }));
        }
      }
    } catch (error) {
      console.error('Error deleting guest: ', error);
    }
  };

  // Extract male and female guests from the event object
  const maleGuests = event.maleGuestList || [];
  const femaleGuests = event.femaleGuestList || [];
  const maleWaitListed = event.maleWaitList || [];
  const femaleWaitListed = event.femaleWaitList || [];

  return (
    <div className="w-screen h-screen grid flex-col grid-cols-2 items-start bg-white shadow overflow-auto">
      <h1 className="text-4xl font-bold text-center col-span-full mt-20 text-gray-800 w-100 h-10">{eventName}</h1>
      <div className="text-2xl font-bold text-center col-span-full mt-3 text-red-600 w-100 h-10">
        {/* Error message */}
        {error && <p className="text-red-500 text-center font-medium mb-2">{error}</p>}
      </div>
      {/* Male Guests Section */}
      <>
      <div id="Male Section">
      <div className="flex-1 m-10">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">Male Guests</h2>
        <div>
          <div className="flex space-x-4 mb-5">
            <input
              type="text"
              value={maleGuestName}
              onChange={(e) => setMaleGuestName(e.target.value)}
              placeholder="Enter male guest name"
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={() => handleAddGuest('male')}
              className="bg-blue-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-600"
            >
              Add
            </button>
          </div>
        </div>
        <div className="mb-8 space-y-4">
          {maleGuests.length > 0 ? (
            maleGuests.map((guest, index) => (
              <div key={index} className="bg-blue-100 p-4 rounded-lg shadow-md flex justify-between items-center">
                <div className="grid-rows-2">
                  <p className="text-lg font-semibold text-gray-700">{guest.name}</p>
                  <p className="text-sm text-gray-700">Added By: {userNames[guest.addedBy] || (() => { fetchUserName(guest.addedBy); return 'Loading...'; })()}</p>
                </div>
                {(user?.uid === guest.addedBy || isAdmin) && (
                    <button
                      onClick={() => handleDeleteGuest('male', index, 'guestList')}
                      className="mt-2 bg-red-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-600 justify-end"
                    >
                      Delete
                    </button>
                  )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No male guests added yet.</p>
          )}
        </div>
      </div>

      {/* Male Waitlist Section */}
      <div className="flex-1 m-10">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">Male Waitlist</h2>
        <div>
        </div>
        <div className="mb-8 space-y-4">
          {maleWaitListed.length > 0 ? (
            maleWaitListed.map((guest, index) => (
              <div key={index} className="bg-blue-100 p-4 rounded-lg shadow-md flex justify-between items-center">
                <div className="grid-rows-2">
                  <p className="text-lg font-semibold text-gray-700">{guest.name}</p>
                  <p className="text-sm text-gray-700">Added By: {userNames[guest.addedBy] || (() => { fetchUserName(guest.addedBy); return 'Loading...'; })()}</p>
                </div>
                {(user?.uid === guest.addedBy || isAdmin) && (
                    <button
                      onClick={() => handleDeleteGuest('male', index, 'waitList')}
                      className="mt-2 bg-red-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-600 justify-end"
                    >
                      Delete
                    </button>
                  )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No male guests on the waitlist yet.</p>
          )}
        </div>
      </div>
      </div>

      {/* Female Guests Section */}
      <div id="Female Section">
      <div className="flex-1 m-10">
        <h2 className="text-3xl font-bold mb-4 text-center text-gray-800">Female Guests</h2>
        <div>
          <div className="flex space-x-4 mb-5">
            <input
              type="text"
              value={femaleGuestName}
              onChange={(e) => setFemaleGuestName(e.target.value)}
              placeholder="Enter female guest name"
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
            <button
              onClick={() => handleAddGuest('female')}
              className="bg-pink-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-pink-600"
            >
              Add
            </button>
          </div>
        </div>
        <div className="mb-8 space-y-4">
        {femaleGuests.length > 0 ? (
              femaleGuests.map((guest, index) => (
                <div key={index} className="bg-pink-100 p-4 rounded-lg shadow-md flex justify-between items-center">
                  <div className="grid-rows-2">
                    <p className="text-lg font-semibold text-gray-700">{guest.name}</p>
                    <p className="text-sm text-gray-700">Added By: {userNames[guest.addedBy] || (() => { fetchUserName(guest.addedBy); return 'Loading...'; })()}</p>
                  </div>
                  {(user?.uid === guest.addedBy || isAdmin) && (
                    <button
                      onClick={() => handleDeleteGuest('female', index, 'guestList')}
                      className="ml-auto bg-red-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500">No female guests added yet.</p>
            )}
        </div>
      </div>

      {/* Female Waitlist Section */}
      <div className="flex-1 m-10">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">Female Waitlist</h2>
        <div>
        </div>
        <div className="mb-8 space-y-4">
        {femaleWaitListed.length > 0 ? (
              femaleWaitListed.map((guest, index) => (
                <div key={index} className="bg-pink-100 p-4 rounded-lg shadow-md flex justify-between items-center">
                  <div className="grid-rows-2">
                    <p className="text-lg font-semibold text-gray-700">{guest.name}</p>
                    <p className="text-sm text-gray-700">Added By: {userNames[guest.addedBy] || (() => { fetchUserName(guest.addedBy); return 'Loading...'; })()}</p>
                  </div>
                  {(user?.uid === guest.addedBy || isAdmin) && (
                    <button
                      onClick={() => handleDeleteGuest('female', index, 'waitList')}
                      className="ml-auto bg-red-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500">No female guests added to waitlist</p>
            )}
        </div>
      </div>
      </div>
      </>
    </div>
  );
};

export default IndividualEventPage;
