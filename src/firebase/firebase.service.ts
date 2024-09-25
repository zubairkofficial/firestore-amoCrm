import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';



@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private firestore: FirebaseFirestore.Firestore;

  constructor() {
    // Check if the default Firebase app already exists
    if (!admin.apps.length) {
      const serviceAccount: ServiceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      this.logger.log('Firebase app initialized');
    } else {
      this.logger.log('Firebase app already initialized');
    }

    // Get the Firestore instance
    this.firestore = admin.firestore();
  }

  // Method to access Firestore
  getFirestore(): FirebaseFirestore.Firestore {
    return this.firestore;
  }

  // Method to access Firebase Authentication
  getAuth(): admin.auth.Auth {
    return admin.auth();
  }

  // Method to access Firebase Storage (if needed)
  getStorage(): admin.storage.Storage {
    return admin.storage();
  }

  listenToBookingsCollection(callback: (data: any) => void): void {
    let isInitialLoad = true; // Flag to track the initial snapshot

    this.firestore.collection('bookings').onSnapshot((snapshot) => {
      if (isInitialLoad) {
        // This is the first snapshot; skip it
        isInitialLoad = false;
        return;
      }

      // Process changes in real-time after the initial snapshot
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const newCreateData = JSON.stringify(change.doc.data());
          this.logger.log(`New booking: ${newCreateData}`);
          await this.createOrUpdateLeadInAmoCRM(newCreateData);
          callback(change.doc.data()); // Only process new documents
        }

        if (change.type === 'modified') {
          const newCreateData = JSON.stringify(change.doc.data());
          this.logger.log(`Modified booking: ${newCreateData}`);
          await this.createOrUpdateLeadInAmoCRM(newCreateData);
          callback(change.doc.data()); // Process modified documents
        }

        if (change.type === 'removed') {
          this.logger.log(
            `Removed booking: ${JSON.stringify(change.doc.data())}`,
          );
          callback(change.doc.data()); // Process removed documents
        }
      });
    });
  }

  private async createOrUpdateLeadInAmoCRM(data: any) {
    const leadData = {
      name: ['Test Lead'], // Lead name (required)
      status_id: [123456], // Ensure this is a valid status ID in your CRM
      price: [1000],
      data: [{ ...data }],
    };

    try {
      // Assuming you have already handled the access token acquisition
      const apiToken =
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjY0MTdmMDhiNjk4NTdiNmUwY2MyZGFjYTY4NTZlMTBiOWVkN2Q4M2IyOGJhZmZkYjRlYzEzZjA4NWNhNjBmNDFhMTYyYTE3MGU0ZWYxYTNhIn0.eyJhdWQiOiJlMmUwMDNiMC0wNTM4LTQ5OTItODI0Ny02MGYyNDBhZmJlYjMiLCJqdGkiOiI2NDE3ZjA4YjY5ODU3YjZlMGNjMmRhY2E2ODU2ZTEwYjllZDdkODNiMjhiYWZmZGI0ZWMxM2YwODVjYTYwZjQxYTE2MmExNzBlNGVmMWEzYSIsImlhdCI6MTcyNzI3MDQ2OSwibmJmIjoxNzI3MjcwNDY5LCJleHAiOjE3MzA1MDU2MDAsInN1YiI6IjEwNzgwMDkwIiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjMxNTg3NzU4LCJiYXNlX2RvbWFpbiI6ImFtb2NybS5ydSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiOWRlOTJlNmMtYWE1OS00Y2FkLThlZjYtNjQ2NDM3YzY5Y2E3IiwiYXBpX2RvbWFpbiI6ImFwaS1iLmFtb2NybS5ydSJ9.Qc0-MGqA940CdNRf0EdqtK_TJWi5Oyy53diLgLtUFg-qIUB04Gwc98I4JQ_a1rxzuGRXxfsWEe32p6qnkRCnFvEkaNo2bVkMEgvk4C2mJJAW_HyxGp8MwrTo_qVZ7WAgUV-K5ni5lgP0fiQU6yIaPEQWfpyG5LAJoN6ZtwUyHqa46fzcuO3S0GCsNQjIJ85cQNscTdi2Sq5MrtShI5f4oIwG_-UeuhF5g-DH_c6jZsR_50amKY6E7S8t6740daBKcsL-Udjj7V9ynNgDvHNaY2laVpdaJNBeWd5AwqwfB9PDw77mG_GEEhlcu64xtlAkLYfJRjFOc2YtD1ziaA98sA';
      const axiosInstance = axios.create({
        baseURL: 'https://mycarrsa.amocrm.ru/api/v4/',
        headers: {
          Authorization: `Bearer ${apiToken}`, // Use Bearer token for authorization
          'Content-Type': 'application/json', // Set content type to JSON
        },
      });

      // Make POST request to create or update the lead
      const response = await axiosInstance.post('/leads', leadData);
      console.log('response', response);
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code not in the 2xx range
        console.log('Data:', error.response.data); // Detailed error response from the server
        console.log('Status:', error.response.status);
        console.log('Headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.log('Request:', error.request);
      } else {
        // Something happened in setting up the request
        console.log('Error:', error.message);
      }
    }
  }

 
}
