import React, { useEffect, useState } from 'react';
import { ref, onValue, update, remove } from 'firebase/database';
import { database } from '../../../backend/firebaseConfig'; // Firebase config
import User from '../../../backend/User';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function SocialSettings() {
  const [users, setUsers] = useState<User[]>([]);
  const navigate = useNavigate();

  // Fetch users from Firebase when the component loads
  useEffect(() => {
    const usersRef = ref(database, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      const loadedUsers = data ? Object.keys(data).map((key) => ({ id: key, ...data[key] })) : [];
      setUsers(loadedUsers);
    });
  }, []);

  // Approve a user by updating their "approved" status in Firebase
  const approveUser = (userId: string) => {
    const userRef = ref(database, `users/${userId}`);
    update(userRef, { approved: true });
  };

  const deleteUser = async (id: string) => {
    try {
      remove(ref(database, `users/${id}`)); // Remove from Realtime Database
      const response = await axios.delete(`http://localhost:5000/api/delete-user/${id}`);
      console.log("Successfully deleted user:", response.data);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  // Change the status (Default, Social, Admin) for a user
  const changeStatus = (userId: string, newStatus: string) => {
    const userRef = ref(database, `users/${userId}`);
    update(userRef, { status: newStatus });
  };

  const changeSocialPriviliges = (userId: string, newPriviliges: boolean) => {
    const userRef = ref(database, `users/${userId}`);
    update(userRef, { priviliges: newPriviliges });
  }

  const handleRedirect = () => {
    navigate('/');
  }


  return (
    <div className="h-screen w-screen bg-gradient-to-b from-blue-50 to-gray-100 p-10">
    <button type="button" onClick={handleRedirect} className="px-4 py-2 mb-2 mt-4 bg-indigo-500 text-white font-semibold rounded-md shadow hover:bg-indigo-600 focus:outline-none focus:ring focus:ring-indigo-200">
      Back to Home
    </button>
      <div className="container mx-auto bg-white p-6 shadow-md rounded-lg">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-700">Manage Users</h1>
        <table className="min-w-full bg-white text-gray-700 items-center text-center">
          <thead>
            <tr>
              <th className="py-2">Email</th>
              <th className="py-2">Status</th>
              <th className="py-2">Actions</th>
              <th className='py-2'>Has Social Priviliges?</th>
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
                           checked={user.priviliges} 
                           onChange={(e) => changeSocialPriviliges(user.id, e.target.checked)}
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
