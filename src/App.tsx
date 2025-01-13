import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useNavigate,
  useLocation
} from "react-router-dom";
import './App.css';
import React, { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import {onAuthStateChanged, getAuth, setPersistence, browserLocalPersistence, User} from "firebase/auth";
import EventsPage from './routes/EventsPage';
import HomePage from './routes/HomePage';
import LoginPage from "./routes/LoginPage";
import SignUpPage from "./routes/SignUpPage";
import WaitingApproval from "./routes/WaitingApproval";
import SocialSettings from "./routes/SocialSettings";
import Banner from "./elements/Banner";
import IndividualEventPage from "./routes/IndividualEventPage.tsx";
import BlacklistPage from "./routes/BlacklistPage.tsx";
import {database} from "./services/firebaseConfig";


const auth = getAuth();

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Failed to set persistence:", error);
});

const useUserStatus = () => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [approved, setApproved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = ref(database, `users/${currentUser.uid}`);
        get(userRef).then((snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setStatus(userData.status || "Default");
            setApproved(userData.approved || false);
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setStatus(null);
        setApproved(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return { user, status, approved, loading };
};

const useRequireApproval = () => {
  const { user, approved, loading } = useUserStatus();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else if (approved === false) {
        navigate("/waiting-approval");
      }
    }
  }, [user, approved, navigate, loading]);

  return { user, loading };
};

const useRequireStatus = (allowedStatuses: string[]) => {
  const { user, status, approved, loading } = useUserStatus();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else if (approved === false) {
        navigate("/waiting-approval");
      } else if (!allowedStatuses.includes(status ?? "Default")) {
        navigate("/");
      }
    }
  }, [user, status, approved, allowedStatuses, navigate, loading]);

  return { user, status, loading };
};

function ProtectedRoute({ element }: { element: React.ReactElement }) {
  const { loading } = useRequireApproval();

  if (loading) {
    return <div>Loading...</div>; // Display a loading state while checking
  }

  return element;
}

function RoleProtectedRoute({ element, allowedStatuses }: { element: React.ReactElement, allowedStatuses: string[] }) {
  const { loading } = useRequireStatus(allowedStatuses);

  if (loading) {
    return <div>Loading...</div>; // Display a loading state while checking
  }

  return element;
}


function Root() {
  const location = useLocation();

  // Define routes where the Banner should not be shown
  const hideBannerRoutes = ["/login", "/signup"];
  const showBanner = !hideBannerRoutes.includes(location.pathname);

  return (
    <div>
      {showBanner && <Banner />}
      <Outlet />
    </div>
  );
}
const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <div>Error Page</div>,
    element: <Root />,
    children: [
      // Define child routes here if needed
      { 
        path: "", 
        element: <ProtectedRoute element={<HomePage />} />
      },
      { 
        path: "events", 
        element: <RoleProtectedRoute allowedStatuses={["Social", "Admin"]} element={<EventsPage database={database}/>} /> 
      },
      {
        path: "login",
        element: <LoginPage/>
      },
      {
        path: "/signup",
        element: <SignUpPage/>
      },
      {
        path: "/waiting-approval",
        element: <WaitingApproval/>
      },
      {
        path: "/social-settings",
        element: <RoleProtectedRoute allowedStatuses={["Social", "Admin"]} element={<SocialSettings/>} /> 
      },
      {
        path: "/events/:id",
        element: <ProtectedRoute element={<IndividualEventPage/>} />
      },
      {
        path: "/blacklist",
        element: <RoleProtectedRoute allowedStatuses={["Admin"]} element={<BlacklistPage/>}/>
      },


    ],
  },
]);

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;
