// Event.ts
import Guest from "./Guest"

export default class Event {
    name: string;
    date: string;
    type: string;
    maxMales: number;
    maxFemales: number;
    maxGuests: number;
    maleGuestList: Guest[] = [];
    femaleGuestList: Guest[] = [];
    maleWaitList: Guest[] = [];
    femaleWaitList: Guest[] = [];
    open: boolean = false;
  
    constructor(
      name: string,
      date: string,
      type: string,
      maxMales: number,
      maxFemales: number,
      maxGuests: number,
      open: boolean,
      maleGuestList: Guest[],
      femaleGuestList: Guest[],
      maleWaitList: Guest[],
      femaleWaitList: Guest[] 
    ) {
      this.name = name;
      this.date = date;
      this.type = type;
      this.maxMales = maxMales;
      this.maxFemales = maxFemales;
      this.maxGuests = maxGuests;
      this.open = open;
      this.maleGuestList = maleGuestList ?? [];
      this.femaleGuestList = femaleGuestList ?? [];
      this.maleWaitList = maleWaitList ?? [];
      this.femaleWaitList = femaleWaitList ?? [];
    }
  
    addMaleGuest(guest: Guest): void {
        this.maleGuestList.push(guest);
    }
  
    addFemaleGuest(guest: Guest): void {
        this.femaleGuestList.push(guest);
    }

    addMaleWaitList(guest: Guest): void {
        this.maleGuestList.push(guest);
    }

    addFemaleWaitList(guest: Guest): void {
        this.femaleGuestList.push(guest);
    }
  }
  