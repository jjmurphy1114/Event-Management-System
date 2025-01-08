import {z} from "zod";

// Guest.ts
export default class Guest {
    name: string;
    addedBy: string;
    checkedIn: number | string;
  
    constructor(name: string, addedBy: string) {
      this.name = name;
      this.addedBy = addedBy;
      this.checkedIn = -1;
    }
  }

  export const guestSchema = z.object({
      name: z.string(),
      addedBy: z.string(),
      checkedIn: z.number().or(z.string()),
  });
  