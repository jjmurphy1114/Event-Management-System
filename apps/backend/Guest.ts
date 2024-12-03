// Guest.ts
export default class Guest {
    name: string;
    addedBy: string;
    checkedIn: number;
  
    constructor(name: string, addedBy: string) {
      this.name = name;
      this.addedBy = addedBy;
      this.checkedIn = -1;
    }
  }
  