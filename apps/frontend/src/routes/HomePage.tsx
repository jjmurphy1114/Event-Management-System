import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../../backend/firebaseConfig';
import { Link } from 'react-router-dom';

interface Event {
  id: string;
  name: string;
}

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const eventsRef = ref(database, 'events');
    onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedEvents = data ? Object.keys(data).map((key) => ({ id: key, ...data[key] })) : [];
      setEvents(loadedEvents);
    });
  }, []);

  return (
    <div className="min-h-screen min-w-screen bg-gradient-to-b from-blue-50 to-gray-100 py-10 px-5 md:px-80">
      <div className="w-full mx-auto">
        <h1 className="text-4xl font-bold text-center text-indigo-600 mb-10">ZM PARTIES</h1>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          {events.length > 0 ? (
            <ul className="space-y-4">
              {events.map((event) => (
                <li key={event.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Link to={`/events/${event.id}`} className="text-lg font-semibold text-indigo-500 hover:underline">
                    {event.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center">No events available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
