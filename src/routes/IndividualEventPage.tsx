import {useCallback, useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {database} from "../firebaseConfig";
import {get, onValue, push, ref, remove, set, update} from "firebase/database";
import Event, {EventType, getTypeFromGuestList, GuestListTypes, validateAndReturnEvent} from "../types/Event";
import Guest, {validateAndReturnGuest} from "../types/Guest";
import GuestList from "../elements/GuestList.tsx";
import { RootState, AppDispatch } from "../state/store.ts";
import { useSelector, useDispatch } from "react-redux";
import { fetchUser } from "../state/userSlice.ts";

const IndividualEventPage = () => {
  
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestName, setGuestName] = useState("");
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");
  const [userNames, setUserNames] = useState<{ [key: string]: string }>({});
  const [checkInMode, setCheckInMode] = useState(false);
  const [vouchGuestName, setVouchGuestName] = useState("");
  const [vouchPassword, setVouchPassword] = useState("");
  const [isVouching, setIsVouching] = useState(false);
  const [blacklist, setBlacklist] = useState<string[]>([]);
  
  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch<AppDispatch>();
  
  useEffect(() => {
    const eventRef = ref(database, `events/${id}`);
    const blacklistRef = ref(database, "blacklist");
    dispatch(fetchUser());
    
  
    onValue(eventRef, (snapshot) => {
      if(snapshot.exists()) {
        const eventData = snapshot.val();
        const validatedEventData: EventType | undefined = validateAndReturnEvent(eventData);
        
        if(validatedEventData) {
          setEvent(new Event(validatedEventData));
        }
      }
    }, (err) => console.error("Error fetching event!", err));
    
    onValue(blacklistRef, (snapshot) => {
      if(snapshot.exists()) setBlacklist(Object.keys(snapshot.val()));
      else setBlacklist([]);
    }, (err) => console.error("Error fetching blacklist!", err));
    
  }, [dispatch, id]);
  
  const fetchBlacklist = useCallback(async () => {
    try {
      const blacklistRef = ref(database, "blacklist");
      const snapshot = await get(blacklistRef);
      
      if (snapshot.exists()) {
        setBlacklist(Object.keys(snapshot.val()));
      } else {
        setBlacklist([]);
      }
    } catch (err) {
      console.error("Error fetching blacklist:", err);
      setBlacklist([]);
    }
  }, []);
  
  useEffect(() => {
    setLoading(true);
    
    fetchBlacklist()
      .then(() => console.debug(`Blacklist data fetched successfully!`))
      .catch((err) => {
        console.error("Blacklist data not fetched successfully!");
        console.error(err);
      }).finally(() => setLoading(false));
  }, [fetchBlacklist]);

  // Guarded render
  if (loading) {
    return <div className="text-center mt-20 text-gray-700 text-xl">Loading event details...</div>;
  }

  if (!event) {
    return <div className="text-center mt-20 text-gray-700 text-xl">No event data available.</div>;
  }

  // Function to count the number of guests added by a specific user
  const countUserGuests = (guestList: Record<string, Guest>, userId: string) => {
    return Object.values(guestList).filter(guest => guest.addedBy === userId).length;
  };

  // Function to count the number of guests added by a specific user
  const handleAddGuest = async () => {
    if (!event || !user) {
      console.error("Event or user not available. Event:", event, "User:", user);
      return;
    }

    if (!event.open) {
      if (user.status === "Admin" && !checkInMode){
        setNotification("The list is closed but u good");
      } else {
        setError("The event is closed and no guests can be added");
        return;
      }
    }

    if (!user.privileges) {
      setError("You don't have social privileges and can't add guests");
      return;
    }
  
    // Ensure guest name is provided
    if (!guestName) {
      setError("Guest name cannot be empty.");
      return;
    }
  
    // Create new guest data
    const newGuestData = new Guest(guestName, user.id);
    const userAddedGuests = countUserGuests(event.guestList || [], user.id);
  
    const maxGuests = event.maxGuests;
  
    try {
      if (user.status === "Admin" || userAddedGuests < maxGuests) {
        await addGuestToList(GuestListTypes.GuestList, newGuestData);
      } else {
        await addGuestToList(GuestListTypes.WaitList, newGuestData);
      }
    } catch (error) {
      console.error(`Error adding guest: `, error);
      setError(`Failed to add guest. Please try again.`);
    }
  };

  // Function to add a guest to the main list
  const addGuestToList = async (listName: GuestListTypes, guestData: Guest) => {
    if (blacklist.includes(guestData.name.trim())) {
      setError("This guest is blacklisted and cannot be added.");
      return;
    }
    
    try {
      const eventGuestListRef = ref(database, `events/${id}/${listName}`);
      const newGuestRef = await push(eventGuestListRef);
      
      await update(newGuestRef, guestData);

      const type = getTypeFromGuestList(listName);
      setNotification(`Added guest to ${type}`);
      setGuestName("");
      setError("");
    } catch (error) {
      console.error(`Error updating ${listName}: `, error);
      setError(`Failed to add guest. Please try again.`);
    }
  };
  
  // Function to handle toggling check-in mode
  const handleToggleFrontDoorMode = async () => {
    if (!event.open){
      try {
        const eventRef = ref(database, `events/${id}`);
        await update(eventRef, { frontDoorMode: !checkInMode });
        setCheckInMode(!checkInMode);
      } catch (error) {
        console.error("Error toggling check-in mode: ", error);
        setError("Failed to toggle check-in mode.");
      }
    } else {
      setCheckInMode(false);
      setError("List must be closed to use check-in mode");
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
  
  const handleUncheckInGuest = async (guestID: string) => {
    if(!event) return;
    
    if(user.status !== "Admin") return;
    
    try {      
      const guestRef = ref(database, `events/${id}/${GuestListTypes.GuestList}/${guestID}/checkedIn`);
      await set(guestRef, -1);
      
    } catch (error) {
      console.error("Error unchecking in guest: ", error);
      setError("Failed to uncheck in guest");
    }
  }

   // Function to handle checking in a guest
   const handleCheckInGuest = async (guestID: string) => {
    if (!event) return;

    if( !(user.status === "Admin")){
      return;
    }

    try {
      const checkedIn = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
      const guestRef = ref(database, `events/${id}/${GuestListTypes.GuestList}/${guestID}/checkedIn`);
      await set(guestRef, checkedIn);

    } catch (error) {
      console.error("Error checking in guest: ", error);
      setError("Failed to check in guest.");
    }
  };

  // Function to handle deleting guests from the list and on firebase
  const handleDeleteGuest = async (
    listName: GuestListTypes,
    guestID: string
  ) => {
    if (!event || !user) return;
  
    try {
      const guestRef = ref(database, `events/${id}/${listName}/${guestID}`);
      await remove(guestRef);
      
      const type = getTypeFromGuestList(listName);
      
      setNotification(`Removed guest from ${type}`);
    } catch (error) {
      console.error('Error deleting guest: ', error);
      setError("Failed to delete guest.");
    }
  };

  // Function to handle approving a guest from the waitlist
  const handleApproveGuest = async (guestID: string) => {
    if (!event) {
      console.error("Event not available when trying to approve guest.");
      return;
    }
  
    try {
      const mainListRef = ref(database, `events/${id}/${GuestListTypes.GuestList}`);
      const waitListGuestRef = ref(database, `events/${id}/${GuestListTypes.WaitList}/${guestID}`);
      
      const guestSnapshot = await get(waitListGuestRef);
      
      if(guestSnapshot.exists()) {
        const validatedGuestData: Guest | undefined = validateAndReturnGuest(guestSnapshot.val());
        if(validatedGuestData) {
          const mainGuestRef = await push(mainListRef);
          await update(mainGuestRef, validatedGuestData);
          await remove(waitListGuestRef);
        }
      } else {
        console.error("User not found in waitlist!");
        setError("Failed to approve guest: guest does not exist. Please try again.");
        return;
      }
      
      console.log(`Successfully moved guest from waitlist to guest list in Firebase.`);
      setNotification(`Approved from waitlist`)

    } catch (error) {
      console.error(`Error approving guest: `, error);
      setError(`Failed to approve guest. Please try again.`);
    }
  };

  // Function to handle vouching for a guest (Password Protected)
  const handleVouchGuest = async () => {
    if (!event || !user) {
      console.error("Event or user not available. Event:", event, "User:", user);
      return;
    }

    if (user.status !== "Admin") {
      setError("Only Admins can vouch for guests.");
      return;
    }

    if (vouchPassword !== "EventManagement!") {
      setError("Incorrect password. Please try again.");
      return;
    }

    // Ensure guest name is provided
    if (!vouchGuestName) {
      setError("Guest name cannot be empty.");
      return;
    }

    // Create new guest data
    const newGuestData = { name: vouchGuestName, addedBy: user.id, checkedIn: new Date().toLocaleString("en-US", { timeZone: "America/New_York" })};

    try {
      if (!event.open) { // Vouching is allowed even if the event is closed
        await addGuestToList(GuestListTypes.GuestList, newGuestData);
        setVouchGuestName("");
        setVouchPassword("");
        setIsVouching(false);
      } else {
        setError("Vouching can only be done when the event list is closed.");
      }
    } catch (error) {
      console.error(`Error vouching for guest: `, error);
      setError(`Failed to vouch for guest. Please try again.`);
    }
  };
  
  const handleAddGuestFromPersonal = async (guestID: string) => {
    if (!event || !user) {
      console.error("Event or user not available. Event: ", event, "User: ", user);
      return;
    }

    if (!event.open) {
      if (user.status === "Admin" && !checkInMode){
        setNotification("The list is closed but u good");
      } else {
        setError("The event is closed and no guests can be added");
        return;
      }
    }

    if (!user.privileges) {
      setError("You don't have social privileges and can't add guests");
      return;
    }
    
    const mainListRef = ref(database, `events/${id}/${GuestListTypes.GuestList}`);
    const personalGuestRef = ref(database, `users/${user.id}/${GuestListTypes.PersonalGuestList}/${guestID}`);
    
    const guestSnapshot = await get(personalGuestRef);
    
    if(guestSnapshot.exists()) {
      const validatedGuestData = validateAndReturnGuest(guestSnapshot.val());
      
      if(validatedGuestData) {
        // Check if the guest is blacklisted
        if (blacklist.includes(validatedGuestData.name.trim())) {
          setError("This guest is blacklisted and cannot be added.");
          return;
        }

        const mainGuestRef = await push(mainListRef);
        await update(mainGuestRef, validatedGuestData);
      }
      
      console.debug("Added guest from personal guest list");
      setNotification(`Added guest from personal guest list`);
      setError("");
    } else {
      console.debug("Guest not found in personal guest list!");
      setError("Failed to add guest from personal guest list: Guest does not exist. Please try again.");
    }
  };

  // Function to export the entire guest list as CSV
  const exportGuestListAsCSV = () => {
    if (!event) return;

    const headers = ["Guest Name", "Added By", "Checked In"];
    const rows: string[][] = [];

    // Add guests
    Object.values(event.guestList)?.forEach((guest: Guest) => {
      rows.push([guest.name, userNames[guest.addedBy] || "Unknown User", guest.checkedIn !== -1 ? guest.checkedIn as string : "Not Checked In"]);
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${event.name}_guest_list.csv`);
    link.click();
  };  

  // Extract male and female guests from the event object
  // Filtered guest lists based on search input for guest name and addedBy name
  const filteredGuests: Record<string, Guest> = Object.fromEntries(
    Object.entries(event?.guestList).filter(([, guest]) => {
      const addedByName = userNames[guest.addedBy]?.toLowerCase() || "";
      return (
        guest.name.toLowerCase().includes(guestName.toLowerCase()) ||
        addedByName.includes(guestName.toLowerCase())
      );
    })
  );

  const filteredWaitListed: Record<string, Guest> = Object.fromEntries(
    Object.entries(event?.waitList).filter(([, guest]) => {
      const addedByName = userNames[guest.addedBy]?.toLowerCase() || "";
      return (
        guest.name.toLowerCase().includes(guestName.toLowerCase()) ||
        addedByName.includes(guestName.toLowerCase())
      );
    })
  );

  return (
    <div className={"absolute box-border p-5 w-full h-fit min-h-screen-with-nav top-nav items-center overflow-auto min-w-[375px]"}>
      <div style={{boxShadow: "rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px"}} className="rounded-md m-auto w-[90%] h-full md:w-[80%] gap-4 bg-gradient-to-b from-blue-50 to-gray-100">
        <div className={"w-full px-6 grid grid-cols-1 md:grid-cols-2"}>
          <h1 className="text-4xl font-bold text-center col-span-full mt-4 text-gray-800 w-full">{event.name}</h1>
          {!event.open && (
            <p className={"text-red-500 text-center col-span-full font-medium min-h-[2rem] mt-4"}>The list is closed!</p>
          )}
          {user.status === "Admin" && (
            <div className="col-span-full my-4 flex justify-center">
              <label htmlFor="front-door-toggle" className="flex items-center cursor-pointer">
                <div className="relative my-1">
                  <input
                    type="checkbox"
                    id="front-door-toggle"
                    checked={checkInMode}
                    onChange={handleToggleFrontDoorMode}
                    className="sr-only"
                  />
                  <div className={`block w-14 h-8 rounded-full transition ${checkInMode ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <div
                    className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                      checkInMode ? 'transform translate-x-full' : ''
                    }`}
                  ></div>
                </div>
                <span className="ml-3 text-gray-700">Check-In Mode</span>
              </label>
            </div>
          )}
          {/* Vouch for Guest Section */}
          {user.status === "Admin" && checkInMode && (
            <div className="flex justify-center items-center col-span-full mb-2 w-full">
              <button
                onClick={() => setIsVouching(true)}
                className="bg-purple-500 text-white mx-4 my-1 rounded-md font-semibold hover:bg-purple-600 p-2"
              >
                Vouch (Password Protected)
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
                      onClick={() => handleVouchGuest()}
                      className="bg-blue-500 text-white mx-2 my-2 rounded-md font-semibold hover:bg-blue-600 p-2"
                    >
                      Vouch for Guest
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
              There are {Object.keys(event?.guestList).length || 0} guests on the list
            </p>
            <p className="text-lg font-semibold text-gray-700">
              You have added {countUserGuests(event?.guestList || {}, user.id || '')} guests.
            </p>
            <p className="text-lg font-semibold text-gray-700">
              If everyone from the approval list was added, there would be {(Object.keys(event?.guestList).length || 0) + (Object.keys(event?.waitList).length || 0)} guests.
            </p>
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
            <div className="mt-7 flex flex-auto justify-center space-x-5 m-2 w-[70%] sm:w-[50%] lg:w-[35%]">
              <button
                onClick={() => handleAddGuest()}
                className="bg-blue-500 text-white rounded-md font-semibold hover:bg-blue-600 p-2 w-[50%]"
              >
                Add Guest
              </button>
            </div>
          </div>
  
          {/* Guest Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 col-span-full">
            {/* Guest List */}
            <GuestList
              guestList={filteredGuests}
              type={"general"}
              userNames={userNames}
              fetchUserName={fetchUserName}
              userStatus={user.status}
              frontDoorMode={checkInMode}
              handleCheckInGuest={handleCheckInGuest}
              handleUncheckInGuest={handleUncheckInGuest}
              handleDeleteGuest={handleDeleteGuest}
              searching={guestName.length != 0}
            />
            
            {/* Waitlist */}
            <GuestList
              guestList={filteredWaitListed}
              type={"waitlist"}
              userNames={userNames}
              fetchUserName={fetchUserName}
              userStatus={user.status}
              frontDoorMode={checkInMode}
              handleDeleteGuest={handleDeleteGuest}
              handleApproveGuest={handleApproveGuest}
              searching={guestName.length != 0}
            />
            
            {/* Personal Guest List */}
            <GuestList
              guestList={user.personalGuestList}
              type={"personal"}
              userNames={userNames}
              fetchUserName={fetchUserName}
              userStatus={user.status}
              frontDoorMode={checkInMode}
              handleAddGuestFromPersonal={handleAddGuestFromPersonal}
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
