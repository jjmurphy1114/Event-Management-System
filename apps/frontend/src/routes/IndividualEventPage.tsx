import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { database } from "../../../backend/firebaseConfig";
import { ref, get, update} from "firebase/database";
import Event from "../../../backend/Event";
import Guest from "../../../backend/Guest";
import User from "../../../backend/User";
import { getAuth } from "firebase/auth";

const IndividualEventPage = () => {
  
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestName, setGuestName] = useState("");
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");
  const [userNames, setUserNames] = useState<{ [key: string]: string }>({});
  const [eventName, setEventName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;

  // Fetch event details from the Firebase Realtime Database when the component mounts
  useEffect(() => {
    const fetchEventAndUserData = async () => {
      try {
        // Fetch event data
        const eventRef = ref(database, `events/${id}`);
        const snapshot = await get(eventRef);
        if (snapshot.exists()) {
          const eventData = snapshot.val();
          setEvent(eventData);
          setEventName(eventData.name);
  
          // Ensure that guest lists are defined
          const maleGuestList = eventData.maleGuestList || [];
          const femaleGuestList = eventData.femaleGuestList || [];
          const maleWaitList = eventData.maleWaitList ? [...eventData.maleWaitList] : [];
          const femaleWaitList = eventData.femaleWaitList ? [...eventData.femaleWaitList] : [];

          // Display error if the event is closed
          if (!eventData.open) {
            setError("The event list is currently closed and no guests can be added");
          }

  
          // Fetch user names for all guests
          const guestListUserIDs = [
            ...new Set([
              ...maleGuestList.map((g: Guest) => g.addedBy),
              ...femaleGuestList.map((g: Guest) => g.addedBy),
              ...maleWaitList.map((g: Guest) => g.addedBy),
              ...femaleWaitList.map((g: Guest) => g.addedBy),
            ]),
          ];
  
          const userNamesTemp: { [key: string]: string } = {};
          for (const userId of guestListUserIDs) {
            const userRef = ref(database, `users/${userId}`);
            const userSnapshot = await get(userRef);
            if (userSnapshot.exists()) {
              userNamesTemp[userId] = userSnapshot.val().displayName;
            } else {
              userNamesTemp[userId] = "Unknown User";
            }
          }
  
          setUserNames(userNamesTemp);
        } else {
          setError("Event not found.");
        }

        // Fetch admin status for the current user
        if (user) {
          const userRef = ref(database, `users/${user.uid}`);
          const userSnapshot = await get(userRef);
          if (userSnapshot.exists() && userSnapshot.val().status === "Admin") {
            setIsAdmin(true);
          }
        }
      } catch (fetchError) {
        console.error("Error fetching data:", fetchError);
        setError("Failed to load event or user data.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchEventAndUserData();
  }, [id, user]);

  // Guarded render
  if (loading) {
    return <div className="text-center mt-20 text-gray-700 text-xl">Loading event details...</div>;
  }

  if (!event) {
    return <div className="text-center mt-20 text-gray-700 text-xl">No event data available.</div>;
  }

  // Function to count the number of guests added by a specific user
  const countUserGuests = (guestList: Guest[], userId: string) => {
    return guestList.filter(guest => guest.addedBy === userId).length;
  };

  // Function to count the number of guests added by a specific user
  const handleAddGuest = async (gender: 'male' | 'female') => {
    if (!event || !user) {
      console.error("Event or user not available. Event:", event, "User:", user);
      return;
    }

    if (!event.open) {
      return;
    }
  
    const userId = user.uid;
    const newGuestName = gender === 'male' ? guestName : guestName;
  
    // Ensure guest name is provided
    if (!newGuestName) {
      setError(`Guest name cannot be empty.`);
      console.warn("Guest name was empty.");
      return;
    }
  
    // Flatten the newGuest object to ensure Firebase compatibility
    const newGuestData = { name: newGuestName, addedBy: userId };
    const userAddedMales = countUserGuests(event.maleGuestList || [], userId);
    const userAddedFemales = countUserGuests(event.femaleGuestList || [], userId);
    const totalUserGuests = userAddedMales + userAddedFemales;
  
    const maxMales = event.maxMales;
    const maxFemales = event.maxFemales;
    const maxGuests = event.maxGuests;
  
    try {
      if (isAdmin || totalUserGuests < maxGuests) {
        if (gender === 'male' && (isAdmin || userAddedMales < maxMales)) {
          console.log("Adding male guest to guest list:", newGuestData);
          const updatedMaleGuestList = [...(event.maleGuestList || []), newGuestData];
          const eventRef = ref(database, `events/${id}`);
  
          await update(eventRef, { maleGuestList: updatedMaleGuestList });
          console.log("Successfully updated male guest list in Firebase.");
  
          // Update state with new guest list
          setEvent((prevEvent) => ({
            ...prevEvent!,
            maleGuestList: updatedMaleGuestList,
          }));
  
          setGuestName('');
          setError('');
          setNotification("Male guest added successfully")
        } else if (gender === 'female' && (isAdmin || userAddedFemales < maxFemales)) {
          console.log("Adding female guest to guest list:", newGuestData);
          const updatedFemaleGuestList = [...(event.femaleGuestList || []), newGuestData];
          const eventRef = ref(database, `events/${id}`);
  
          await update(eventRef, { femaleGuestList: updatedFemaleGuestList });
          console.log("Successfully updated female guest list in Firebase.");
  
          // Update state with new guest list
          setEvent((prevEvent) => ({
            ...prevEvent!,
            femaleGuestList: updatedFemaleGuestList,
          }));
  
          setGuestName('');
          setError('');
          setNotification("Female guest added successfully")
        } else {
          setNotification(`Invite limit for ${gender} guests reached.`);
          console.warn(`Invite limit for ${gender} guests reached.`);
        }
      } else {
        // Add to waitlist if the user has reached their max invites
        console.log("Adding guest to waitlist due to max invite limit.");
        await handleAddToWaitlist(gender, newGuestData);
      }
    } catch (error) {
      console.error(`Error adding ${gender} guest: `, error);
      setError(`Failed to add ${gender} guest. Please try again.`);
    }
  };
  
  // Function to handle adding a guest to the waitlist
  const handleAddToWaitlist = async (gender: 'male' | 'female', newGuestData: { name: string, addedBy: string }) => {
    console.log("handleAddToWaitlist called with gender:", gender, "New guest data:", newGuestData);
  
    if (!event) {
      console.error("Event not available when trying to add to waitlist.");
      return;
    }
  
    try {
      const eventRef = ref(database, `events/${id}`);
  
      if (gender === 'male') {
        const updatedMaleWaitList = [...(event.maleWaitList || []), newGuestData];
  
        console.log("Updating male waitlist in Firebase:", updatedMaleWaitList);
        await update(eventRef, { maleWaitList: updatedMaleWaitList });
        console.log("Successfully updated male waitlist in Firebase.");
  
        // Update the state to reflect the new waitlist
        setEvent((prevEvent) => ({
          ...prevEvent!,
          maleWaitList: updatedMaleWaitList,
        }));
        setGuestName('');
        setNotification(`Added to waitlist due to male invite limit.`);
      } else {
        const updatedFemaleWaitList = [...(event.femaleWaitList || []), newGuestData];
  
        console.log("Updating female waitlist in Firebase:", updatedFemaleWaitList);
        await update(eventRef, { femaleWaitList: updatedFemaleWaitList });
        console.log("Successfully updated female waitlist in Firebase.");
  
        // Update the state to reflect the new waitlist
        setEvent((prevEvent) => ({
          ...prevEvent!,
          femaleWaitList: updatedFemaleWaitList,
        }));
        setGuestName('');
        setNotification(`Added to waitlist due to female invite limit.`);
      }
    } catch (error) {
      console.error(`Error updating ${gender} waitlist: `, error);
      setError(`Failed to add guest to ${gender} waitlist. Please try again.`);
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
          const updatedMaleGuestList = event.maleGuestList.filter((_, i) => i !== index);
          const eventRef = ref(database, `events/${id}`);
          await update(eventRef, { maleGuestList: updatedMaleGuestList });
          setEvent((prevEvent) => ({
            ...prevEvent!,
            maleGuestList: updatedMaleGuestList,
          }));
        } else if (listType === 'waitList') {
          const updatedMaleWaitList = event.maleWaitList.filter((_, i) => i !== index);
          const eventRef = ref(database, `events/${id}`);
          await update(eventRef, { maleWaitList: updatedMaleWaitList });
          setEvent((prevEvent) => ({
            ...prevEvent!,
            maleWaitList: updatedMaleWaitList,
          }));
        }
      } else if (gender === 'female') {
        if (listType === 'guestList') {
          const updatedFemaleGuestList = event.femaleGuestList.filter((_, i) => i !== index);
          const eventRef = ref(database, `events/${id}`);
          await update(eventRef, { femaleGuestList: updatedFemaleGuestList });
          setEvent((prevEvent) => ({
            ...prevEvent!,
            femaleGuestList: updatedFemaleGuestList,
          }));
        } else if (listType === 'waitList') {
          const updatedFemaleWaitList = event.femaleWaitList.filter((_, i) => i !== index);
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
  // Filtered guest lists based on search input
  const filteredMaleGuests = event?.maleGuestList?.filter((guest: Guest) =>
    guest.name.toLowerCase().includes(guestName.toLowerCase())
  ) || [];
  const filteredFemaleGuests = event?.femaleGuestList?.filter((guest: Guest) =>
    guest.name.toLowerCase().includes(guestName.toLowerCase())
  ) || [];
  const filteredMaleWaitListed = event?.maleWaitList?.filter((guest: Guest) =>
    guest.name.toLowerCase().includes(guestName.toLowerCase())
  ) || [];
  const filteredFemaleWaitListed = event?.femaleWaitList?.filter((guest: Guest) =>
    guest.name.toLowerCase().includes(guestName.toLowerCase())
  ) || [];

return (
<div className="w-screen h-screen grid flex-col grid-cols-2 items-start bg-white shadow overflow-auto">
      <h1 className="text-4xl font-bold text-center col-span-full mt-20 text-gray-800 w-100 h-10">{eventName}</h1>
      <div className="text-2xl font-bold text-center col-span-full mt-3 text-red-600 w-100 h-10">
       {/* Error message */}
       <div className="min-h-[2rem]">
       {error && <p className="text-red-500 text-center font-medium mb-2 min-h-[2rem]">{error}</p>}
       </div>
        {/* Notification message */}
        <div className="min-h-[2rem]">
        {notification && <p className="text-green-500 text-center font-medium mb-2 min-h-[2rem]">{notification}</p>}
        </div>
      </div>
      {/* Search Bar and Input Section */}
      <div className="flex flex-col items-center col-span-full mb-5 w-full">
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Enter guest name"
            className="w-2/3 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex space m-2 ">
            <button
              onClick={() => handleAddGuest('male')}
              className="bg-blue-500 text-white mx-4 my-2 rounded-md font-semibold hover:bg-blue-600 p-2"
            >
              Add Male
            </button>
            <button
                onClick={() => handleAddGuest('female')}
                className="bg-pink-500 text-white mx-4 my-2 rounded-md font-semibold hover:bg-pink-600 p-2"
              >
                Add Female
            </button>
          </div>
      </div>
      {/* Guest Section */}
      <div className="flex flex-col md:grid md:grid-cols-2 sm:grid-cols lg:col-span-full gap-4 w-full">
      {/* Male Guests Section */}
      <>
      <div id="Male Section">
      <div className="flex-1 m-10 md:col-span-full md:w-auto">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">Male Guests</h2>
        <div>
        </div>
        <div className="mb-8 space-y-4 min-h-[20rem]">
          {filteredMaleGuests.length > 0 ? (
            filteredMaleGuests.map((guest, index) => (
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
        <div className="mb-8 space-y-4 min-h-[20rem]">
          {filteredMaleWaitListed.length > 0 ? (
            filteredMaleWaitListed.map((guest, index) => (
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
        </div>
        <div className="mb-8 space-y-4 min-h-[20rem]">
        {filteredFemaleGuests.length > 0 ? (
              filteredFemaleGuests.map((guest, index) => (
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
        <div className="mb-8 space-y-4 min-h-[20rem]">
        {filteredFemaleWaitListed.length > 0 ? (
              filteredFemaleWaitListed.map((guest, index) => (
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
    </div>
  );
};

export default IndividualEventPage;
