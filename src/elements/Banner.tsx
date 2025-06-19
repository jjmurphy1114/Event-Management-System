import {Link, useLocation, useNavigate} from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../state/store";
import { fetchUser } from "../state/userSlice";

function Banner() {
  const auth = getAuth();

  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch<AppDispatch>();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const onWaitingScreen: boolean = useLocation().pathname === "/waiting-approval";
  const navigate = useNavigate();

  useEffect(() => {
    // Track auth state changes to ensure user info is loaded on first render
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // User is signed in, set user state
        dispatch(fetchUser());
      }
    });

    return () => unsubscribe();
  }, [auth, dispatch]);

  const handleSignOut = () => {

    signOut(auth).then(() => {
      if(onWaitingScreen) navigate("/");
    }).catch((error) => console.error("Error signing out:", error));
  };

  if (user.loading) {
    return <div className="bg-gray-800 fixed top-0 left-0 right-0 h-16 shadow-md z-50"></div>;
  }

  return (
    <nav className="bg-gray-800 fixed top-0 left-0 right-0 shadow-md z-50 h-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Site Title */}
          <div className="flex items-center">
            <Link
              to="/"
              className="text-white font-bold text-lg md:text-2xl truncate"
            >
              Event Management System
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
            {(user.approved) && (
            <Link
              to="/"
              className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              Home
            </Link>
            )}
            {(user.status === "Admin" || user.status === "Social") && (
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
                <Link
                  to="/stats"
                  className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Stats Page
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
            <Link
              to="/"
              className="block text-gray-300 hover:bg-gray-600 hover:text-white px-3 py-2 rounded-md text-base font-medium"

            >
              Home
            </Link>
            {(user.status === "Admin" || user.status === "Social") && (
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
                <Link
                  to="/stats"
                  className="block text-gray-300 hover:bg-gray-600 hover:text-white px-3 py-2 rounded-md text-base font-medium"
                >
                  Stats Page
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
