import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { FirebaseService } from 'src/firebase/firebase.service';

@Module({
  controllers: [BookingsController],
  providers: [BookingsService, FirebaseService],
})
export class BookingsModule {}
