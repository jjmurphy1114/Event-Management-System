import React, { useEffect, useState } from 'react';
import { ref, push, onValue, update, remove, Database } from "firebase/database";

interface Event {
  id: string;
  name: string;
  date: string;
  description: string;
}

interface EventsPageProps {
  database: Database;
}

const EventsPage: React.FC<EventsPageProps> = ({ database }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [newEvent, setNewEvent] = useState({ name: '', date: '', description: '' });
  const eventsRef = ref(database, 'events');

  // Fetch events from Firebase Realtime Database
  useEffect(() => {
    onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      const eventList: Event[] = [];
      for (let id in data) {
        eventList.push({ id, ...data[id] });
      }
      setEvents(eventList);
    });
  }, [database]);

  // Functions to handle add, edit, and delete actions
  const addEvent = () => {
    if (newEvent.name && newEvent.date) {
      push(eventsRef, newEvent);
      setNewEvent({ name: '', date: '', description: '' });
    }
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
    <div>
      <h1>Manage Events</h1>
      <input
        type="text"
        placeholder="Event Name"
        value={newEvent.name}
        onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
      />
      <button onClick={addEvent}>Add Event</button>
      <ul>
        {events.map(event => (
          <li key={event.id}>
            <input
              type="text"
              value={event.name}
              onChange={(e) => editEvent(event.id, { ...event, name: e.target.value })}
            />
            <button onClick={() => deleteEvent(event.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EventsPage;
