import { useEffect, useState } from 'react';
import { ref, onValue, update, remove, get } from 'firebase/database';
import { database } from '../firebaseConfig'; // Firebase config
import User, {UserType, validateAndReturnUser} from '../types/User';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';

export default function SocialSettings() {
  const [users, setUsers] = useState<User[]>([]);
  const [userStatus, setUserStatus] = useState("");
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const [searchName, setSearchName] = useState("");

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
    <div className="absolute top-nav min-w-[420px] h-screen-with-nav w-screen bg-gradient-to-b justify-center items-top from-blue-50 to-gray-100 p-5 overflow-auto">
      <h1 className="text-4xl md:text-4xl font-bold text-center align-top py-4 text-gray-800">Manage Users</h1>
  
      <div className="flex justify-center pt-4 pb-8">
        <button
          className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded"
          onClick={handleRedirectBlacklist}
        >
          Manage Blacklist (Admin)
        </button>
      </div>
      <div className="flex flex-col items-center col-span-full my-4 w-full">
      <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Search by name"
              className="w-2/3 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
      </div>
      <div className="container mx-auto lg:w-[80%] bg-white p-4 md:p-6 shadow-md rounded-lg">
        {/* Table Container */}
        <div className={"w-full overflow-x-auto"}>
          <table className="box-border w-full bg-white text-gray-700 text-center border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border">Display Name</th>
                <th className="py-2 px-4 border">Email</th>
                <th className="py-2 px-4 border">Status</th>
                <th className="py-2 px-4 border">Actions</th>
                <th className="py-2 px-4 border">Social Privileges</th>
                <th className="py-2 px-4 border">Delete User</th>
              </tr>
            </thead>
            {/* Filter users based on the searchName input */}
            <tbody>
              {users
                .filter((user) => 
                  user.displayName.toLowerCase().includes(searchName.toLowerCase()) || 
                  user.email.toLowerCase().includes(searchName.toLowerCase())
                )
                .map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">{user.displayName}</td>
                    <td className="border px-4 py-2">{user.email}</td>
                    <td className="border px-4 py-2">
                      <select
                        value={user.status}
                        onChange={(e) => changeStatus(user.id, e.target.value)}
                        className="border border-gray-300 text-white rounded-md px-2 py-1"
                        disabled={userStatus !== "Admin"}
                      >
                        <option value="Default">Default</option>
                        <option value="Social">Social</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                    <td className="border px-4 py-2">
                      {user.approved ? (
                        <span className="text-green-500 font-bold">Approved</span>
                      ) : (
                        <button
                          onClick={() => approveUser(user.id)}
                          className="bg-green-500 hover:bg-green-700 text-white font-medium py-1 px-3 rounded"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                    <td className="border px-4 py-2">
                      <input
                        type="checkbox"
                        checked={user.privileges}
                        onChange={(e) => changeSocialPrivileges(user.id, e.target.checked)}
                        className="transform scale-125"
                      />
                    </td>
                    <td className="border px-4 py-2">
                      <button
                        onClick={() => {
                          if (confirm(`Delete user, ${user.displayName}?\n(uid: ${user.id})`)) deleteUser(user.id).then(() => console.debug("Successfully deleted user"));
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded"
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
    </div>
  );
}
