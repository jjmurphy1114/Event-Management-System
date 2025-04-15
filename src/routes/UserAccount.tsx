import {getAuth, updateEmail, updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, User as FirebaseUser} from "firebase/auth";
import {useNavigate} from "react-router-dom";
import {useCallback, useEffect, useState} from "react";
import User, {defaultUserType, UserType, validateAndReturnUser} from "../types/User.ts";
import {database} from "../services/firebaseConfig.ts";
import {get, push, ref, remove, update} from "firebase/database";
import {isEqual} from "lodash";
import {FirebaseError} from "firebase/app";
import PersonalGuestList from "../elements/PersonalGuestList.tsx";
import Guest from "../types/Guest.ts";

const UserAccount = () => {
  const [user, setUser] = useState<User>(new User(defaultUserType));
  const [prevUserData, setPrevUserData] = useState<User>(user);
  
  const [guestName, setGuestName] = useState<string>("");
  
  const [oldPassword, setOldPassword] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [confirmNewPassword, setConfirmNewPassword] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<boolean>(false);
  const [passwordUpdateText, setPasswordUpdateText] = useState<{text: string, type: "info" | "error"} | null>(null);
  
  const [emailError, setEmailError] = useState<boolean>(false);
  
  const navigate = useNavigate();
  const auth = getAuth();
  
  if(!auth.currentUser) navigate("/login");
  
  const [authUser] = useState<FirebaseUser>(auth.currentUser!);
  
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const fetchUserData = useCallback(async () => {
    const databaseRef = ref(database, `/users/${authUser.uid}`);
    const userSnapshot = await get(databaseRef);
    
    if(userSnapshot.exists()) {
      const userData: UserType | undefined = validateAndReturnUser(userSnapshot.val());
      if(userData) {
        const userObj = new User(userData);
        setUser(userObj);
        setPrevUserData(userObj);
      } else {
        console.error("Could not validate user data!");
      }
    } else {
      console.error(`Could not fetch user data for uid: ${authUser.uid}!`);
    }
  }, [authUser.uid]);
  
  useEffect(() => {
    fetchUserData().then(
      () => console.debug("Successfully fetched user data!")
    ).catch(
      (e) => console.error("An error occurred while fetching user data: ", e)
    );
    
  }, [authUser, fetchUserData]);
  
  useEffect(() => {
    if(validateEmail(user.email)) {
      setEmailError(false);
    } else {
      setEmailError(true);
    }
  }, [user.email]);
  
  useEffect(() => {
    if(newPassword !== confirmNewPassword) {
      setPasswordError(true);
    } else {
      setPasswordError(false);
    }
  }, [confirmNewPassword, newPassword]);
  
  const handleSaveUser = async () => {
    const newUserParams = user.params;
    const oldUserParams = prevUserData.params;

    if(!validateEmail(newUserParams.email)) return;

    const databaseRef = ref(database, `/users/${user.id}`);
    await update(databaseRef, newUserParams);
    
    if(newUserParams.email !== oldUserParams.email) {
      await updateEmail(authUser, newUserParams.email);
    }
    
    if(newUserParams.displayName !== oldUserParams.displayName) {
      await updateProfile(authUser, {
        displayName: newUserParams.displayName,
      })
    }
    
    window.location.reload();
  };
  
  const handleUpdatePassword = async () => {
    if(newPassword !== confirmNewPassword) {
      setPasswordUpdateText({text: `New passwords do not match!`, type: "error"});
      return;
    }
    
    if(!oldPassword) {
      setPasswordUpdateText({text: `Old password not set!`, type: "error"});
      return;
    }
    
    const credential = EmailAuthProvider.credential(user.email, oldPassword!);
    
    reauthenticateWithCredential(authUser, credential).then(() => {
      updatePassword(authUser, newPassword!).then(() => {
        setPasswordUpdateText({text: `Password updated successfully!`, type: "info"});
      }).catch((error) => {
        if(error instanceof FirebaseError) {
          console.error(`Firebase error: `, error.code, error.message);
          if(error.code === "auth/weak-password") {
            setPasswordUpdateText({text: `New password is too weak! ${error.message}`, type: "error"});
          } else {
            setPasswordUpdateText({text: "An unknown error occurred!", type: "error"});
          }
        }
      });
    }).catch((error) => {
      if(error instanceof FirebaseError) {
        console.error(`Firebase Error: `, error.code, error.message);
        if(error.code === "auth/invalid-credential") {
          setPasswordUpdateText({text: `Old Password incorrect!`, type: "error"});
        } else {
          setPasswordUpdateText({text: "An unknown error occurred!", type: "error"});
        }
      }
    })
    
    console.log("Password updated successfully!");
    
    setNewPassword(null);
    setConfirmNewPassword(null);
  };
  
  const handleDeleteUser = () => {
    if(confirm(`Are you sure you want to delete your account? This is irreversible!`)) {
      // Check if there is more than 1 user in the database
      const usersRef = ref(database, `/users`);
      get(usersRef).then((usersSnapshot) => {
        if (usersSnapshot.exists()) {
          const users = usersSnapshot.val();
          const userCount = Object.keys(users).length;
    
          if (userCount <= 1) {
            console.error("Cannot remove user, only 1 user in database");
            alert("Cannot remove user, only 1 user in database");
            return;
          }
        }
        const databaseRef = ref(database, `/users/${user.id}`);
        remove(databaseRef).then(() => {
          console.log("Successfully deleted user");
          auth.signOut().then(() => {
            navigate("/");
          });
        }).catch((error) => {
          console.error("Error deleting user", error);
        });
      }).catch((error) => {
        console.error("Error getting user data", error);
      });
    }
  }
  
  const handleAddGuest = async (gender: 'male' | 'female') => {
    const databaseRef = ref(database,
      `/users/${user.id}/${gender == 'male' ? 'malePersonalGuestList' : 'femalePersonalGuestList'}`);
    
    const newGuestRef = await push(databaseRef);
    const newGuestData = new Guest(guestName, user.id);
    
    await update(newGuestRef, newGuestData);
    
    setGuestName("");
    
    fetchUserData().then(() => {
      console.debug(`User data updated successfully!`);
    }).catch((error) => {
      console.error(`User data not updated successfully!`);
      console.error(error);
    });
  }
  
  const handleDeleteGuest = async (gender: 'male' | 'female', id: string) => {
    const databaseRef = ref(database, `/users/${user.id}/${gender == 'male' ? 'malePersonalGuestList' : 'femalePersonalGuestList'}/${id}`);
    await remove(databaseRef);
    
    fetchUserData().then(() => {
      console.debug(`User data updated successfully!`);
    }).catch((error) => {
      console.error(`User data not updated successfully!`);
      console.error(error);
    });
  }
  
  return (
    <div className={"absolute box-border top-nav w-full h-fit min-w-[420px] p-5 flex flex-col items-center bg-gradient-to-b from-blue-50 to-gray-100"}>
      <div className={`2xl:w-[50%] xl:w-[60%] lg:w-[70%] md:w-[80%] sm:w-[90%] w-full mb-5 rounded-md shadow-lg bg-gradient-to-b from-blue-50 to-gray-100`}>
        <div className={`box-border p-5 flex flex-col items-center`}>
          <h1 className="text-4xl font-bold text-center text-gray-800 w-full">
            User Settings
          </h1>
          <div className={`w-full grid grid-cols-1 gap-5 lg:grid-cols-2 py-5`}>
            <div
              className={`w-full p-5 col-span-1 flex flex-col align-middle items-center rounded-md shadow-lg bg-gradient-to-b from-blue-50 to-gray-100`}>
              <h1 className="text-2xl pb-4 font-bold text-center text-gray-800 w-full">Information</h1>
              <label htmlFor={"displayName"}
                     className="self-start block text-sm font-medium text-gray-700">Change Display Name</label>
              <input
                id={"displayName"}
                type={"text"}
                value={user.displayName}
                onChange={(event) => setUser((prevUser) => new User({
                  ...prevUser,
                  displayName: event.target.value
                }))}
                className="mb-5 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <label htmlFor={"email"} className="self-start block text-sm font-medium text-gray-700">Change
                Email</label>
              {emailError &&
                <label htmlFor={"email"} className="self-start block text-sm font-medium text-red-700">Email
                  incorrectly formatted!</label>
              }
              <input
                id={"email"}
                type={"email"}
                value={user.email}
                onChange={(event) => {
                  setUser((prevUser) => new User({
                    ...prevUser,
                    email: event.target.value,
                  }));
                }}
                className={`mb-5 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 ${emailError ? `focus:ring-red-500` : `focus:ring-blue-400`}`}
              />
              <label htmlFor={"status"} className="self-start block text-sm font-medium text-gray-700">User
                Status</label>
              <input
                id={"status"}
                type={"text"}
                value={user.status}
                readOnly={true}
                className={"mb-5 cursor-not-allowed w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none"}
              />
              {!isEqual(user.params, prevUserData.params) ?
                <div className={`w-full flex flex-col sm:flex-row items-center justify-center align-middle`}>
                  <button
                    onClick={handleSaveUser}
                    disabled={emailError}
                    className={`h-full w-full basis-[100%] sm:basis-[40%] bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-green-600 disabled:text-gray-200 disabled:hover:border-transparent disabled:cursor-not-allowed`}
                  >
                    Save Information
                  </button>
                  <div className={"h-10 w-full sm:h-full sm:w-0 sm:basis-[5%]"}></div>
                  <button
                    onClick={() => setUser(new User(prevUserData.params))}
                    className="h-full w-full basis-[100%] sm:basis-[40%] bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Discard
                  </button>
                </div>
                : <></>
              }
            </div>
            <div
              className={`w-full p-5 col-span-1 flex flex-col align-middle items-center rounded-md shadow-lg bg-gradient-to-b from-blue-50 to-gray-100`}>
              <h1 className="text-2xl pb-5 font-bold text-center text-gray-800 w-full">Password</h1>
              {passwordUpdateText && (
                <p
                  className={`w-full pb-5 text-center text-xl ${passwordUpdateText.type === "error" ? `text-red-500` : 'text-gray-700'}`}>
                  {passwordUpdateText.text}
                </p>
              )}
              <label htmlFor={"oldPassword"}
                     className="self-start block text-sm font-medium text-gray-700">Old Password</label>
              <input
                id={"oldPassword"}
                type={"password"}
                value={oldPassword ?? ""}
                onChange={(event) => event.target.value === "" ? setOldPassword(null) : setOldPassword(event.target.value)}
                className="mb-5 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <label htmlFor={"newPassword"}
                     className="self-start block text-sm font-medium text-gray-700">New Password</label>
              <input
                id={"newPassword"}
                type={"password"}
                value={newPassword ?? ""}
                onChange={(event) => event.target.value === "" ? setNewPassword(null) : setNewPassword(event.target.value)}
                className="mb-5 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <label htmlFor={"confirmPassword"}
                     className="self-start block text-sm font-medium text-gray-700">Confirm New Password</label>
              {passwordError && confirmNewPassword !== null &&
                <label htmlFor={"confirmPassword"} className="self-start block text-sm font-medium text-red-700">Passwords
                  must match!</label>
              }
              <input
                id={"confirmPassword"}
                type={"password"}
                value={confirmNewPassword ?? ""}
                onChange={(event) => event.target.value === "" ? setConfirmNewPassword(null) : setConfirmNewPassword(event.target.value)}
                className={`mb-5 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 ${passwordError && confirmNewPassword !== null ? `focus:ring-red-500` : `focus:ring-blue-400`}`}
              />
              {newPassword && confirmNewPassword ?
                <div className={`w-full flex flex-col sm:flex-row items-center justify-center align-middle`}>
                  <button
                    onClick={handleUpdatePassword}
                    disabled={passwordError || !oldPassword}
                    className={`h-full w-full basis-[100%] sm:basis-[40%] bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-green-600 disabled:text-gray-200 disabled:hover:border-transparent disabled:cursor-not-allowed`}
                  >
                    Update Password
                  </button>
                  <div className={"h-10 w-full sm:h-full sm:w-0 sm:basis-[5%]"}></div>
                  <button
                    onClick={() => {
                      setNewPassword(null);
                      setConfirmNewPassword(null);
                    }}
                    className="h-full w-full basis-[100%] sm:basis-[40%] bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Cancel
                  </button>
                </div>
                : <></>
              }
            </div>
          </div>
          <button
            className={`md:w-[30%] sm:w-[40%] w-[75%] bg-red-500 text-white rounded-md hover:bg-red-600`}
            onClick={handleDeleteUser}
          >
            Delete Account
          </button>
        </div>
      </div>
      <div className={`2xl:w-[50%] xl:w-[60%] lg:w-[70%] md:w-[80%] sm:w-[90%] w-full h-fit rounded-md shadow-lg bg-gradient-to-b from-blue-50 to-gray-100`}>
        <div className={`box-border p-5 flex flex-col items-center`}>
          <h1 className={`text-4xl font-bold text-center text-gray-800 w-full`}>Personal Guest Lists</h1>
          <div className="flex flex-col items-center col-span-full my-4 w-full">
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Enter guest name"
              className="w-2/3 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="mt-7 flex flex-auto justify-between space-x-5 m-2 w-[70%] sm:w-[50%] lg:w-[35%]">
              <button
                onClick={() => handleAddGuest('male')}
                className="bg-blue-500 text-white rounded-md font-semibold hover:bg-blue-600 p-2 w-[50%]"
              >
                Add Male
              </button>
              <button
                  onClick={() => handleAddGuest('female')}
                  className="bg-pink-500 text-white rounded-md font-semibold hover:bg-pink-600 p-2 w-[50%]"
                >
                  Add Female
              </button>
            </div>
          </div>
          <div className={`grid grid-cols-1 xl:grid-cols-2 gap-4 w-full`}>
            <PersonalGuestList guestList={user.malePersonalGuestList} gender={"male"} editingMode={true} handleDeletePersonalGuest={handleDeleteGuest}/>
            <PersonalGuestList guestList={user.femalePersonalGuestList} gender={"female"} editingMode={true} handleDeletePersonalGuest={handleDeleteGuest}/>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserAccount;