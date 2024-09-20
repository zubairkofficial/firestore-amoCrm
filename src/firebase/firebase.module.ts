import { Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

@Module({
  controllers: [],
  providers: [FirebaseService],
})
export class FirebaseModule {}
