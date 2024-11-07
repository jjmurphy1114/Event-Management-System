import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { database } from "../../../backend/firebaseConfig";
import { ref, get, update } from "firebase/database";
import Event from "../../../backend/Event";
import Guest from "../../../backend/Guest";
import { getAuth } from "firebase/auth";

const IndividualEventPage = () => {
  // Get the event ID from the URL parameters
  const { id } = useParams<{ id: string }>();
  // State to store the event details
  const [event, setEvent] = useState<Event | null>(null);
  // State to store the name of the male guest being added
  const [maleGuestName, setMaleGuestName] = useState("");
  // State to store the name of the female guest being added
  const [femaleGuestName, setFemaleGuestName] = useState("");
  // State to store error messages
  const [error, setError] = useState("");
  // Get the current authenticated user
  const auth = getAuth();
  const user = auth.currentUser;

  // Fetch event details from the Firebase Realtime Database when the component mounts
  useEffect(() => {
    const fetchEvent = async () => {
      const eventRef = ref(database, `events/${id}`);
      const snapshot = await get(eventRef);
      if (snapshot.exists()) {
        setEvent(snapshot.val()); // Set the event state if the event exists
      } else {
        console.error("No event found!");
      }
    };
    fetchEvent();
  }, [id]);

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

    const isAdmin = false; // Replace with logic to fetch user status if needed.

    // Check if the user can add more guests
    if (isAdmin || totalUserGuests < maxGuests) {
      if (gender === 'male' && (isAdmin || userAddedMales < maxMales)) {
        // Add male guest to the list
        const newGuest = new Guest(newGuestName, userId);
        const updatedMaleGuestList = [...(event.maleGuestList || []), newGuest];

        try {
          // Update Firebase Database with the new male guest
          const eventRef = ref(database, `events/${id}`);
          await update(eventRef, { maleGuestList: updatedMaleGuestList });
          setEvent(prevEvent => ({
            ...prevEvent!,
            maleGuestList: updatedMaleGuestList,
          }));
          setMaleGuestName(""); // Clear input field for male guest name
          setError(""); // Reset error message
        } catch (error) {
          console.error("Error updating male guest list: ", error);
        }
      } else if (gender === 'female' && (isAdmin || userAddedFemales < maxFemales)) {
        // Add female guest to the list
        const newGuest = new Guest(newGuestName, userId);
        const updatedFemaleGuestList = [...(event.femaleGuestList || []), newGuest];

        try {
          // Update Firebase Database with the new female guest
          const eventRef = ref(database, `events/${id}`);
          await update(eventRef, { femaleGuestList: updatedFemaleGuestList });
          setEvent(prevEvent => ({
            ...prevEvent!,
            femaleGuestList: updatedFemaleGuestList,
          }));
          setFemaleGuestName(""); // Clear input field for female guest name
          setError(""); // Reset error message
        } catch (error) {
          console.error("Error updating female guest list: ", error);
        }
      } else {
        setError(`Invite limit for ${gender} guests reached.`); // Set error if invite limit is reached
      }
    } else {
      // Add guest to the waitlist if the total invite limit is reached
      const newGuest = new Guest(newGuestName, userId);
      if (gender === 'male') {
        const updatedMaleWaitList = [...(event.maleWaitList || []), newGuest];

        try {
          // Update Firebase Database with the new male waitlist guest
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
        const updatedFemaleWaitList = [...(event.femaleWaitList || []), newGuest];

        try {
          // Update Firebase Database with the new female waitlist guest
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

      setError("Added to waitlist due to invite limit."); // Set error message for waitlist
      if (gender === 'male') {
        setMaleGuestName(""); // Clear input field for male guest name
      } else {
        setFemaleGuestName(""); // Clear input field for female guest name
      }
    }
  };

  if (!event) {
    return <div>Loading event details...</div>; // Display loading message if event details are not yet available
  }

  // Extract male and female guests from the event object
  const maleGuests = event.maleGuestList || [];
  const femaleGuests = event.femaleGuestList || [];

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10 flex space-x-8">
      {/* Male Guests Section */}
      <div className="flex-1">
        <h2 className="text-3xl font-bold mb-4 text-center">Male Guests</h2>
        <div className="mb-8 space-y-4">
          {maleGuests.length > 0 ? (
            maleGuests.map((guest, index) => (
              <div key={index} className="bg-blue-100 p-4 rounded-lg shadow-md">
                <p className="text-lg font-semibold">{guest.name}</p>
                <p className="text-sm text-gray-700">Added by: {guest.addedBy}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No male guests added yet.</p>
          )}
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Add Male Guest</h3>
          <div className="flex space-x-4">
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
      </div>

      {/* Female Guests Section */}
      <div className="flex-1">
        <h2 className="text-3xl font-bold mb-4 text-center">Female Guests</h2>
        <div className="mb-8 space-y-4">
          {femaleGuests.length > 0 ? (
            femaleGuests.map((guest, index) => (
              <div key={index} className="bg-pink-100 p-4 rounded-lg shadow-md">
                <p className="text-lg font-semibold">{guest.name}</p>
                <p className="text-sm text-gray-700">Added by: {guest.addedBy}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No female guests added yet.</p>
          )}
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Add Female Guest</h3>
          <div className="flex space-x-4">
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
      </div>
    </div>
  );
};

export default IndividualEventPage;
