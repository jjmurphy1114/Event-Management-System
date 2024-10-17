// Event.ts
export default class SocialEvent {
    name: string;
    date: string;
    type: string;
    maxMales: number;
    maxFemales: number;
    maleGuestList: string[] = [];
    femaleGuestList: string[] = [];
    maleWaitList: string[] = [];
    femaleWaitList: string[] = [];
  
    constructor(
      name: string,
      date: string,
      type: string,
      maxMaleGuestsPerPerson: number,
      maxFemaleGuestsPerPerson: number,
    ) {
      this.name = name;
      this.date = date;
      this.type = type;
      this.maxMales = maxMaleGuestsPerPerson;
      this.maxFemales = maxFemaleGuestsPerPerson;
    }
  
    addMaleGuest(guestName: string): void {
        this.maleGuestList.push(guestName);
    }
  
    addFemaleGuest(guestName: string): void {
        this.femaleGuestList.push(guestName);
    }

    addMaleWaitList(guestName: string): void {
        this.maleGuestList.push(guestName);
    }

    addFemaleWaitList(guestName: string): void {
        this.femaleGuestList.push(guestName);
    }
  }
  