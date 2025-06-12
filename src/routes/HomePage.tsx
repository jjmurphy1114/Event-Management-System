import { useEffect, useState } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../services/firebaseConfig';
import { Link } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import Event, {validateAndReturnEvent} from '../types/Event';
import JobsButton from "../elements/JobsButton.tsx";

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [userStatus, setUserStatus] = useState<string>('');
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const eventsRef = ref(database, 'events');
    onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      const validatedEvents = data ? Object.values(data).map((data) => {
        const validatedEventData = validateAndReturnEvent(data);
        if(validatedEventData) return new Event(validatedEventData);
      }) : [];
      
      const loadedEvents = validatedEvents.filter((data) => data != undefined);
      
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
    <div className="absolute box-border top-nav h-screen-with-nav w-full bg-gradient-to-b justify-center items-top from-blue-50 to-gray-100 p-5 min-w-[420px] overflow-auto">
      <h1 className="text-4xl font-bold text-center w-full align-top text-indigo-600 py-5">Current Events</h1>
      <div className="md:w-[80%] lg:w-[70%] py-5 flex w-full justify-center mx-auto bg-gradient-to-b from-blue-50 to-gray-100">
        <div className="bg-white shadow-md w-full item-center rounded-lg p-6">
          {events.length > 0 ? (
            <ul className="space-y-4">
              {events.map((event) => (
                <li key={event.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div className={`text-left`}>
                      <Link to={`/events/${event.id}`} className="text-lg items-center text-center font-semibold text-indigo-500 hover:underline">
                        {event.name}
                      </Link>
                      <p className="text-sm text-gray-600">Total Guests: {(Object.keys(event.maleGuestList).length || 0) + (Object.keys(event.femaleGuestList).length || 0)}</p>
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
                    </div>
                    <div className='text-right'>
                      <p className="text-sm text-gray-600">Date: {event.date}</p>
                      <p className='text-sm text-gray-600'>Event Type: {event.type}</p>
                      <JobsButton event={event} className={`mt-3 w-40 bg-purple-500 text-white semi-bold rounded-md hover:bg-purple-600 p-2 disabled:bg-purple-600 disabled:text-gray-200 disabled:hover:border-transparent disabled:cursor-not-allowed`} />
                    </div>
                  </div>
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
