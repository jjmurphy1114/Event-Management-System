import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { database } from "../services/firebaseConfig";
// import { getAuth } from "firebase/auth";
import Guest from "../types/Guest";
import CheckInGraph from "../elements/CheckInGraph";

export default function StatsPage() {
//   const auth = getAuth();
//   const user = auth.currentUser;
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [stats, setStats] = useState({
    maleCount: 0,
    femaleCount: 0,
    checkedIn: 0,
    notCheckedIn: 0,
    checkInTimes: [] as Guest[],
    checkedGirls: 0,
    checkedGuys: 0,
    mostCheckIns: "",
    mostGirlsCheckIns: "",
    mostGuysCheckIns: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load list of events on mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsRef = ref(database, 'events');
        const snapshot = await get(eventsRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const loaded = Object.entries(data).map(([id, ev]: [string, any]) => ({ id, name: ev.name }));
          setEvents(loaded);
        //   if (loaded.length) setSelectedEventId(loaded[0].id);
        }
      } catch (e) {
        console.error(e);
        setError('Failed to load events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Recompute stats whenever selectedEventId changes
  useEffect(() => {
    if (!selectedEventId) return;
    setLoading(true);
    const fetchStats = async () => {
        try {
          const evRef = ref(database, `events/${selectedEventId}`);
          const snapshot = await get(evRef);
          if (!snapshot.exists()) {
            setError('Event not found');
            return;
          }
          const ev = snapshot.val();
  
          // Ensure guest lists are arrays
          const maleRaw = ev.maleGuestList;
          const femaleRaw = ev.femaleGuestList;
          const maleList: Guest[] = Array.isArray(maleRaw) ? maleRaw : Object.values(maleRaw || {});
          const femaleList: Guest[] = Array.isArray(femaleRaw) ? femaleRaw : Object.values(femaleRaw || {});
  
          const allGuests = [...maleList, ...femaleList];
          const checked = allGuests.filter(g => g.checkedIn !== undefined && g.checkedIn !== -1).length;
          const notChecked = allGuests.length - checked;

          const checkedGirls = femaleList.filter(g => g.checkedIn !== undefined && g.checkedIn !== -1).length;
          const checkedGuys = maleList.filter(g => g.checkedIn !== undefined && g.checkedIn !== -1).length;

          const checkInTimes: Guest[] = allGuests.filter(g => g.checkedIn !== undefined && g.checkedIn !== -1)
  
          const topGuestsChecked = await calculateTopBrother(allGuests);
          const topGirlsChecked = await calculateTopBrother(femaleList.filter(g => g.checkedIn !== undefined && g.checkedIn !== -1));
          const topGuysChecked = await calculateTopBrother(maleList.filter(g => g.checkedIn !== undefined && g.checkedIn !== -1));
  
          setStats({
            maleCount: maleList.length,
            femaleCount: femaleList.length,
            checkedIn: checked,
            notCheckedIn: notChecked,
            checkInTimes: checkInTimes,
            checkedGirls: checkedGirls,
            checkedGuys: checkedGuys,
            mostCheckIns: topGuestsChecked,
            mostGirlsCheckIns: topGirlsChecked,
            mostGuysCheckIns: topGuysChecked,
          });
        } catch (e) {
          console.error(e);
          setError('Failed to load stats');
        } finally {
          setLoading(false);
        }
      };
  
      fetchStats();
  }, [selectedEventId]);

  if (error) return <div className="text-red-500 text-center mt-10">{error}</div>;
  if (loading) return <div className="text-center mt-10 text-black">Loading stats...</div>;

  return (
    <div className="absolute box-border top-nav h-screen-with-nav w-full bg-gradient-to-b justify-center items-top text-center from-blue-50 to-gray-100 p-5 min-w-[420px] overflow-auto">
      <h1 className="text-4xl md:text-4xl font-bold text-center align-top py-4 text-gray-800">Event Stats</h1>
      <div className="mb-4 items-center justify-center flex flex-col">
        <label htmlFor="eventSelect" className="block text-sm font-medium text-gray-700 mb-1">Select Event</label>
        <select
          id="eventSelect"
          value={selectedEventId}
          onChange={e => setSelectedEventId(e.target.value)}
          className="mt-1 block w-1/3 py-2 px-3 border text-black border-gray-300 bg-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.name}</option>
          ))}
        </select>
      </div>
      <div className="grid-cols-1 gap-4 justify-center items-center flex flex-col">
        <div className="w-3/4 justify-self-center grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          
          <div className="p-4 bg-green-500 rounded-lg">
            <p className="text-2xl font-semibold">Number of Guests</p>
            <p className="text-lg">List: {stats.femaleCount + stats.maleCount}</p>
            <p className="text-lg">Checked-In: {stats.checkedIn}</p>
            <p className="text-lg">Check-In Percentage: {((stats.checkedIn / (stats.femaleCount + stats.maleCount)) *100 ).toFixed(1)}%</p>
          </div>
          
          <div className="p-4 bg-blue-500 rounded-lg">
            <p className="text-2xl font-semibold">Ratio (Girls : Guys)</p>
            <p className="text-lg">List ratio: {(stats.femaleCount / stats.maleCount).toFixed(2)}</p>
            <p className="text-lg">Checked-In ratio: {(stats.checkedGirls / stats.checkedGuys).toFixed(2)}</p>
          </div>
          
          <div className="p-4 bg-purple-500 rounded-lg">
            <p className="text-2xl font-semibold">Records</p>
            <p className="text-md">Most Check-ins: {stats.mostCheckIns}</p>
            <p className="text-md">Most Female Check-ins: {stats.mostGirlsCheckIns}</p>
            <p className="text-md">Most Male Check-ins: {stats.mostGuysCheckIns}</p>
          </div>
        </div>
      </div>
      <CheckInGraph checkInTimes={stats.checkInTimes} />
      </div>
  );
}

async function calculateTopBrother(guests: Guest[]): Promise<string> {
  const counts: Record<string, number> = {};
  guests.forEach(g => {
    if (g.checkedIn !== undefined && g.checkedIn !== -1) {
      counts[g.addedBy] = (counts[g.addedBy] || 0) + 1;
    }
  });
  let topUid = '';
  let max = 0;
  Object.entries(counts).forEach(([uid, c]) => {
    if (c > max) {
      max = c;
      topUid = uid;
    }
  });
  let topName = '';
  if (topUid) {
    const userRef = ref(database, `users/${topUid}`);
    const usnap = await get(userRef);
    topName = usnap.exists() ? usnap.val().displayName : topUid;
    return topName;
  }
  return '—';
}
