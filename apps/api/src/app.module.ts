import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RemindersModule } from './notifications/reminders.module';

@Module({
  imports: [PaymentsModule, NotificationsModule, RemindersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
