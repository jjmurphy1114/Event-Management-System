export default class User {
    name: string;
    email: string;
    approved: boolean;
    status: string
    privileges: boolean

    constructor(
        name: string,
        email: string,
        approved: boolean,
        status: string,
        privileges: boolean
    ) {
        this.name = name;
        this.email = email;
        this.approved = approved;
        this.status = status;
        this.privileges = privileges;
    }
}