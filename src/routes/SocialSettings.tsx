import { useEffect, useState } from 'react';
import { ref, onValue, update, remove, get } from 'firebase/database';
import { database } from '../services/firebaseConfig'; // Firebase config
import User, {UserType, validateAndReturnUser} from '../types/User';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';

export default function SocialSettings() {
  const [users, setUsers] = useState<User[]>([]);
  const [userStatus, setUserStatus] = useState("");
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  // Fetch users from Firebase when the component loads
  useEffect(() => {
    const usersRef = ref(database, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();

      const loadedUsers: User[] = [];

      for(const id in data) {
        const userData: UserType | undefined = validateAndReturnUser(data[id]);

        if(userData) loadedUsers.push(new User(userData));
      }

      setUsers(loadedUsers);
    });

    const getUserData = async () => {
      // Fetch status and social privileges for the current user
      if (user) {
        const userRef = ref(database, `users/${user.uid}`);
        const userSnapshot = await get(userRef);
        if (userSnapshot.exists()) {
          setUserStatus(userSnapshot.val().status);
        }
      }
    }
    
    getUserData().then();
  }, [user]);

  // Approve a user by updating their "approved" status in Firebase
  const approveUser = (userId: string) => {
    console.log(`userId: ${userId}`);
    const userRef = ref(database, `users/${userId}`);
    update(userRef, { approved: true }).then(() => {
      console.log("Updated user data");
    });
  };

  const deleteUser = async (id: string) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    // Prevent the current user from deleting themselves
    if (currentUser && currentUser.uid === id) {
      console.error("Error: You cannot delete your own account.");
      alert("Error: You cannot delete your own account.");
      return;
    }
  
    try {
      // Check if there is more than 1 user in the database
      const usersRef = ref(database, `users`);
      const usersSnapshot = await get(usersRef);
  
      if (usersSnapshot.exists()) {
        const users = usersSnapshot.val();
        const userCount = Object.keys(users).length;
  
        if (userCount <= 1) {
          console.error("Cannot remove user, only 1 user in database");
          alert("Cannot remove user, only 1 user in database");
          return;
        }
      }
  
      // Proceed with deletion if conditions are met
      await remove(ref(database, `users/${id}`)); // Remove from Realtime Database
      console.log("Successfully deleted user");
  
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  // Change the status (Default, Social, Admin) for a user
const changeStatus = async (userId: string, newStatus: string) => {
  const userRef = ref(database, `users/${userId}`);
  const userSnapshot = await get(userRef);
  const user = userSnapshot.val();

  if (userStatus != "Admin"){
    return;
  }

  // Only update if approved is true
  if (user && user.approved === true) {
    update(userRef, { status: newStatus }).then(() => {
      console.log("User status updated");
    });
  } else {
    console.error("User must be approved to change status.");
  }
};

// Change social privileges for a user
const changeSocialPrivileges = async (userId: string, newPrivileges: boolean) => {
  const userRef = ref(database, `users/${userId}`);
  const userSnapshot = await get(userRef);
  const user = userSnapshot.val();

  // Only update if approved is true
  if (user && user.approved === true) {
    update(userRef, { privileges: newPrivileges }).then(() => {
      console.log("User social privileges updated");
    });
  } else {
    console.error("User must be approved to change privileges.");
  }
};

  const handleRedirectBlacklist = () => {
    if (userStatus === "Admin"){
      navigate('/blacklist');
    }
  }


  return (
    <div className="h-screen w-screen bg-gradient-to-b from-blue-50 to-gray-100 p-10 pt-20">
      <h1 className="text-4xl font-bold text-center col-span-full my-2 text-gray-800 w-100 h-10">Manage Users</h1>
      <button className='bg-red-500 mb-2' onClick={handleRedirectBlacklist}>
        Manage Blacklist (Admin)
      </button>
      <div className="container mx-auto bg-white p-6 shadow-md rounded-lg">
        
        <table className="min-w-full bg-white text-gray-700 items-center text-center">
          <thead>
            <tr>
              <th className="py-2">Email</th>
              <th className="py-2">Status</th>
              <th className="py-2">Actions</th>
              <th className='py-2'>Has Social Privileges?</th>
              <th className='py-2'>Delete User</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="border px-4 py-2 items-center text-center">{user.email}</td>
                <td className="border px-4 py-2 items-center text-center">
                  <select
                    value={user.status}
                    onChange={(e) => changeStatus(user.id, e.target.value)}
                    className="border p-2 text-white"
                    disabled={userStatus != "Admin"}
                  >
                    <option value="Default">Default</option>
                    <option value="Social">Social</option>
                    <option value="Admin">Admin</option>
                  </select>
                </td>
                <td className="border px-4 py-2 items-center text-center">
                  {user.approved ? (
                    <span className="text-green-500 font-bold">Approved</span>
                  ) : (
                    <button
                      onClick={() => approveUser(user.id)}
                      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Approve
                    </button>
                  )}
                </td>
                <td className='border px-4 py-2 items-center text-center'>
                    <input type='checkbox' 
                           checked={user.privileges} 
                           onChange={(e) => changeSocialPrivileges(user.id, e.target.checked)}
                           className="border border-gray-300 rounded-md px-4 py-2 mt-2 focus:outline-none"
                           style={{ transform: 'scale(2)'}}
                           />
                </td>
                <td className='border px-4 py-2 items-center text-center'>
                    <button
                        onClick={() => deleteUser(user.id)}
                        className='bg-red-700 hover:bg-red-700 rounded-md px-4 py-2 mt-2 focus:outline-none text-white'
                    >
                        Delete
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
