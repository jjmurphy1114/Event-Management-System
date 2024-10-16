import React, { useEffect, useState } from 'react';
import { ref, push, onValue, set, update, remove, Database } from "firebase/database";
import Event from '../../../backend/Event'

interface EventsPageProps {
  database: Database;
}

const EventsPage: React.FC<EventsPageProps> = ({ database }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [newEvent, setNewEvent] = useState({ name: '', date: '', type: '' , maxMales: -1, maxFemales: -1});
  const eventsRef = ref(database, 'events');

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
  function addEventToDatabase(name: string, date: string, type: string, maxMales: number, maxFemales: number) {
    const event = new Event(name, date, type, maxMales, maxFemales);
    
    const newEventRef = push(eventsRef); // Creates a unique ID
    set(newEventRef, { ...event })
      .then(() => console.log("Event added to Firebase"))
      .catch((error) => console.error("Error adding event:", error));
  }

  // Handler for form submission
  const handleAddEvent = () => {
    const { name, date, type, maxMales, maxFemales } = newEvent;
    addEventToDatabase(name, date, type, parseInt(maxMales), parseInt(maxFemales));
    setNewEvent({ name: '', date: '', type: '', maxMales: -1, maxFemales: -1 }); // Clear form
  };


  const editEvent = (id: string, updatedEvent: Event) => {
    const eventRef = ref(database, `events/${id}`);
    update(eventRef, updatedEvent);
  };

  const deleteEvent = (id: string) => {
    const eventRef = ref(database, `events/${id}`);
    remove(eventRef);
  };

  return (
    <div className="p-8 bg-gradient-to-b from-blue-50 to-gray-100 min-h-screen">
  <h1 className="text-4xl font-bold text-center text-gray-800 mb-10">Manage Events</h1>

  {/* Event Input Form */}
  <div className="bg-white shadow-lg rounded-lg p-6 mb-10 mx-auto max-w-xl">
    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Add New Event</h2>
    <div className="grid grid-cols-2 gap-4">
      <input
        type="text"
        placeholder="Event Name"
        value={newEvent.name}
        onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
        className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <input
        type="date"
        placeholder="Date"
        value={newEvent.date}
        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
        className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <input
        type="text"
        placeholder="Event Type"
        value={newEvent.type}
        onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
        className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <input
        type="number"
        placeholder="Max Male Guests"
        value={newEvent.maxMales}
        onChange={(e) => setNewEvent({ ...newEvent, maxMales: e.target.value })}
        className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <input
        type="number"
        placeholder="Max Female Guests"
        value={newEvent.maxFemales}
        onChange={(e) => setNewEvent({ ...newEvent, maxFemales: e.target.value })}
        className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <button
        onClick={handleAddEvent}
        className="col-span-2 bg-blue-500 text-white px-6 py-3 rounded-md font-semibold mt-4 hover:bg-blue-600 transition duration-200"
      >
        Add Event
      </button>
    </div>
  </div>

  {/* Event List */}
  <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {events.map((event) => (
      <li key={event.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition duration-200">
        <h2 className="text-xl font-bold text-gray-800 mb-2">{event.name}</h2>
        <p className="text-gray-600 mb-1">Date: {event.date}</p>
        <p className="text-gray-600 mb-1">Type: {event.type}</p>
        <p className="text-gray-600 mb-1">Max Male Guests: {event.maxMales}</p>
        <p className="text-gray-600 mb-1">Max Female Guests: {event.maxFemales}</p>
        <button
          onClick={() => deleteEvent(event.id)}
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-200"
        >
          Delete
        </button>
      </li>
    ))}
  </ul>
</div>
  );
};

export default EventsPage;
