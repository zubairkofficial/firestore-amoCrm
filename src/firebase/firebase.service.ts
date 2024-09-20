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
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImMwODQyYTExNjM3ZDI1ZGVkY2M2ZjI2MGJmZmU4NWYzNDNkNDFjNjE4M2UzMDk3Y2U0MDdjODk2Y2ZhMWFjMzJhOGZlMzY2MzZhYTNmOGI2In0.eyJhdWQiOiJlMmUwMDNiMC0wNTM4LTQ5OTItODI0Ny02MGYyNDBhZmJlYjMiLCJqdGkiOiJjMDg0MmExMTYzN2QyNWRlZGNjNmYyNjBiZmZlODVmMzQzZDQxYzYxODNlMzA5N2NlNDA3Yzg5NmNmYTFhYzMyYThmZTM2NjM2YWEzZjhiNiIsImlhdCI6MTcyNjgyNDE0MywibmJmIjoxNzI2ODI0MTQzLCJleHAiOjE3MjcyMjI0MDAsInN1YiI6IjEwNzgwMDkwIiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjMxNTg3NzU4LCJiYXNlX2RvbWFpbiI6ImFtb2NybS5ydSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiNTI4NDc4ODItZTJhMy00N2QwLWI4YjktYWU5MDk4MGIzZDc0IiwiYXBpX2RvbWFpbiI6ImFwaS1iLmFtb2NybS5ydSJ9.GABv2pbXCvLGC69LYcLfKiMC7VRfJAimtPz-gRHY9df0pDGxpxSAJBZRHfL6ZyuzeNe89jpEO9zHhIwt8QngBEU8Zxddvo4yHMvNSIGBgeJZ5hljQNarRMARhZgDff8RV069yJtqj4Kbce_wEvTlZTfjPHTRQ2lx6yFPbMvTeMeJ9XxiXsOKLIqZNlM1vLnwr3CwDYDSfqlif8XkKt_bQCPdeBBKZPsz8fnJwl4iRn71mFHBozMZFdKmxQGtvlLWsVX4DnFH74X_7_aqpVN8IQLzdXTVpCgMWWOI61PQQqwuYzkmmQ-gFTTgN6zODCdj0LIJgz_0y62OafJsd1OTJQ';
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
