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

export function validateAndReturnGuest(data: unknown): Guest | undefined {
  const parsedData = guestSchema.safeParse(data);
  
  if(parsedData.success) {
        return {
          name: parsedData.data.name,
          addedBy: parsedData.data.addedBy,
          checkedIn: parsedData.data.checkedIn,
        };
    } else {
        console.error('Guest data is unrecognized! Returned data is missing required fields.', parsedData.error);
        console.error(`Passed in data: ${JSON.stringify(data)}`);
        return undefined;
    }
}
  