import admin from "firebase-admin";
import {onValueDeleted} from "firebase-functions/database";

if(admin.apps.length === 0) {
    admin.initializeApp();
}

export const onUserDelete = onValueDeleted({
    ref: "/users/{uid}"
}, (event) => {
    return admin.auth().deleteUser(event.params.uid);
})

