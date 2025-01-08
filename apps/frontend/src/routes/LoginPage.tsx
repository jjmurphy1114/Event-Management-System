import React, {useRef, useState} from 'react';
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import { ref, get, child } from "firebase/database";
import { database } from 'backend/src/firebaseConfig';

export default function LoginPage() { 
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const auth = getAuth();

  const passwordRef = useRef<HTMLInputElement>(null);

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        console.log('Signed in:', user);
        setError('');

       // Check if the user is approved
      const userRef = ref(database, `users/${user.uid}`);
      const approvedSnapshot = await get(child(userRef, "approved"));
      const isApproved = approvedSnapshot.exists() ? approvedSnapshot.val() : false;

      if (isApproved) {
        navigate('/'); // Navigate to home if approved
      } else {
        navigate('/waiting-approval'); // Redirect to approval page if not approved
      }
      })
      .catch((error) => {
        setError(`Login failed! Code: ${error.code} | Message: ${error.message}`);
      });
  };

  const handleKeyDown = (event: React.KeyboardEvent, onPassword: boolean) => {
    if(event.key === 'Enter') {
      if(onPassword) handleLogin();
      else if(passwordRef.current) passwordRef.current.focus();
    }
  }

  // @ts-expect-error Handler is unused at the moment
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        console.log('Sign-out successful');
        navigate('/login'); // Navigate back to login page after logout
      })
      .catch((error) => {
        setError(`Logout failed: ${error.message}`);
      });
  };

  const handleRedirect = () => {
    navigate('/signup');
  };

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-gradient-to-b from-blue-100 to-gray-200">
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-sm text-gray-700">
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(event) => handleKeyDown(event, false)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter your email"
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(event: React.KeyboardEvent) => handleKeyDown(event, true)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter your password"
            ref={passwordRef}
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={handleLogin}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Login
          </button>
          <button
            onClick={handleRedirect}
            className="bg-indigo-500 hover:bg-indgo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Sign-Up
          </button>
        </div>
      </div>
    </div>
  );
}
