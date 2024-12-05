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
  const [userStatus, setUserStatus] = useState("");
  const [hasPrivileges, setPrivileges] = useState(false);
  const [frontDoorMode, setFrontDoorMode] = useState(false);
  const [vouchGuestName, setVouchGuestName] = useState("");
  const [vouchPassword, setVouchPassword] = useState("");
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
          setFrontDoorMode(eventData.frontDoorMode || false);
  
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

        // Fetch status and social privileges for the current user
        if (user) {
          const userRef = ref(database, `users/${user.uid}`);
          const userSnapshot = await get(userRef);
          if (userSnapshot.exists()) {
            setUserStatus(userSnapshot.val().status);
            setPrivileges(userSnapshot.val().privileges);
            console.log("Privileges: ", userSnapshot.val().privileges);
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
  }, [id, user, hasPrivileges]);

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
      setError("The event is closed and no guests can be added");
      return;
    }

    if (!hasPrivileges) {
      setError("You don't have social privileges and can't add guests");
      return;
    }
  
    const userId = user.uid;
  
    // Ensure guest name is provided
    if (!guestName) {
      setError("Guest name cannot be empty.");
      return;
    }
  
    // Create new guest data
    const newGuestData = { name: guestName, addedBy: userId, checkedIn: -1 };
    const userAddedMales = countUserGuests(event.maleGuestList || [], userId);
    const userAddedFemales = countUserGuests(event.femaleGuestList || [], userId);
    const totalUserGuests = userAddedMales + userAddedFemales;
  
    const maxMales = event.maxMales;
    const maxFemales = event.maxFemales;
    const maxGuests = event.maxGuests;
  
    try {
      if (userStatus === "Admin" || totalUserGuests < maxGuests) {
        if (gender === "male" && (userStatus === "Admin" || userAddedMales < maxMales)) {
          await addGuestToMainList("maleGuestList", newGuestData);
        } else if (gender === "female" && (userStatus === "Admin" || userAddedFemales < maxFemales)) {
          await addGuestToMainList("femaleGuestList", newGuestData);
        } else {
          await handleAddToWaitlist(gender, newGuestData);
        }
      } else {
        await handleAddToWaitlist(gender, newGuestData);
      }
    } catch (error) {
      console.error(`Error adding ${gender} guest: `, error);
      setError(`Failed to add ${gender} guest. Please try again.`);
    }
  };

  // Function to add a guest to the main list
  const addGuestToMainList = async (listName: string, guestData: Guest) => {
    try {
      const updatedGuestList = [...(event![listName] || []), guestData];
      const eventRef = ref(database, `events/${id}`);
      await update(eventRef, { [listName]: updatedGuestList });

      // Update state with new guest list
      setEvent(prevEvent => ({
        ...prevEvent!,
        [listName]: updatedGuestList,
      }));

      setGuestName("");
      setError("");
      setNotification("Guest added successfully");
    } catch (error) {
      console.error(`Error updating ${listName}: `, error);
      setError(`Failed to add guest. Please try again.`);
    }
  };

  // Function to handle adding a guest to the waitlist
  const handleAddToWaitlist = async (gender: 'male' | 'female', newGuestData: Guest) => {
    const listName = gender === 'male' ? 'maleWaitList' : 'femaleWaitList';
    try {
      const updatedWaitList = [...(event![listName] || []), newGuestData];
      const eventRef = ref(database, `events/${id}`);
      await update(eventRef, { [listName]: updatedWaitList });

      // Update the state to reflect the new waitlist
      setEvent((prevEvent) => ({
        ...prevEvent!,
        [listName]: updatedWaitList,
      }));
      setGuestName('');
      setNotification(`Added to ${gender} waitlist successfully.`);
    } catch (error) {
      console.error(`Error updating ${gender} waitlist: `, error);
      setError(`Failed to add guest to ${gender} waitlist. Please try again.`);
    }
  };
  
  // Function to handle toggling front door mode
  const handleToggleFrontDoorMode = async () => {
    if (!event.open){
      try {
        const eventRef = ref(database, `events/${id}`);
        await update(eventRef, { frontDoorMode: !frontDoorMode });
        setFrontDoorMode(!frontDoorMode);
      } catch (error) {
        console.error("Error toggling front door mode: ", error);
        setError("Failed to toggle front door mode.");
      }
    } else {
      setError("List must be closed to use front door mode");
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

  // Function to handle approving a guest from the waitlist
  const handleApproveGuest = async (gender: 'male' | 'female', index: number) => {
    if (!event) {
      console.error("Event not available when trying to approve guest.");
      return;
    }
  
    try {
      const eventRef = ref(database, `events/${id}`);
      if (gender === 'male') {
        const guestToApprove = event.maleWaitList[index];
        const updatedMaleGuestList = [...(event.maleGuestList || []), guestToApprove];
        const updatedMaleWaitList = event.maleWaitList.filter((_, i) => i !== index);
  
        await update(eventRef, { maleGuestList: updatedMaleGuestList, maleWaitList: updatedMaleWaitList });
        console.log("Successfully moved male guest from waitlist to guest list in Firebase.");
        setNotification("Approved male from waitlist")
  
        setEvent((prevEvent) => ({
          ...prevEvent!,
          maleGuestList: updatedMaleGuestList,
          maleWaitList: updatedMaleWaitList,
        }));
      } else {
        const guestToApprove = event.femaleWaitList[index];
        const updatedFemaleGuestList = [...(event.femaleGuestList || []), guestToApprove];
        const updatedFemaleWaitList = event.femaleWaitList.filter((_, i) => i !== index);
  
        await update(eventRef, { femaleGuestList: updatedFemaleGuestList, femaleWaitList: updatedFemaleWaitList });
        console.log("Successfully moved female guest from waitlist to guest list in Firebase.");
        setNotification("Approved female from waitlist");
  
        setEvent((prevEvent) => ({
          ...prevEvent!,
          femaleGuestList: updatedFemaleGuestList,
          femaleWaitList: updatedFemaleWaitList,
        }));
      }
    } catch (error) {
      console.error(`Error approving ${gender} guest: `, error);
      setError(`Failed to approve ${gender} guest. Please try again.`);
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
<div className="w-screen h-screen grid flex-col grid-cols-1 md:grid-cols-2 items-start bg-gradient-to-b from-blue-50 to-gray-100 overflow-auto">
      <h1 className="text-4xl font-bold text-center col-span-full mt-20 text-gray-800 w-100 h-10">{eventName}</h1>
      {userStatus === "Admin" && (
        <div className="col-span-full mb-4 flex justify-center">
        <label htmlFor="front-door-toggle" className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              id="front-door-toggle"
              checked={frontDoorMode}
              onChange={handleToggleFrontDoorMode}
              className="sr-only"
            />
            <div className={`block w-14 h-8 rounded-full transition ${frontDoorMode ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
            <div
              className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                frontDoorMode ? 'transform translate-x-full' : ''
              }`}
            ></div>
          </div>
          <span className="ml-3 text-gray-700">Front Door Mode</span>
        </label>
      </div>
      )}
      <div className="text-2xl font-bold text-center col-span-full mt-3 text-red-600 w-100 h-10">
      {/* Error or Notification message */}
      <div className="min-h-[2rem]">
       {(error || notification) && (
         <p className={`${error ? 'text-red-500' : 'text-green-500'} text-center font-medium mb-2 min-h-[2rem]`}>
           {error || notification}
         </p>
       )}
       </div>
      </div>
       {/* Information Section */}
       <div className="text-center col-span-full mb-5 w-full">
        <p className="text-lg font-semibold text-gray-700">
          There are {event?.femaleGuestList?.length || 0} females and {event?.maleGuestList?.length || 0} males on the list for a total of {(event?.femaleGuestList?.length || 0) + (event?.maleGuestList?.length || 0)} guests.
        </p>
        <p className="text-lg font-semibold text-gray-700">
          You have added {countUserGuests(event?.femaleGuestList || [], user?.uid || '')} females and {countUserGuests(event?.maleGuestList || [], user?.uid || '')} males for a total of {countUserGuests(event?.femaleGuestList || [], user?.uid || '') + countUserGuests(event?.maleGuestList || [], user?.uid || '')}/{event.maxGuests} added.
        </p>
        <p className="text-lg font-semibold text-gray-700">
          If everyone from the approval list was added, there would be {(event?.femaleGuestList?.length || 0) + (event?.femaleWaitList?.length || 0)} females and {(event?.maleGuestList?.length || 0) + (event?.maleWaitList?.length || 0)} males on the list. For a total of {(event?.femaleGuestList?.length || 0) + (event?.femaleWaitList?.length || 0) + (event?.maleGuestList?.length || 0) + (event?.maleWaitList?.length || 0)} guests.
        </p>
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
       {/* Vouch for Guest Section (President Only)
       {userStatus === "Admin" && (
        <div className="flex flex-col items-center col-span-full mb-5 w-full">
          <input
            type="text"
            value={vouchGuestName}
            onChange={(e) => setVouchGuestName(e.target.value)}
            placeholder="Enter guest name to vouch for"
            className="w-2/3 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="password"
            value={vouchPassword}
            onChange={(e) => setVouchPassword(e.target.value)}
            placeholder="Enter password"
            className="w-2/3 border border-gray-300 rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex space m-2">
            <button
              onClick={() => handleVouchGuest('male')}
              className="bg-blue-500 text-white mx-4 my-2 rounded-md font-semibold hover:bg-blue-600 p-2"
            >
              Vouch Male
            </button>
            <button
              onClick={() => handleVouchGuest('female')}
              className="bg-pink-500 text-white mx-4 my-2 rounded-md font-semibold hover:bg-pink-600 p-2"
            >
              Vouch Female
            </button>
          </div>
        </div>
      )} */}
      {/* Guest Section */}
      <div className="flex flex-col md:grid md:grid-cols-2 sm:grid-cols-1 lg:col-span-full gap-4 w-full">
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
              <div key={index} className="bg-blue-100 p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-center w-full">
                <div className="grid-rows-2 w-full">
                  <p className="text-lg font-semibold text-gray-700">{guest.name}</p>
                  <p className="text-sm text-gray-700">Added By: {userNames[guest.addedBy] || (() => { fetchUserName(guest.addedBy); return 'Loading...'; })()}</p>
                </div>
                {(user?.uid === guest.addedBy || userStatus === "Admin") && (
                    <button
                      onClick={() => handleDeleteGuest('male', index, 'guestList')}
                      className="mt-2 sm:mt-0 bg-red-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-600"
                    >
                      Delete
                    </button>
                  )}
                   {frontDoorMode && (
                        <button
                          onClick={() => handleCheckInGuest('male', index)}
                          className="mt-2 ml-2 sm:mt-0 bg-blue-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-600"
                          disabled={guest.checkedIn !== -1}
                        >
                          {guest.checkedIn === -1 ? 'Check In' : `${guest.checkedIn}`}
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
              <div key={index} className="bg-blue-100 p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-center w-full">
                  <div className="grid-rows-2 w-full">
                  <p className="text-lg font-semibold text-gray-700">{guest.name}</p>
                  <p className="text-sm text-gray-700">Added By: {userNames[guest.addedBy] || (() => { fetchUserName(guest.addedBy); return 'Loading...'; })()}</p>
                </div>
                {(user?.uid === guest.addedBy || userStatus === "Admin") && (
                    <button
                      onClick={() => handleDeleteGuest('male', index, 'waitList')}
                      className="m-2 sm:mt-0 bg-red-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-600"
                    >
                      Delete
                    </button>
                  )}
                {(userStatus === "Admin" || userStatus === "Social") && (
                  <button
                    onClick={() => handleApproveGuest('male', index)}
                    className="m-2 sm:mt-0 bg-purple-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-purple-600"
                  >
                    Approve
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
      <div className="flex-1 m-10 md:col-span-full md:w-auto">
        <h2 className="text-3xl font-bold mb-4 text-center text-gray-800">Female Guests</h2>
        <div>
        </div>
        <div className="mb-8 space-y-4 min-h-[20rem]">
        {filteredFemaleGuests.length > 0 ? (
              filteredFemaleGuests.map((guest, index) => (
                <div key={index} className="bg-pink-100 p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-center w-full">
                  <div className="grid-rows-2 w-full">
                    <p className="text-lg font-semibold text-gray-700">{guest.name}</p>
                    <p className="text-sm text-gray-700">Added By: {userNames[guest.addedBy] || (() => { fetchUserName(guest.addedBy); return 'Loading...'; })()}</p>
                  </div>
                  {(user?.uid === guest.addedBy || userStatus === "Admin") && (
                    <button
                      onClick={() => handleDeleteGuest('female', index, 'guestList')}
                     className="mt-2 sm:mt-0 bg-red-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-600"
                    >
                      Delete
                    </button>
                  )}
                   {frontDoorMode && (
                        <button
                          onClick={() => handleCheckInGuest('female', index)}
                          className="mt-2 ml-2 sm:mt-0 bg-pink-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-pink-600"
                          disabled={guest.checkedIn !== -1}
                        >
                          {guest.checkedIn === -1 ? 'Check In' : `${guest.checkedIn}`}
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
                <div key={index} className="bg-pink-100 p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-center w-full">
                  <div className="grid-rows-2 w-full">
                    <p className="text-lg font-semibold text-gray-700">{guest.name}</p>
                    <p className="text-sm text-gray-700">Added By: {userNames[guest.addedBy] || (() => { fetchUserName(guest.addedBy); return 'Loading...'; })()}</p>
                  </div>
                  {(user?.uid === guest.addedBy || userStatus === "Admin") && (
                    <button
                      onClick={() => handleDeleteGuest('female', index, 'waitList')}
                      className="m-2 sm:mt-0 bg-red-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-600"
                    >
                      Delete
                    </button>
                  )}
                  {(userStatus === "Admin" || userStatus === "Social") && (
                  <button
                    onClick={() => handleApproveGuest('female', index)}
                    className="m-2 sm:mt-0 bg-purple-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-purple-600"
                  >
                    Approve
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
