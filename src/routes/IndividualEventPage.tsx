import {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {database} from "../services/firebaseConfig";
import {get, ref, update} from "firebase/database";
import Event, {EventType, GuestListTypes, validateAndReturnEvent} from "../types/Event";
import Guest from "../types/Guest";
import {getAuth} from "firebase/auth";
import JobsButton from "../elements/JobsButton.tsx";
import GuestList from "../elements/GuestList.tsx";

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
  const [isVouching, setIsVouching] = useState(false);
  const [blacklist, setBlacklist] = useState<string[]>([]);
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
          const validatedEventData: EventType | undefined = validateAndReturnEvent(eventData);

          if(validatedEventData) {
            setEvent(new Event(validatedEventData));
            setEventName(validatedEventData.name);
          }

          if (!eventData.open){
            setFrontDoorMode(eventData.frontDoorMode || false);
          } else {
            setFrontDoorMode(false);
          }
         
          // Ensure that guest lists are defined
          const maleGuestList = eventData.maleGuestList || [];
          const femaleGuestList = eventData.femaleGuestList || [];
          const maleWaitList = eventData.maleWaitList ? [...eventData.maleWaitList] : [];
          const femaleWaitList = eventData.femaleWaitList ? [...eventData.femaleWaitList] : [];

          // Display error if the event is closed
          if (!eventData.open) {
            setError("The event list is currently closed and no guests can be added");
          }



          // Fetch usernames for all guests
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

    const fetchBlacklist = async (): Promise<string[]> => {
      try {
        const blacklistRef = ref(database, "blacklist");
        const snapshot = await get(blacklistRef);
        if (snapshot.exists()) {
          return Object.keys(snapshot.val());
        } else {
          return [];
        }
      } catch (err) {
        console.error("Error fetching blacklist:", err);
        return [];
      }
    };

    const loadBlacklist = async () => {
      const blacklistData = await fetchBlacklist();
      setBlacklist(blacklistData);
    };

    fetchEventAndUserData().then();
    loadBlacklist().then();
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
      if (userStatus === "Admin" && !frontDoorMode){
        setNotification("The list is closed but u good");
      } else {
        setError("The event is closed and no guests can be added");
        return;
      }
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
          await addGuestToMainList(GuestListTypes.MaleGuestList, newGuestData);
        } else if (gender === "female" && (userStatus === "Admin" || userAddedFemales < maxFemales)) {
          await addGuestToMainList(GuestListTypes.FemaleGuestList, newGuestData);
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
  const addGuestToMainList = async (listName: GuestListTypes, guestData: Guest) => {
    
    if (blacklist.includes(guestData.name.trim())) {
      setError("This guest is blacklisted and cannot be added.");
      return;
    }
    
    try {
      const updatedGuestList = [...(event![listName] || []), guestData];
      const eventRef = ref(database, `events/${id}`);
      await update(eventRef, { [listName]: updatedGuestList });

      // Update state with new guest list
      setEvent(prevEvent => new Event({
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
    const listName: GuestListTypes = gender === 'male' ? GuestListTypes.MaleWaitList : GuestListTypes.FemaleWaitList;
    
    if (blacklist.includes(newGuestData.name.trim())) {
      setError("This guest is blacklisted and cannot be added.");
      return;
    }
    
    try {
      const updatedWaitList = [...(event![listName] || []), newGuestData];
      const eventRef = ref(database, `events/${id}`);
      await update(eventRef, { [listName]: updatedWaitList });

      // Update the state to reflect the new waitlist
      setEvent((prevEvent) => new Event({
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
      setFrontDoorMode(false);
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
        return snapshot.val().displayName as string; // Return the user's name if it exists
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
  
  const handleUncheckInGuest = async (gender: "male" | "female", index: number) => {
    if(!event) return;
    
    if(userStatus !== "Admin") return;
    
    try {
      const guestListName = gender === "male" ? GuestListTypes.MaleGuestList : GuestListTypes.FemaleGuestList;
      const updatedGuestList = [...event[guestListName]];
      updatedGuestList[index].checkedIn = -1;
      
      const eventRef = ref(database, `events/${id}`);
      await update(eventRef, { [guestListName]: updatedGuestList });
      
      setEvent((prevEvent) => new Event({
        ...prevEvent!,
        [guestListName]: updatedGuestList
      }));
    } catch (error) {
      console.error("Error unchecking in guest: ", error);
      setError("Failed to uncheck in guest");
    }
  }

   // Function to handle checking in a guest
   const handleCheckInGuest = async (gender: 'male' | 'female', index: number) => {
    if (!event) return;

    if( !(userStatus === "Admin")){
      return;
    }

    try {
      const checkedIn = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
      const guestListName = gender === 'male' ? GuestListTypes.MaleGuestList : GuestListTypes.FemaleGuestList;
      const updatedGuestList = [...event[guestListName]];
      updatedGuestList[index].checkedIn = checkedIn;

      const eventRef = ref(database, `events/${id}`);
      await update(eventRef, { [guestListName]: updatedGuestList });

      setEvent((prevEvent) => new Event({
        ...prevEvent!,
        [guestListName]: updatedGuestList,
      }));
    } catch (error) {
      console.error("Error checking in guest: ", error);
      setError("Failed to check in guest.");
    }
  };

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
          setEvent((prevEvent) => new Event({
            ...prevEvent!,
            maleGuestList: updatedMaleGuestList,
          }));
        } else if (listType === 'waitList') {
          const updatedMaleWaitList = event.maleWaitList.filter((_, i) => i !== index);
          const eventRef = ref(database, `events/${id}`);
          await update(eventRef, { maleWaitList: updatedMaleWaitList });
          setEvent((prevEvent) => new Event({
            ...prevEvent!,
            maleWaitList: updatedMaleWaitList,
          }));
        }
      } else if (gender === 'female') {
        if (listType === 'guestList') {
          const updatedFemaleGuestList = event.femaleGuestList.filter((_, i) => i !== index);
          const eventRef = ref(database, `events/${id}`);
          await update(eventRef, { femaleGuestList: updatedFemaleGuestList });
          setEvent((prevEvent) => new Event({
            ...prevEvent!,
            femaleGuestList: updatedFemaleGuestList,
          }));
        } else if (listType === 'waitList') {
          const updatedFemaleWaitList = event.femaleWaitList.filter((_, i) => i !== index);
          const eventRef = ref(database, `events/${id}`);
          await update(eventRef, { femaleWaitList: updatedFemaleWaitList });
          setEvent((prevEvent) => new Event({
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
  
        setEvent((prevEvent) => new Event({
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
  
        setEvent((prevEvent) => new Event({
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

    // Function to handle vouching for a guest (President Only)
    const handleVouchGuest = async (gender: 'male' | 'female') => {
      if (!event || !user) {
        console.error("Event or user not available. Event:", event, "User:", user);
        return;
      }
  
      if (userStatus !== "Admin") {
        setError("Only Admins can vouch for guests.");
        return;
      }
  
      if (vouchPassword !== "ZetaMu1959!") { 
        setError("Incorrect password. Please try again.");
        return;
      }
  
      // Ensure guest name is provided
      if (!vouchGuestName) {
        setError("Guest name cannot be empty.");
        return;
      }
  
      // Create new guest data
      const newGuestData = { name: vouchGuestName, addedBy: user.uid, checkedIn: new Date().toLocaleString("en-US", { timeZone: "America/New_York" })};
  
      try {
        if (!event.open) { // Vouching is allowed even if the event is closed
          if (gender === "male") {
            await addGuestToMainList(GuestListTypes.MaleGuestList, newGuestData);
          } else if (gender === "female") {
            await addGuestToMainList(GuestListTypes.FemaleGuestList, newGuestData);
          }
          setVouchGuestName("");
          setVouchPassword("");
          setIsVouching(false);
        } else {
          setError("Vouching can only be done when the event list is closed.");
        }
      } catch (error) {
        console.error(`Error vouching for ${gender} guest: `, error);
        setError(`Failed to vouch for ${gender} guest. Please try again.`);
      }
    };

  // Function to export the entire guest list as CSV
  const exportGuestListAsCSV = () => {
    if (!event) return;

    const headers = ["Guest Name", "Added By", "Gender", "Checked In"];
    const rows: string[][] = [];

    // Add male guests
    event.maleGuestList?.forEach((guest: Guest) => {
      rows.push([guest.name, userNames[guest.addedBy] || "Unknown User", "Male", guest.checkedIn !== -1 ? guest.checkedIn as string : "Not Checked In"]);
    });

    // Add female guests
    event.femaleGuestList?.forEach((guest: Guest) => {
      rows.push([guest.name, userNames[guest.addedBy] || "Unknown User", "Female", guest.checkedIn !== -1 ? guest.checkedIn as string : "Not Checked In"]);
    });

    console.log(rows);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${eventName}_guest_list.csv`);
    link.click();
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
    <div className={"absolute box-border p-5 w-full h-fit min-h-screen-with-nav top-nav items-center overflow-auto min-w-[375px]"}>
      <div style={{boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px"}} className="rounded-md m-auto w-[90%] h-full md:w-[80%] gap-4 bg-gradient-to-b from-blue-50 to-gray-100">
        <div className={"w-full px-6 grid grid-cols-1 md:grid-cols-2"}>
          <h1 className="text-4xl font-bold text-center col-span-full mt-4 text-gray-800 w-full">{eventName}</h1>
          {userStatus === "Admin" && (
            <div className="col-span-full my-4 flex justify-center">
              <label htmlFor="front-door-toggle" className="flex items-center cursor-pointer">
                <div className="relative my-1">
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
          {/* Vouch for Guest Section (President Only) */}
          {userStatus === "Admin" && frontDoorMode && (
            <div className="flex justify-center items-center col-span-full mb-2 w-full">
              <button
                onClick={() => setIsVouching(true)}
                className="bg-purple-500 text-white mx-4 my-1 rounded-md font-semibold hover:bg-purple-600 p-2"
              >
                Vouch (President Only)
              </button>
            </div>
          )}
          {isVouching && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
              <div className="bg-white p-8 rounded-lg shadow-lg w-1/3">
                <h2 className="text-2xl font-bold mb-4 text-black text-center">Vouch for Guest</h2>
                  <input
                    type="text"
                    value={vouchGuestName}
                    onChange={(e) => setVouchGuestName(e.target.value)}
                    placeholder="Enter guest name"
                    className="w-full border border-gray-300 rounded-md px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <input
                    type="password"
                    value={vouchPassword}
                    onChange={(e) => setVouchPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full border border-gray-300 rounded-md px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <div className="flex justify-center items-center">
                    <button
                      onClick={() => setIsVouching(false)}
                      className="bg-gray-500 text-white mx-2 rounded-md font-semibold hover:bg-gray-600 p-2"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleVouchGuest('male')}
                      className="bg-blue-500 text-white mx-2 my-2 rounded-md font-semibold hover:bg-blue-600 p-2"
                    >
                      Vouch Male
                    </button>
                    <button
                      onClick={() => handleVouchGuest('female')}
                      className="bg-pink-500 text-white mx-2 my-2 rounded-md font-semibold hover:bg-pink-600 p-2"
                    >
                      Vouch Female
                    </button>
                </div>
              </div>
            </div>
          )}
          <div className="text-xl font-bold text-center col-span-full text-red-600 w-100">
          {/* Error or Notification message */}
          {(error || notification) && (
            <p className={`${error ? 'text-red-500' : 'text-green-500'} text-center font-medium min-h-[2rem] my-4`}>
              {error || notification}
            </p>
          )}
          </div>
            {/* Information Section */}
            <div className="text-center col-span-full my-4 w-full">
            <p className="text-lg font-semibold text-gray-700">
              There are {event?.femaleGuestList?.length || 0} females and {event?.maleGuestList?.length || 0} males on the list for a total of {(event?.femaleGuestList?.length || 0) + (event?.maleGuestList?.length || 0)} guests.
            </p>
            <p className="text-lg font-semibold text-gray-700">
              You have added {countUserGuests(event?.femaleGuestList || [], user?.uid || '')} females and {countUserGuests(event?.maleGuestList || [], user?.uid || '')} males for a total of {countUserGuests(event?.femaleGuestList || [], user?.uid || '') + countUserGuests(event?.maleGuestList || [], user?.uid || '')}/{event.maxGuests} added.
            </p>
            <p className="text-lg font-semibold text-gray-700">
              If everyone from the approval list was added, there would be {(event?.femaleGuestList?.length || 0) + (event?.femaleWaitList?.length || 0)} females and {(event?.maleGuestList?.length || 0) + (event?.maleWaitList?.length || 0)} males on the list. For a total of {(event?.femaleGuestList?.length || 0) + (event?.femaleWaitList?.length || 0) + (event?.maleGuestList?.length || 0) + (event?.maleWaitList?.length || 0)} guests.
            </p>
            <JobsButton event={event} className={`mt-4 w-40 bg-purple-500 text-white semi-bold rounded-md hover:bg-purple-600 p-2 disabled:bg-purple-600 disabled:text-gray-200 disabled:hover:border-transparent disabled:cursor-not-allowed`}/>
          </div>
          {/* Search Bar and Input Section */}
          <div className="flex flex-col items-center col-span-full my-4 w-full">
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Enter guest name"
              className="w-2/3 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="mt-7 flex flex-auto justify-between space-x-5 m-2 w-[70%] sm:w-[50%] lg:w-[35%]">
              <button
                onClick={() => handleAddGuest('male')}
                className="bg-blue-500 text-white rounded-md font-semibold hover:bg-blue-600 p-2 w-[50%]"
              >
                Add Male
              </button>
              <button
                  onClick={() => handleAddGuest('female')}
                  className="bg-pink-500 text-white rounded-md font-semibold hover:bg-pink-600 p-2 w-[50%]"
                >
                  Add Female
              </button>
            </div>
          </div>
  
          {/* Guest Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 col-span-full">
            {/* Male Guests */}
            <GuestList
              guestList={filteredMaleGuests}
              gender={"male"}
              userNames={userNames}
              fetchUserName={fetchUserName}
              userID={user ? user.uid : ""}
              userStatus={userStatus}
              frontDoorMode={frontDoorMode}
              handleCheckInGuest={handleCheckInGuest}
              handleUncheckInGuest={handleUncheckInGuest}
              handleDeleteGuest={handleDeleteGuest}
            />
            
            {/* Female Guests */}
            <GuestList
              guestList={filteredFemaleGuests}
              gender={"female"}
              userNames={userNames}
              fetchUserName={fetchUserName}
              userID={user ? user.uid : ""}
              userStatus={userStatus}
              frontDoorMode={frontDoorMode}
              handleCheckInGuest={handleCheckInGuest}
              handleUncheckInGuest={handleUncheckInGuest}
              handleDeleteGuest={handleDeleteGuest}
            />
  
            {/* Male Waitlist */}
            <GuestList
              guestList={filteredMaleWaitListed}
              gender={'male'}
              isWaitList={true}
              userNames={userNames}
              fetchUserName={fetchUserName}
              userID={user ? user.uid : ""}
              userStatus={userStatus}
              frontDoorMode={frontDoorMode}
              handleDeleteGuest={handleDeleteGuest}
              handleApproveGuest={handleApproveGuest}
            />
            
            {/* Female Waitlist */}
            <GuestList
              guestList={filteredFemaleWaitListed}
              gender={"female"}
              isWaitList={true}
              userNames={userNames}
              fetchUserName={fetchUserName}
              userID={user ? user.uid : ""}
              userStatus={userStatus}
              frontDoorMode={frontDoorMode}
              handleDeleteGuest={handleDeleteGuest}
              handleApproveGuest={handleApproveGuest}
            />
          </div>
          <div className="flex justify-center mt-4 col-span-full">
            <button
              onClick={exportGuestListAsCSV}
              className="bg-purple-500 text-white mx-4 mb-5 rounded-md font-semibold hover:bg-purple-600 p-2"
            >
              Download CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualEventPage;
