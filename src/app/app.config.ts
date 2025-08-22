import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

import { routes } from './app.routes';


const firebaseConfig = {
  apiKey: "AIzaSyDHmgqraQnB0PrnaaDwjj6HuBjTEm-AAug",
  authDomain: "contabilidad-artemediooriente.firebaseapp.com",
  projectId: "contabilidad-artemediooriente",
  storageBucket: "contabilidad-artemediooriente.firebasestorage.app",
  messagingSenderId: "860681294783",
  appId: "1:860681294783:web:760b5f46f5f42503afc70a",
  measurementId: "G-52FS0GVN6X"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withHashLocation()),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore())
  ]
};
