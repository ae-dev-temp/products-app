import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './product.schema';
import { Vendor, VendorSchema } from './vendor.schema';
import { Manufacturer, ManufacturerSchema } from './manufacturer.schema';
import { ConfigService } from '@nestjs/config';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'Product', schema: ProductSchema },
            { name: 'Vendor', schema: VendorSchema },
            { name: 'Manufacturer', schema: ManufacturerSchema },
        ]),
    ],
    controllers: [ProductsController],
    providers: [ProductsService, ConfigService],
})
export class ProductsModule {}
