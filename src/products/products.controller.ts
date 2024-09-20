import { Controller, HttpCode, Post } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
    constructor(private productsService: ProductsService) {}

    @Post('/import')
    @HttpCode(201)
    async importProductsSimulation() {
        this.productsService.importProductsData();
        return { message: 'Process started successfully' };
    }
}
