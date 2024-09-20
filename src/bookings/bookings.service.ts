import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class BookingsService {
  constructor(private readonly firebaseService: FirebaseService) {}

  // Example method to create a booking in Firestore
  async createBooking(bookingData: any): Promise<any> {
    const firestore = this.firebaseService.getFirestore();
    const docRef = await firestore.collection('Bookings').add(bookingData);
    return { id: docRef.id };
  }

  async bookingInfo(bookingData: any): Promise<any> {
    return bookingData;
  }

  async createUser(userData: any): Promise<any> {
    const firestore = this.firebaseService.getFirestore();
    const docRef = await firestore.collection('Users').add(userData);
    return { id: docRef.id };
  }

  // Example method to retrieve a booking by ID
  async getBooking(bookingId: string): Promise<any> {
    const firestore = this.firebaseService.getFirestore();
    const doc = await firestore.collection('bookings').doc(bookingId).get();
    if (!doc.exists) {
      throw new Error('Booking not found');
    }
    return doc.data();
  }

  listenForBookingUpdates(callback: (data: any) => void) {
    this.firebaseService.listenToBookingsCollection(callback);
  }
}
