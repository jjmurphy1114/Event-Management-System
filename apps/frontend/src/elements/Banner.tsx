import {Link, useLocation, useNavigate} from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged, User } from "firebase/auth";
import { useState, useEffect } from "react";
import { database } from "backend/src/firebaseConfig";
import { ref, get } from "firebase/database";
import bannerImage from '../assets/ZM Parties.png';

function Banner() {
  const auth = getAuth();
  const [user, setUser] = useState<User | null>(null);
  const [userStatus, setUserStatus] = useState("");
  const [loading, setLoading] = useState(true); // Loading state for auth

  const onWaitingScreen: boolean = useLocation().pathname === "/waiting-approval";
  const navigate = useNavigate();

  useEffect(() => {
    // Track auth state changes to ensure user info is loaded on first render
    const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
      setUser(currentUser);
      setLoading(false); // Stop loading once auth state is determined
    });

    // Fetch status for the current user
    const fetchUserStatus = async () => {
      if (user) {
        const userRef = ref(database, `users/${user.uid}`);
        const userSnapshot = await get(userRef);
        if (userSnapshot.exists()) {
          setUserStatus(userSnapshot.val().status);
        }
      }
    }
    
  fetchUserStatus();
    return () => unsubscribe();
  }, [auth, user]);

  const handleSignOut = () => {

    signOut(auth).then(() => {
      if(onWaitingScreen) navigate("/");
    }).catch((error) => console.error("Error signing out:", error));
  };

  if (loading) {
    return <div className="bg-gray-800 fixed top-0 left-0 right-0 h-16 shadow-md z-50"></div>;
  }

  return (
    <nav className="bg-gray-800 fixed top-0 left-0 right-0 shadow-md z-50 h-16 mb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
          <img src={bannerImage} className="w-10 h-10 mr-3"/>
            <Link to="/" className="text-white text-2xl font-bold">
              ZM PARTIES
            </Link>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex space-x-4">
            {(userStatus === "Admin" || userStatus === "Social") && (
               <>
               <Link to="/events" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Events
              </Link>
             <Link to="/social-settings" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
               Social Settings
             </Link>
             </>
            )}
          </div>

          {/* User Profile / Login */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-gray-300 text-sm">{user.displayName || user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Banner;
