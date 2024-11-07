// Guest.ts
export default class Guest {
    name: string;
    addedBy: string;
    checkedIn: boolean;
  
    constructor(name: string, addedBy: string) {
      this.name = name;
      this.addedBy = addedBy;
      this.checkedIn = false;
    }
  }
  