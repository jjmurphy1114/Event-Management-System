/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import express from "express";
import cors from "cors";
import { onUserDelete } from "./userDeleteFunction";


const app = express();
app.use(cors());

exports.onUserDelete = onUserDelete;
