export default class User {
    displayName: string;
    email: string;
    approved: boolean;
    status: string
    privileges: boolean

    constructor(
        displayName: string,
        email: string,
        approved: boolean,
        status: string,
        privileges: boolean
    ) {
        this.displayName = displayName;
        this.email = email;
        this.approved = approved;
        this.status = status;
        this.privileges = privileges;
    }
}