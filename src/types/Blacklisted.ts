import z from "zod";

export default class Blacklisted {
    name: string;
    addedBy: string; // Will be a user's display name

    constructor(name: string, addedBy: string) {
        this.name = name;
        this.addedBy = addedBy;
    }
}

export const blacklistedSchema = z.object({
    name: z.string(),
    addedBy: z.string(),
});

export function validateAndReturnBlacklisted(data: unknown): Blacklisted | undefined {
  const parsedData = blacklistedSchema.safeParse(data);
  
  if(parsedData.success) {
        return {
          name: parsedData.data.name,
          addedBy: parsedData.data.addedBy,
        };
    } else {
        console.error("Blacklisted person's data is unrecognized! Returned data is missing required fields.", parsedData.error);
        console.error(`Passed in data: ${JSON.stringify(data)}`);
        return undefined;
    }
}