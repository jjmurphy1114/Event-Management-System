import React, { useEffect, useState } from 'react';
import { ref, push, onValue, set, update, remove, Database } from "firebase/database";
import Event from '../../../backend/Event'
import Guest from '../../../backend/Guest';
import { useNavigate } from 'react-router-dom';

interface EventsPageProps {
  database: Database;
}

const EventsPage: React.FC<EventsPageProps> = ({ database }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [newEvent, setNewEvent] = useState({
    name: '',
    date: '',
    type: '',
    maxMales: 0,
    maxFemales: 0,
    maxGuests: 0,
    open: true,
    maleGuestList: [] as Guest[],
    femaleGuestList: [] as Guest[],
    maleWaitList: [] as Guest[],
    femaleWaitList: [] as Guest[],
  });
  const eventsRef = ref(database, 'events');
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');
  const [editingEventId, setEditingEventId] = useState<string | null>(null); // ID of event in edit mode

  const handleRedirect = () => {
    navigate('/');
  };

  // Fetch events from Firebase Realtime Database
  useEffect(() => {
    onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      const eventList: Event[] = [];
      for (const id in data) {
        eventList.push({ id, ...data[id] });
      }
      setEvents(eventList);
    });
  }, [database]);

 
  // Function to add an event to Firebase
  function addEventToDatabase(name: string, date: string, type: string, maxMales: number, maxFemales: number, maxGuests: number, open: boolean) {
    const event = new Event(name, date, type, maxMales, maxFemales, maxGuests, open);
    const newEventRef = push(eventsRef); // Creates a unique ID
    set(newEventRef, {
      name: event.name,
      date: event.date,
      type: event.type,
      maxMales: event.maxMales,
      maxFemales: event.maxFemales,
      maxGuests: event.maxGuests,
      open: event.open,
      maleGuestList: event.maleGuestList,
      femaleGuestList: event.femaleGuestList,
      maleWaitList: event.maleWaitList,
      femaleWaitList: event.femaleWaitList,
    })
      .then(() => console.log("Event added to Firebase"))
      .catch((error) => console.error("Error adding event:", error));
  }

  // Handler for form submission
  const handleAddEvent = () => {
    const { name, date, type, maxMales, maxFemales, maxGuests, open } = newEvent;
    // Make sure none of the fields are empty
    if (name == ""){
      setError("Name is required");
    } else if (date == ""){
      setError("No date??");
    } else if (type == ""){
      setError("Type is empty");
    } else if (maxMales <= 0){
      setError("I'm ok with this but this was probably a mistake");
    } else if (maxFemales <= 0){
      setError("Sausage party!! Fix this asap");
    } else if (maxGuests <= 0){
      setError("Can't have a party without guests");
    } else {
      setError("");
      addEventToDatabase(name, date, type, parseInt(maxMales), parseInt(maxFemales), parseInt(maxGuests), false);
      setNewEvent({ name: '', date: '', type: '', maxMales: 0, maxFemales: 0, maxGuests: 0, open: false, maleGuestList: [], femaleGuestList: [], maleWaitList: [], femaleWaitList: [] }); // Clear form
    }
  };


   // Handler for updating an existing event
   const handleEditEvent = (id: string) => {
    setEditingEventId(id);
  };

  const handleSaveEdit = (id: string) => {
    const updatedEvent = events.find((event) => event.id === id);
    if (updatedEvent) {
      if (updatedEvent.name == ""){
        setEditError("Name is required");
      } else if (updatedEvent.date == ""){
        setEditError("No date??");
      } else if (updatedEvent.type == ""){
        setEditError("Type is empty");
      } else if (updatedEvent.maxMales <= 0){
        setEditError("I'm ok with this but this was probably a mistake");
      } else if (updatedEvent.maxFemales <= 0){
        setEditError("WHY WOULD YOU REMOVE THEM BRUH");
      }  else if (updatedEvent.maxGuests <= 0){
        setError("Can't have a party without guests");
      } else {
        setEditError('');
        const eventRef = ref(database, `events/${id}`);
        update(eventRef, {
          name: updatedEvent.name,
          date: updatedEvent.date,
          type: updatedEvent.type,
          maxMales: updatedEvent.maxMales,
          maxFemales: updatedEvent.maxFemales,
          maxGuests: updatedEvent.maxGuests,
          open: updatedEvent.open,
          maleGuestList: updatedEvent.maleGuestList ?? [],
          femaleGuestList: updatedEvent.femaleGuestList ?? [],
          maleWaitList: updatedEvent.maleWaitList ?? [],
          femaleWaitList: updatedEvent.femaleWaitList ?? [],
        });
        setEditingEventId(null);
      }
    }
  };

  const deleteEvent = (id: string) => {
    const eventRef = ref(database, `events/${id}`);
    remove(eventRef);
  };

  return (
    <div className='w-screen h-screen flex flex-col items-center bg-gradient-to-b from-blue-50 to-gray-100 overflow-auto'>
      <button type="button" onClick={handleRedirect} className="px-4 py-2 mb-2 mt-4 bg-indigo-500 text-white font-semibold rounded-md shadow hover:bg-indigo-600 focus:outline-none focus:ring focus:ring-indigo-200">
      Back to Home
    </button>
    <div className="p-8 w-full bg-gradient-to-b items-center justify-center from-blue-50 to-gray-100 min-h-screen">
      {/* Error message */}
      {error && <p className="text-red-500 text-center font-medium mb-2">{error}</p>}
    
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-10">Manage Events</h1>
      {/* Event Input Form */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-10 mx-auto max-w-xl">
        <h2 className="text-2xl font-semibold text-center text-gray-700 mb-4">Add New Event</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Event Name</label>
            <input
              id="name"
              type="text"
              value={newEvent.name}
              onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
            <input
              id="date"
              type="date"
              value={newEvent.date}
              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">Event Type</label>
            <input
              id="type"
              type="text"
              value={newEvent.type}
              onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label htmlFor="males" className="block text-sm font-medium text-gray-700">Male Invites Per Brother</label>
            <input
              id="males"
              type="number"
              value={newEvent.maxMales}
              onChange={(e) => setNewEvent({ ...newEvent, maxMales: e.target.value })}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label htmlFor="females" className="block text-sm font-medium text-gray-700">Female Invites Per Brother</label>
            <input
              id="females"
              type="number"
              value={newEvent.maxFemales}
              onChange={(e) => setNewEvent({ ...newEvent, maxFemales: e.target.value })}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label htmlFor="maxGuests" className="block text-sm font-medium text-gray-700">Max Invites Per Brother</label>
            <input
              id="maxGuests"
              type="number"
              value={newEvent.maxGuests}
              onChange={(e) => setNewEvent({ ...newEvent, maxGuests: e.target.value })}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
            <button
              onClick={handleAddEvent}
              className="col-span-2 bg-blue-500 text-white px-6 py-3 rounded-md font-semibold mt-4 hover:bg-blue-600 transition duration-200"
            >
              Add Event
            </button>
        </div>
      </div>

      {/* Event List */}
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {events.map((event) => (
          <li key={event.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg text-center transition duration-200">
            {editingEventId === event.id ? (
              <div>
                {/* Error message */}
                {editError && <p className="text-red-500 font-medium mb-2">{editError}</p>}
              <div>
                <label htmlFor="editName" className="block text-sm text-center font-medium text-gray-700">Event Name</label>
                <input
                  id="editName"
                  type="text"
                  value={event.name}
                  onChange={(e) => setEvents(events.map((ev) => (ev.id === event.id ? { ...ev, name: e.target.value } : ev)))}
                  className="border p-2 w-full mb-2"
                />
              </div>
              <div>
                <label htmlFor="editDate" className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  id="editDate"
                  type="date"
                  value={event.date}
                  onChange={(e) => setEvents(events.map((ev) => (ev.id === event.id ? { ...ev, date: e.target.value } : ev)))}
                  className="border p-2 w-full mb-2"
                />
              </div>
              <div>
                <label htmlFor="editType" className="block text-sm font-medium text-gray-700">Event Type</label>
                <input
                  id="editType"
                  type="text"
                  value={event.type}
                  onChange={(e) => setEvents(events.map((ev) => (ev.id === event.id ? { ...ev, type: e.target.value } : ev)))}
                  className="border p-2 w-full mb-2"
                />
              </div>
              <div>
                <label htmlFor="editMales" className="block text-sm font-medium text-gray-700">Males Per Brother</label>
                <input
                  id="editMales"
                  type="number"
                  value={event.maxMales}
                  onChange={(e) => setEvents(events.map((ev) => (ev.id === event.id ? { ...ev, maxMales: e.target.value } : ev)))}
                  className="border p-2 w-full mb-2"
                />
              </div>
              <div>
                <label htmlFor="editFemales" className="block text-sm font-medium text-gray-700">Females Per Brother</label>
                <input
                  id="editFemales"
                  type="number"
                  value={event.maxFemales}
                  onChange={(e) => setEvents(events.map((ev) => (ev.id === event.id ? { ...ev, maxFemales: e.target.value } : ev)))}
                  className="border p-2 w-full mb-2"
                />
              </div>
              <div>
                <label htmlFor="editMaxGuests" className="block text-sm font-medium text-gray-700">Max Invites Per Brother</label>
                <input
                  id="editMaxGuests"
                  type="number"
                  value={event.maxGuests}
                  onChange={(e) => setEvents(events.map((ev) => (ev.id === event.id ? { ...ev, maxGuests: e.target.value } : ev)))}
                  className="border p-2 w-full mb-2"
                />
              </div>
                <button
                  onClick={() => handleSaveEdit(event.id)}
                  className="mt-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  Save
                </button>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">{event.name}</h2>
                <p className="text-gray-600">Date: {event.date}</p>
                <p className="text-gray-600">Type: {event.type}</p>
                <p className="text-gray-600">Max Male Guests Per: {event.maxMales}</p>
                <p className="text-gray-600">Max Female Guests Per: {event.maxFemales}</p>
                <p className="text-gray-600">Max Invites Per: {event.maxGuests}</p>
                <button
                  onClick={() => handleEditEvent(event.id)}
                  className="mt-4 mr-2 bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="mt-4 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
    </div>
  );
};

export default EventsPage;
