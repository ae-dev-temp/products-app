import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ProductsModule } from './products/products.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: '.env',
        }),
        ScheduleModule.forRoot(),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: () => ({
                uri:
                    process.env.MONGO_URI ||
                    'mongodb://localhost:27017/inventory-db',
            }),
            inject: [ConfigService],
        }),
        ProductsModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
