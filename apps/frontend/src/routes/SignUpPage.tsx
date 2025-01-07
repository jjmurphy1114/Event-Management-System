import { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ref, set } from 'firebase/database'; // Or use Firestore for more flexibility
import { database } from 'backend/src/firebaseConfig'; // Your Firebase config
import { useNavigate } from 'react-router-dom';
import User, {defaultUserType} from 'backend/src/User';

export default function SignUpPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [newUser, setNewUser] = useState<User>(new User(defaultUserType));
  const [name, setName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const auth = getAuth();
  const navigate = useNavigate();

  const handleSignUp = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
          console.log("Account created in firebase authentication");
        const user = userCredential.user;

        // Set display name for the user
        updateProfile(user, {
          displayName: name, // Set display name here
        })
        .then(() => {
            console.log("Display name updated");
          // Save user info in the database, including the display name
          const userRef = ref(database, `users/${user.uid}`);
          set(userRef, {...newUser.params}).then(() => {
              console.log('Sign-up successful with display name:', user.displayName);
              setError('');
              navigate('/waiting-approval'); // Navigate to approval page after sign-up
          }).catch((err) => {
              console.error(`Account creation in database failed: ${err}`);
          });
        })
        .catch((error) => {
          setError(`Failed to set display name: ${error.message}`);
        });
      })
      .catch((error) => {
        setError(`Sign-up failed: ${error.message}`);
      });
  };

  const handleNameInput = (name: string) => {
    setName(name);
    setNewUser(new User({...newUser.params, displayName: name}));
  }

  const handleEmailInput = (email: string) => {
    setEmail(email);
    setNewUser(new User({...newUser.params, email: email}));
  }

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-gradient-to-b from-blue-100 to-gray-200">
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-700">Sign Up</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Name
          </label>
          <input
            id="naem"
            type="text"
            value={name}
            onChange={(e) => handleNameInput(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter your name"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => handleEmailInput(e.target.value)}
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
            className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter your password"
          />
        </div>
        <div className='flex items-center justify-between'>
            <button
            onClick={handleSignUp}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
            Sign Up
            </button>
            <button
            onClick={() => {navigate('/login')}}
            className="bg-indigo-500 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
            Back
            </button>
        </div>
       
      </div>
    </div>
  );
}
