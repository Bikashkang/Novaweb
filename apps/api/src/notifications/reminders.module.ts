import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RemindersService } from './reminders.service';
import { NotificationsModule } from './notifications.module';

@Module({
  imports: [ScheduleModule.forRoot(), forwardRef(() => NotificationsModule)],
  providers: [RemindersService],
  exports: [RemindersService],
})
export class RemindersModule {}
