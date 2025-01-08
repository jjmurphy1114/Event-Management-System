import admin from "firebase-admin";
import {onValueDeleted} from "firebase-functions/database";
import * as serviceAccount from "./zm-parties-service-account-key.json";

if(admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        databaseURL: "https://zm-parties-2-default-rtdb.firebaseio.com/"
    });
}

export const onUserDelete = onValueDeleted({
    ref: "/users/{uid}"
}, (event) => {
    return admin.auth().deleteUser(event.params.uid);
})

