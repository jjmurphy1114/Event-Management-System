import {z} from "zod";
import Guest, {guestSchema} from "./Guest.ts";

export type UserType = {
    id: string;
    displayName: string;
    email: string;
    approved: boolean;
    status: string;
    privileges: boolean;
    malePersonalGuestList: Record<string, Guest>;
    femalePersonalGuestList: Record<string, Guest>;
}

const userSchema = z.object({
    id: z.string(),
    displayName: z.string(),
    email: z.string(),
    approved: z.boolean(),
    status: z.string(),
    privileges: z.boolean(),
    malePersonalGuestList: z.record(guestSchema).optional(),
    femalePersonalGuestList: z.record(guestSchema).optional(),
})

export default class User {
    id: string;
    displayName: string;
    email: string;
    approved: boolean;
    status: string
    privileges: boolean
    malePersonalGuestList: Record<string, Guest>;
    femalePersonalGuestList: Record<string, Guest>;

    constructor(
        params: UserType,
    ) {
        this.id = params.id;
        this.displayName = params.displayName;
        this.email = params.email;
        this.approved = params.approved;
        this.status = params.status;
        this.privileges = params.privileges;
        this.malePersonalGuestList = params.malePersonalGuestList;
        this.femalePersonalGuestList = params.femalePersonalGuestList;
    }

    get params(): UserType {
        return {
            id: this.id,
            displayName: this.displayName,
            email: this.email,
            approved: this.approved,
            status: this.status,
            privileges: this.privileges,
            malePersonalGuestList: this.malePersonalGuestList,
            femalePersonalGuestList: this.femalePersonalGuestList,
        };
    }
}

export function validateAndReturnUser(data: unknown): UserType | undefined {
    const parsedData = userSchema.safeParse(data);

    if(parsedData.success) {
        return {
            id: parsedData.data.id,
            displayName: parsedData.data.displayName,
            email: parsedData.data.email,
            approved: parsedData.data.approved,
            status: parsedData.data.status,
            privileges: parsedData.data.privileges,
            malePersonalGuestList: parsedData.data.malePersonalGuestList ?? {},
            femalePersonalGuestList: parsedData.data.femalePersonalGuestList ?? {},
        }
    } else {
        console.error('User data is unrecognized! Returned data is missing required fields.', parsedData.error);
        console.error(`Passed in data: ${JSON.stringify(data)}`);
        return undefined;
    }
}

export const defaultUserType: UserType = {
    id: '',
    displayName: '',
    email: '',
    approved: false,
    status: 'Default',
    privileges: false,
    malePersonalGuestList: {},
    femalePersonalGuestList: {},
};