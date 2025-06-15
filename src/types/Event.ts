// Event.ts
import Guest, {guestSchema} from "./Guest"
import {z} from 'zod';

export type EventType = {
    id: string,
    name: string,
    date: string,
    type: string,
    maxGuests: number,
    open: boolean,
    jobsURL: string,
    guestList?: Record<string, Guest>,
    waitList?: Record<string, Guest>,
}

export enum GuestListTypes {
    GuestList = "guestList",
    WaitList = "waitList",
    PersonalGuestList = "personalGuestList",
}

const eventSchema = z.object({
    id: z.string(),
    name: z.string(),
    date: z.string(),
    type: z.string(),
    maxGuests: z.number(),
    open: z.boolean(),
    jobsURL: z.string().optional(),
    guestList: z.record(guestSchema).optional(),
    waitList: z.record(guestSchema).optional(),
})

export default class Event implements EventType{
    id: string = '';
    name: string = '';
    date: string = '';
    type: string = '';
    maxGuests: number = 0;
    guestList: Record<string, Guest> = {};
    waitList: Record<string, Guest> = {};
    open: boolean = true;
    jobsURL: string = '';

    constructor(
        params?: EventType
    ) {
        if(params) {
            this.id = params.id;
            this.name = params.name;
            this.date = params.date;
            this.type = params.type;
            this.maxGuests = params.maxGuests;
            this.open = params.open;
            this.jobsURL = params.jobsURL;
            this.guestList = params.guestList ?? {};
            this.waitList = params.waitList ?? {};
        }
    }

    toJSON(): EventType {
        return {
            id: this.id,
            name: this.name,
            date: this.date,
            type: this.type,
            maxGuests: this.maxGuests,
            guestList: this.guestList,
            waitList: this.waitList,
            open: this.open,
            jobsURL: this.jobsURL,
        };
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
            maxGuests: parsedData.data.maxGuests,
            open: parsedData.data.open,
            jobsURL: parsedData.data.jobsURL ?? '',
            guestList: parsedData.data.guestList ?? {},
            waitList: parsedData.data.waitList ?? {},
        };
    } else {
        console.error('Event data is unrecognized! Returned data is missing required fields.', parsedData.error);
        console.error(`Passed in data: ${JSON.stringify(data)}`);
        return undefined;
    }
}

export function getGuestListType(type: 'general' | 'waitlist' | 'personal') {
    if(type === 'general') return GuestListTypes.GuestList;
    else if (type === 'waitlist') return GuestListTypes.WaitList;
    else return GuestListTypes.PersonalGuestList;
}

export function getTypeFromGuestList(guestList: GuestListTypes): string {
    switch(guestList) {
        case GuestListTypes.GuestList: return "guest list";
        case GuestListTypes.WaitList: return "waitlist";
        case GuestListTypes.PersonalGuestList: return "personal guest list";
        default: return "";
    }
}

export const emptyEvent = new Event();
