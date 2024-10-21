export default class User {
    name: string;
    email: string;
    approved: boolean;
    status: string
    priviliges: boolean

    constructor(
        name: string,
        email: string,
        approved: boolean,
        status: string,
        priviliges: boolean
    ) {
        this.name = name;
        this.email = email;
        this.approved = approved;
        this.status = status;
        this.priviliges = priviliges;
    }
}