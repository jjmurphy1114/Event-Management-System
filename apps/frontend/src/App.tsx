import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useNavigate,
} from "react-router-dom";
import './App.css';
import { useEffect, useState } from "react";
import { database } from '../../backend/firebaseConfig';
import { ref, get, child } from "firebase/database";
import { onAuthStateChanged, getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import EventsPage from './routes/EventsPage';
import HomePage from './routes/HomePage';
import LoginPage from "./routes/LoginPage";
import SignUpPage from "./routes/SignUpPage";
import WaitingApproval from "./routes/WaitingApproval";
import SocialSettings from "./routes/SocialSettings";
import User from "../../backend/User";


const auth = getAuth();

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Failed to set persistence:", error);
});

const useUserStatus = () => {
  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Added loading state

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = ref(database, `users/${currentUser.uid}`);
        get(child(userRef, "status")).then((snapshot) => {
          if (snapshot.exists()) {
            setStatus(snapshot.val());
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setStatus(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return { user, status, loading };
};

const useRequireApproval = () => {
  const { user, loading } = useUserStatus();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else if (user.status == "pending") {
        navigate("/waiting-approval");
      }
    }
  }, [user, navigate, loading]);

  return { user, loading };
};

const useRequireStatus = (allowedStatuses: string[]) => {
  const { user, status, loading } = useUserStatus();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else if (user.status == "pending") {
        navigate("/waiting-approval");
      } else if (!allowedStatuses.includes(status ?? "Default")) {
        navigate("/");
      }
    }
  }, [user, status, allowedStatuses, navigate, loading]);

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
  const navigate = useNavigate();
  return (
      <Outlet/>
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

    ],
  },
]);

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;
