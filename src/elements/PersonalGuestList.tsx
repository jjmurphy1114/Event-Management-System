import Guest from "../types/Guest.ts";
import {useRef} from "react";

interface PersonalGuestListProps {
  guestList: Record<string, Guest>;
  editingMode: boolean;
  handleDeletePersonalGuest?: (id: string) => Promise<void>;
  handleAddPersonalGuestToList?: (id: string) => Promise<void>;
}

const PersonalGuestList = (props: PersonalGuestListProps) => {
  const backgroundColor = useRef<string>("bg-blue-100");
  
  if(props.editingMode && !props.handleDeletePersonalGuest) {
    console.error(`When in editing mode, the personal guest list must define the handleDeletePersonalGuest prop!`);
    return <></>;
  }
  
  if(!props.editingMode && !props.handleAddPersonalGuestToList) {
    console.error(`When not in editing mode, the personal guest list must define the handleAddPersonalGuest prop!`);
    return <></>;
  }
  
  return (
    <div className={`p-4 rounded-lg col-span-1 lg:col-span-1`}>
      <div className="mb-8 space-y-4 justify-center min-h-[20rem]">
        {Object.keys(props.guestList).length > 0 ? (
          
          Object.entries<Guest>(props.guestList).map(([guestID, guestData]) => (
            <div key={guestID}
                 className={`${backgroundColor.current} p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between space-x-0 space-y-5 sm:space-x-5 sm:space-y-0 items-center align-middle w-full`}
            >
              <div className="grid-rows-2 self-start sm:self-auto">
                <p className="text-lg font-semibold text-gray-700">{guestData.name}</p>
              </div>
              <div
                className={`basis-[25%] flex flex-row items-center align-middle justify-end space-x-5`}
              >
                {!props.editingMode &&
                  <button
                    onClick={() => props.handleAddPersonalGuestToList!(guestID)}
                    className="sm:mt-0 bg-purple-500 text-white rounded-md font-semibold hover:bg-purple-600"
                  >
                    Add to list
                  </button>
                }
                {props.editingMode && (
                  <button
                    onClick={() => props.handleDeletePersonalGuest!(guestID)}
                    className="sm:mt-0 bg-red-500 text-white rounded-md font-semibold hover:bg-red-600"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p
            className="text-gray-500 text-center">No guests added yet.</p>
        )}
      </div>
    </div>
  );
};

export default PersonalGuestList;