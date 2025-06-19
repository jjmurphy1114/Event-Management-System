import Guest from "../types/Guest.ts";
import {useEffect, useRef} from "react";
import {getGuestListType, GuestListTypes} from "../types/Event.ts";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../state/store.ts";
import { fetchUser } from "../state/userSlice.ts";

interface GuestListProps {
    guestList: Record<string, Guest>;
    type: "general" | "waitlist" | "personal";
    userNames: { [p: string]: string };
    fetchUserName: (userID: string) => Promise<string>;
    userStatus: string;
    frontDoorMode: boolean;
    searching?: boolean;
    handleDeleteGuest?: (listName: GuestListTypes, guestID: string) => Promise<void>;
    handleCheckInGuest?: (guestID: string) => Promise<void>;
    handleUncheckInGuest?: (guestID: string) => Promise<void>;
    handleApproveGuest?: (guestID: string) => Promise<void>;
    handleAddGuestFromPersonal?: (guestID: string) => Promise<void>;
}

const GuestList = (props: GuestListProps) => {
  const checkInIdleColor = useRef<string>("bg-blue-500");
  const checkInHoverColor = useRef<string>("bg-blue-600");
  const backgroundColor = useRef<string>("bg-blue-100");
  
  const guestListType = getGuestListType(props.type);

  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch<AppDispatch>();
  
  useEffect(() => {
    dispatch(fetchUser());
  }, [dispatch]);

  
  if(props.type === "general" && (!props.handleCheckInGuest || !props.handleUncheckInGuest))
    throw new Error("If rendering GuestList as a normal guest list, you must define the handleCheckInGuest and handleUncheckInGuest methods! Did you mean to set isWaitlist to true?");
  
  if(props.type === "waitlist" && !props.handleApproveGuest)
    throw new Error("If rendering GuestList as a waitlist, you must define the handleApproveGuest method!");
  
  if(props.type === "personal" && !props.handleAddGuestFromPersonal)
    throw new Error("If rendering GuestList as a personal guest list, you must define the handleAddGuestFromPersonal method!");
  
  return (
    <div className="p-4 rounded-lg col-span-1 lg:col-span-1">
      <h2 className="text-3xl font-bold mb-4 text-center text-gray-800">{props.type === "waitlist" ? "Waitlist" : props.type === "general" ? "Guests" : "Personal Guests"}</h2>
      <div className="mb-8 space-y-4 min-h-[20rem]">
        {Object.keys(props.guestList).length > 0 ? (
          Object.entries(props.guestList).map(([guestID, guest]) => (
            <div key={guestID}
              className={`${backgroundColor.current} p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between space-x-0 space-y-5 sm:space-x-5 sm:space-y-0 items-center align-middle w-full`}
            >
              <div className="grid-rows-2 self-start sm:self-auto">
                <p className="text-lg font-semibold text-gray-700">{guest.name}</p>
                {props.type !== "personal" && (<p className="text-sm text-gray-700">Added By: {props.userNames[guest.addedBy] || (() => {
                  props.fetchUserName(guest.addedBy).then();
                  return 'Loading...';
                })()}</p>)}
              </div>
              <div
                className={`${props.userStatus !== "Admin" && guest.addedBy !== user.id && guest.checkedIn != -1 ? "basis-[25%]" : "basis-[40%] xl:basis-[50%]"} flex flex-row items-center align-middle justify-end space-x-5`}
              >
                {props.type === "waitlist" ?
                  (props.userStatus === "Admin" || props.userStatus === "Social") && (
                    <button
                      onClick={() => props.handleApproveGuest!(guestID)}
                      className="sm:mt-0 bg-purple-500 text-white rounded-md font-semibold hover:bg-purple-600"
                    >
                      Approve
                    </button>
                  ) :
                  (guest.checkedIn !== -1 || (props.userStatus === "Admin" && props.frontDoorMode)) && (props.type !== "personal") && (
                    <button
                      onClick={guest.checkedIn === -1 ? () => props.handleCheckInGuest!(guestID) : () => confirm(`Uncheck in ${guest.name}?`) ? props.handleUncheckInGuest!(guestID) : undefined}
                      className={`${guest.checkedIn !== -1 ? "text-sm": ""} self-stretch flex-grow sm:mt-0 rounded-md font-semibold ${checkInIdleColor.current} text-white ${props.userStatus !== "Admin" ? 'cursor-not-allowed border-none hover:border-none' : `hover:${checkInHoverColor.current}`}`}
                      disabled={props.userStatus !== "Admin"}
                      
                    >
                      {guest.checkedIn === -1 ? 'Check In' : `${new Date(guest.checkedIn).toLocaleString("en-US", {
                        year: "2-digit",
                        month: "numeric",
                        day: "numeric",
                        hour12: true,
                        hour: "numeric",
                        minute: "numeric",
                        second: "numeric"
                      })}`}
                    </button>
                  )
                }
                {props.type !== 'personal' ? (user.id === guest.addedBy || props.userStatus === "Admin") && (
                  <button
                    onClick={() => props.handleDeleteGuest!(guestListType, guestID)}
                    className="sm:mt-0 bg-red-500 text-white rounded-md font-semibold hover:bg-red-600"
                  >
                    Delete
                  </button>
                ) : (
                  <button
                    onClick={() => props.handleAddGuestFromPersonal!(guestID)}
                    className={`sm:mt-0 ${checkInIdleColor.current} text-white rounded-md font-semibold hover:${checkInHoverColor.current}`}
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center">{!props.searching ? `No guests ${props.type === "waitlist" ? "on the waitlist" : "added"} yet.` : `No guest found.`}</p>
        )}
      </div>
    </div>
  );
}

export default GuestList;