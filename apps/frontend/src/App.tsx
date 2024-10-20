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

function Root() {
  const navigate = useNavigate();
  return (
      <Outlet />
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
