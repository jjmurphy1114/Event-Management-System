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
    jobsURL: string,
    maleGuestList?: Record<string, Guest>,
    femaleGuestList?: Record<string, Guest>,
    maleWaitList?: Record<string, Guest>,
    femaleWaitList?: Record<string, Guest>
}

export enum GuestListTypes {
    MaleGuestList = "maleGuestList",
    FemaleGuestList = "femaleGuestList",
    MaleWaitList = "maleWaitList",
    FemaleWaitList = "femaleWaitList",
    MalePersonalGuestList = "malePersonalGuestList",
    FemalePersonalGuestList = "femalePersonalGuestList"
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
    jobsURL: z.string().optional(),
    maleGuestList: z.record(guestSchema).optional(),
    femaleGuestList: z.record(guestSchema).optional(),
    maleWaitList: z.record(guestSchema).optional(),
    femaleWaitList: z.record(guestSchema).optional(),
})

export default class Event implements EventType{
    id: string = '';
    name: string = '';
    date: string = '';
    type: string = '';
    maxMales: number = 0;
    maxFemales: number = 0;
    maxGuests: number = 0;
    maleGuestList: Record<string, Guest> = {};
    femaleGuestList: Record<string, Guest> = {};
    maleWaitList: Record<string, Guest> = {};
    femaleWaitList: Record<string, Guest> = {};
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
            this.maxMales = params.maxMales;
            this.maxFemales = params.maxFemales;
            this.maxGuests = params.maxGuests;
            this.open = params.open;
            this.jobsURL = params.jobsURL;
            this.maleGuestList = params.maleGuestList ?? {};
            this.femaleGuestList = params.femaleGuestList ?? {};
            this.maleWaitList = params.maleWaitList ?? {};
            this.femaleWaitList = params.femaleWaitList ?? {};
        }
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
            maxMales: parsedData.data.maxMales,
            maxFemales: parsedData.data.maxFemales,
            maxGuests: parsedData.data.maxGuests,
            open: parsedData.data.open,
            jobsURL: parsedData.data.jobsURL ?? '',
            maleGuestList: parsedData.data.maleGuestList ?? {},
            femaleGuestList: parsedData.data.femaleGuestList ?? {},
            maleWaitList: parsedData.data.maleWaitList ?? {},
            femaleWaitList: parsedData.data.femaleWaitList ?? {}
        };
    } else {
        console.error('Event data is unrecognized! Returned data is missing required fields.', parsedData.error);
        console.error(`Passed in data: ${JSON.stringify(data)}`);
        return undefined;
    }
}

export function getGuestListTypeFromGenderAndType(gender: 'male' | 'female', type: 'general' | 'waitlist' | 'personal') {
    if(gender === 'male') {
        if(type === 'general') return GuestListTypes.MaleGuestList;
        else if (type === 'waitlist') return GuestListTypes.MaleWaitList;
        else return GuestListTypes.MalePersonalGuestList;
    } else {
        if(type === 'general') return GuestListTypes.FemaleGuestList;
        else if (type === 'waitlist') return GuestListTypes.FemaleWaitList;
        else return GuestListTypes.FemalePersonalGuestList;
    }
}

export function getGenderAndTypeFromGuestList(guestList: GuestListTypes): {gender: 'male' | 'female' | '', type: 'guest list' | 'waitlist' | 'personal guest list' | ''} {
    switch(guestList) {
        case GuestListTypes.MaleGuestList: return {gender: "male", type: "guest list"};
        case GuestListTypes.FemaleGuestList: return {gender: "female", type: "guest list"};
        case GuestListTypes.MaleWaitList: return {gender: "male", type: "waitlist"};
        case GuestListTypes.FemaleWaitList: return {gender: "female", type: "waitlist"};
        case GuestListTypes.MalePersonalGuestList: return {gender: "male", type: "personal guest list"};
        case GuestListTypes.FemalePersonalGuestList: return {gender: "female", type: "personal guest list"};
        default: return {gender: "", type: ""};
    }
}

export const emptyEvent = new Event();
