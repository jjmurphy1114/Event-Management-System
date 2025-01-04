// Event.ts
import Guest, {guestSchema} from "./Guest"
import {z} from 'zod';

export type EventType = {
    id: string,
    name: string,
    date: string,
    type: string,
    maxMales: number,
    maxFemales: number,
    maxGuests: number,
    open: boolean,
    maleGuestList?: Guest[],
    femaleGuestList?: Guest[],
    maleWaitList?: Guest[],
    femaleWaitList?: Guest[]
}

export enum GuestList {
    MaleGuestList = "maleGuestList",
    FemaleGuestList = "femaleGuestList",
    MaleWaitList = "maleWaitList",
    FemaleWaitList = "femaleWaitList",
}

const eventSchema = z.object({
    id: z.string(),
    name: z.string(),
    date: z.string(),
    type: z.string(),
    maxMales: z.number(),
    maxFemales: z.number(),
    maxGuests: z.number(),
    open: z.boolean(),
    maleGuestList: z.array(guestSchema).optional(),
    femaleGuestList: z.array(guestSchema).optional(),
    maleWaitList: z.array(guestSchema).optional(),
    femaleWaitList: z.array(guestSchema).optional(),
})

export default class Event implements EventType{
    id: string = '';
    name: string = '';
    date: string = '';
    type: string = '';
    maxMales: number = 0;
    maxFemales: number = 0;
    maxGuests: number = 0;
    maleGuestList: Guest[] = [];
    femaleGuestList: Guest[] = [];
    maleWaitList: Guest[] = [];
    femaleWaitList: Guest[] = [];
    open: boolean = true;

    constructor(
        params?: EventType
    ) {
        if(params) {
            this.id = params.id;
            this.name = params.name;
            this.date = params.date;
            this.type = params.type;
            this.maxMales = params.maxMales;
            this.maxFemales = params.maxFemales;
            this.maxGuests = params.maxGuests;
            this.open = params.open;
            this.maleGuestList = params.maleGuestList ?? [];
            this.femaleGuestList = params.femaleGuestList ?? [];
            this.maleWaitList = params.maleWaitList ?? [];
            this.femaleWaitList = params.femaleWaitList ?? [];
        }
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

    toJSON(): EventType {
        return {
            id: this.id,
            name: this.name,
            date: this.date,
            type: this.type,
            maxMales: this.maxMales,
            maxFemales: this.maxFemales,
            maxGuests: this.maxGuests,
            maleGuestList: this.maleGuestList,
            femaleGuestList: this.femaleGuestList,
            maleWaitList: this.maleWaitList,
            femaleWaitList: this.femaleWaitList,
            open: this.open,
        };
    }

    getListFromName(listName: string): Guest[]  {
        switch(listName) {
            case "maleGuestList":
                return this.maleGuestList;
            case "femaleGuestList":
                return this.femaleGuestList;
            case "maleWaitList":
                return this.maleWaitList;
            case "femaleWaitList":
                return this.femaleWaitList;
            default:
                return [];
        }
    }
  }

  export function validateAndReturnEvent(data: unknown): EventType | undefined {
    const parsedData = eventSchema.safeParse(data);

    if(parsedData.success) {
        return {
            id: parsedData.data.id,
            name: parsedData.data.name,
            date: parsedData.data.date,
            type: parsedData.data.type,
            maxMales: parsedData.data.maxMales,
            maxFemales: parsedData.data.maxFemales,
            maxGuests: parsedData.data.maxGuests,
            open: parsedData.data.open,
            maleGuestList: parsedData.data.maleGuestList ?? [],
            femaleGuestList: parsedData.data.femaleGuestList ?? [],
            maleWaitList: parsedData.data.maleWaitList ?? [],
            femaleWaitList: parsedData.data.femaleWaitList ?? []
        };
    } else {
        console.error('Event data is unrecognized! Returned data is missing required fields.', parsedData.error);
        console.error(`Passed in data: ${JSON.stringify(data)}`);
        return undefined;
    }
  }

  export const emptyEvent = new Event();
  