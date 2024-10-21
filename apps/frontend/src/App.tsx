import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useNavigate,
} from "react-router-dom";
import './App.css';
import { database } from '../../backend/firebaseConfig';
import EventsPage from './routes/EventsPage';
import HomePage from './routes/HomePage';
import LoginPage from "./routes/LoginPage";
import SignUpPage from "./routes/SignUpPage";
import WaitingApproval from "./routes/WaitingApproval";

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
        element: <HomePage /> 
      },
      { 
        path: "events", 
        element: <EventsPage database={database} /> 
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
      }

    ],
  },
]);

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;
