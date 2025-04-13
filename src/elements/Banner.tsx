import {Link, useLocation, useNavigate} from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged, User } from "firebase/auth";
import { useState, useEffect } from "react";
import { database } from "../services/firebaseConfig";
import { ref, get } from "firebase/database";
import bannerImage from '../assets/ZM Parties.png';

function Banner() {
  const auth = getAuth();
  const [user, setUser] = useState<User | null>(null);
  const [userStatus, setUserStatus] = useState("");
  const [loading, setLoading] = useState(true); // Loading state for auth
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    
    fetchUserStatus().then();
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
    <nav className="bg-gray-800 fixed top-0 left-0 right-0 shadow-md z-50 h-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Site Title */}
          <div className="flex items-center">
            <img src={bannerImage} className="w-8 h-8 mr-2" alt="TKE Banner Image" />
            <Link
              to="/"
              className="text-white font-bold text-lg md:text-2xl truncate"
            >
              ZM PARTIES
            </Link>
          </div>
    
          {/* Hamburger Menu for Mobile */}
          <div className="md:hidden flex items-center">
            <button
              className="text-gray-300 hover:text-white focus:outline-none"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
    
          {/* Desktop Nav Links */}
          <div className="hidden md:flex space-x-4">
            <Link
              to="/"
              className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              Home
            </Link>
            {(userStatus === "Admin" || userStatus === "Social") && (
              <>
                <Link
                  to="/events"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Events
                </Link>
                <Link
                  to="/social-settings"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Social Settings
                </Link>
              </>
            )}
          </div>
    
          {/* User Profile / Login */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to={"/user"}
                  className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium truncate"
                >
                  {user.displayName || user.email}
                </Link>
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
    
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="bg-gray-700 md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {(userStatus === "Admin" || userStatus === "Social") && (
              <>
                <Link
                  to="/events"
                  className="block text-gray-300 hover:bg-gray-600 hover:text-white px-3 py-2 rounded-md text-base font-medium"
                >
                  Events
                </Link>
                <Link
                  to="/social-settings"
                  className="block text-gray-300 hover:bg-gray-600 hover:text-white px-3 py-2 rounded-md text-base font-medium"
                >
                  Social Settings
                </Link>
              </>
            )}
            {user ? (
              <>
                <span className="block text-gray-300 px-3 py-2 rounded-md text-sm truncate">
                  {user.displayName || user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="block w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-base font-medium"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-base font-medium"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Banner;
