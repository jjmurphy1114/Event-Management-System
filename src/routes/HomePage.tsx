import { useEffect, useState } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../services/firebaseConfig';
import { Link } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import Event from '../types/Event';

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [userStatus, setUserStatus] = useState<string>('');
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const eventsRef = ref(database, 'events');
    onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedEvents = data ? Object.keys(data).map((key) => ({ id: key, ...data[key] })) : [];
      setEvents(loadedEvents);
    });

    if (user) {
      const userRef = ref(database, `users/${user.uid}`);
      onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          setUserStatus(snapshot.val().status);
        }
      });
    }
  }, [user]);

  const toggleEventOpen = async (eventId: string, currentStatus: boolean) => {
    const eventRef = ref(database, `events/${eventId}`);
    try {
      await update(eventRef, { open: !currentStatus });
    } catch (error) {
      console.error('Error updating event status:', error);
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-b flex justify-center items-top from-blue-50 to-gray-100 py-10 px-5 md:px-80 pt-20">
      <div className="w-full mx-auto">
        <h1 className="text-4xl font-bold text-center text-indigo-600 mb-10">ZM PARTIES</h1>
        
        <div className="bg-white shadow-md item-center rounded-lg p-6">
          {events.length > 0 ? (
            <ul className="space-y-4">
              {events.map((event) => (
                <li key={event.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <Link to={`/events/${event.id}`} className="text-lg items-center text-center font-semibold text-indigo-500 hover:underline">
                      {event.name}
                    </Link>
                    <div className='text-right'>
                      <p className="text-sm text-gray-600">Date: {event.date}</p>
                      <p className='text-sm text-gray-600'>Event Type: {event.type}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Total Guests: {(event.maleGuestList?.length || 0) + (event.femaleGuestList?.length || 0)}</p>
                  {(userStatus === 'Admin' || userStatus === 'Social') && (
                    <div className="mt-2 flex items-center">
                    <label htmlFor={`event-toggle-${event.id}`} className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          id={`event-toggle-${event.id}`}
                          checked={event.open}
                          onChange={() => toggleEventOpen(event.id, event.open)}
                          className="sr-only"
                        />
                       <div className={`block w-14 h-8 rounded-full transition ${event.open ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
                        <div
                          className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                            event.open ? 'transform translate-x-full' : ''
                          }`}
                        ></div>
                      </div>
                      <span className="ml-3 text-gray-700">{event.open ? 'Open' : 'Closed'}</span>
                      </label>
                    </div>
                  )}
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
