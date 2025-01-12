import Guest from "../types/Guest.ts";
import {useRef} from "react";

interface GuestListProps {
    guestList: Guest[];
    gender: "male" | "female";
    isWaitList?: boolean;
    userNames: { [p: string]: string };
    fetchUserName: (userID: string) => Promise<string>;
    userID: string;
    userStatus: string;
    frontDoorMode: boolean;
    handleDeleteGuest: (gender: "male" | "female", index: number, listType: "guestList" | "waitList") => Promise<void>;
    handleCheckInGuest?: (gender: "male" | "female", index: number) => Promise<void>;
    handleUncheckInGuest?: (gender: "male" | "female", index: number) => Promise<void>;
    handleApproveGuest?: (gender: "male" | "female", index: number) => Promise<void>
}

const GuestList = (props: GuestListProps) => {
  const checkInIdleColor = useRef<string>(props.gender === "female" ? "bg-pink-500" : "bg-blue-500");
  const checkInHoverColor = useRef<string>(props.gender === "female" ? "bg-pink-600" : "bg-blue-600");
  const backgroundColor = useRef<string>(props.gender === "female" ? "bg-pink-100" : "bg-blue-100");
  
  if(!props.isWaitList && (!props.handleCheckInGuest || !props.handleUncheckInGuest))
    throw new Error("If rendering GuestList as a normal guest list, you must define the handleCheckInGuest and handleUncheckInGuest methods! Did you mean to set isWaitlist to true?");
  
  if(props.isWaitList && !props.handleApproveGuest)
    throw new Error("If rendering GuestList as a waitlist, you must define the handleApproveGuest method!");
  
  return (
    <div className="p-4 rounded-lg col-span-1 lg:col-span-1">
      <h2 className="text-3xl font-bold mb-4 text-center text-gray-800">{props.gender === "female" ? "Female" : "Male"} {props.isWaitList ? "Waitlist" : "Guests"}</h2>
      <div className="mb-8 space-y-4 min-h-[20rem]">
        {props.guestList.length > 0 ? (
          props.guestList.map((guest, index) => (
            <div key={index}
              className={`${backgroundColor.current} p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between space-x-0 space-y-5 sm:space-x-5 sm:space-y-0 items-center align-middle w-full`}
            >
              <div className="grid-rows-2 self-start sm:self-auto">
                <p className="text-lg font-semibold text-gray-700">{guest.name}</p>
                <p className="text-sm text-gray-700">Added By: {props.userNames[guest.addedBy] || (() => {
                  props.fetchUserName(guest.addedBy).then();
                  return 'Loading...';
                })()}</p>
              </div>
              <div
                className={`${props.userStatus !== "Admin" && guest.addedBy !== props.userID && guest.checkedIn != -1 ? "basis-[25%]" : "basis-[40%] xl:basis-[50%]"} flex flex-row items-center align-middle justify-end space-x-5`}
              >
                {props.isWaitList ?
                  (props.userStatus === "Admin" || props.userStatus === "Social") && (
                    <button
                      onClick={() => props.handleApproveGuest!(props.gender, index)}
                      className="sm:mt-0 bg-purple-500 text-white rounded-md font-semibold hover:bg-purple-600"
                    >
                      Approve
                    </button>
                  ) :
                  (guest.checkedIn !== -1 || (props.userStatus === "Admin" && props.frontDoorMode)) && (
                    <button
                      onClick={guest.checkedIn === -1 ? () => props.handleCheckInGuest!(props.gender, index) : () => confirm(`Uncheck in ${guest.name}?`) ? props.handleUncheckInGuest!(props.gender, index) : undefined}
                      className={`${guest.checkedIn !== -1 ? "text-sm": ""} self-stretch flex-grow sm:mt-0 rounded-md font-semibold ${checkInIdleColor.current} text-white hover:${checkInHoverColor.current}`}
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
                {(props.userID === guest.addedBy || props.userStatus === "Admin") && (
                  <button
                    onClick={() => props.handleDeleteGuest(props.gender, index, props.isWaitList ? 'waitList' : 'guestList')}
                    className="sm:mt-0 bg-red-500 text-white rounded-md font-semibold hover:bg-red-600"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center">No {props.gender} guests {props.isWaitList ? "on the waitlist" : "added"} yet.</p>
        )}
      </div>
    </div>
  );
}

export default GuestList;