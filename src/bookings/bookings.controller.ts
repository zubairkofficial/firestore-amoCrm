import { Controller, Post, Get, Body, Param, Sse } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Observable, Subject } from 'rxjs';

@Controller('bookings')
export class BookingsController {
  private bookingUpdates$: Subject<any> = new Subject();

  constructor(private readonly bookingsService: BookingsService) {
    this.bookingsService.listenForBookingUpdates((data) => {
      this.bookingUpdates$.next(data); // Send data to the stream
    });
  }

  @Sse('listen')
  listenToBookingUpdates(): Observable<any> {
    return this.bookingUpdates$.asObservable(); // Send the data to the client in real-time
  }

  @Post()
  async createBooking(@Body() bookingData: any) {
    return this.bookingsService.createBooking(bookingData);
  }

  @Post('info')
  async bookingInfo(@Body() bookingData: any) {
    return this.bookingsService.bookingInfo(bookingData);
  }

  @Post('user')
  async createUser(@Body() userData: any) {
    return this.bookingsService.createUser(userData);
  }

  @Get(':id')
  async getBooking(@Param('id') id: string) {
    return this.bookingsService.getBooking(id);
  }
}
