import { initializeApp, getApps, FirebaseApp } from "firebase/app";
// Use @firebase/auth so Metro resolves the React Native build (registers auth component correctly)
import {
	initializeAuth,
	getAuth,
	Auth,
	getReactNativePersistence,
} from "@firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { config } from "~/lib/config";

let app: FirebaseApp;
let auth: Auth;

if (getApps().length === 0) {
	app = initializeApp(config.firebaseConfig);
	auth = initializeAuth(app, {
		persistence: getReactNativePersistence(AsyncStorage),
	});
} else {
	app = getApps()[0] as FirebaseApp;
	auth = getAuth(app);
}

export { app, auth };
