import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { createReadStream } from 'fs';
import * as Papa from 'papaparse';
import OpenAI from 'openai';
const { nanoid } = require('fix-esm').require('nanoid');

import { Model } from 'mongoose';
import { Product } from './product.schema';
import { Vendor } from './vendor.schema';
import { Manufacturer } from './manufacturer.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProductsService {
    private logger = new Logger(ProductsService.name);
    private openaiClient: OpenAI = null;
    private apiKey: string = '';
    constructor(
        @InjectModel('Product') private productModel: Model<Product>,
        @InjectModel('Vendor') private vendorModel: Model<Vendor>,
        @InjectModel('Manufacturer')
        private manufacturerModel: Model<Manufacturer>,
        private configService: ConfigService,
    ) {
        this.apiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (this.apiKey) {
            this.openaiClient = new OpenAI({
                apiKey: this.apiKey,
            });
        }
    }

    @Cron('0 09 * * *', { timeZone: 'UTC' })
    async handleCron() {
        this.logger.log(`Started importing products.`);
        await this.importProductsData();
    }

    async importProductsData() {
        const csvFileStream = createReadStream('./data/source.csv');

        Papa.parse(csvFileStream, {
            header: true,
            skipEmptyLines: true,
            delimiter: '\t',
            quoteChar: "'",
            escapeChar: '\\',
            chunkSize: 1024 * 1024,

            chunk: async (results, parser) => {
                parser.pause();

                const chunk = results.data;
                try {
                    await this.proccessData(chunk);
                } catch (error) {
                    this.logger.error('Process failed: ' + error.message);
                }

                parser.resume();
            },
            complete: () => {
                this.logger.debug(`Finished importing products.`);
            },
        });
    }

    private async proccessData(lines: any[]) {
        const products = {};
        const vendors = {};
        const manufacturers = {};

        for (const line of lines) {
            const productId = line['ProductID'];
            const vendorId = line['SiteSource'];
            const manufacturerId = line['ManufacturerID'];

            if (!products[productId]) {
                products[productId] = this.constructProductData(line);
            }

            if (vendorId && !vendors[vendorId]) {
                vendors[vendorId] = this.constructVendorData(line);
            }

            if (!manufacturers[manufacturerId]) {
                manufacturers[manufacturerId] =
                    this.constructManufacturerData(line);
            }

            this.groupVariants(line, products);
            this.groupImages(line, products);
            this.groupOptions(line, products);
        }

        await this.insertProducts(Object.values(products));
        await this.insertVendors(Object.values(vendors));
        await this.insertManufacturers(Object.values(manufacturers));
    }

    private constructProductData(line: any) {
        return {
            docId: nanoid(),
            productId: line['ProductID'],
            fullData: null,
            data: {
                type: 'non-inventory',
                description: line['Description'],
                shortDescription: '',
                vendorId: line['SiteSource'],
                manufacturerId: line['ManufacturerID'],
                storefrontPriceVisibility: '',
                variants: {},
                options: [],
                availability: line['Availability'],
                isFragile: false,
                published: 'published',
                isTaxable: true,
                images: {},
                categoryId: '',
            },
            status: 'active',
            immutable: false,
            deploymentId: 'd8039',
            docType: 'items',
            namespace: 'items',
            info: {
                skipEvent: false,
                userRequestId: 'a158357a-8276-402d-bd53-321b7bee1482',
            },
        };
    }

    private constructVendorData(line: any) {
        return {
            vId: line['SiteSource'],
            name: '',
            email: '',
            phone: '',
            address: '',
        };
    }

    private constructManufacturerData(line: any) {
        return {
            mId: line['ManufacturerID'],
            name: '',
            email: '',
            phone: '',
            address: '',
        };
    }

    private constructVariantData(line: any) {
        return {
            id: nanoid(),
            description: this.openaiClient
                ? this.generateDescription(
                      line['ProductName'],
                      line['ItemDescription'],
                  )
                : line['ItemDescription'],
            packaging: line['PKG'],
            price: Number(line['UnitPrice'] || 0),
            cost: Number(line['UnitPrice'] || 0),
            available: this.checkAvailability(line['QuantityOnHand']),
            sku: this.getItemSku(line),
        };
    }

    private constructImages(line: any) {
        return {
            fileName: line['ImageFileName'],
            alt: line['ItemDescription'],
            i: 0,
            cdnLink: line['ItemImageURL'],
        };
    }

    private constructOptionsData(line: any) {
        return [
            {
                id: nanoid(),
                name: 'packaging',
                dataField: null,
                values: [
                    {
                        id: nanoid(),
                        name: '',
                        value: line['PKG'],
                    },
                ],
            },
            {
                id: nanoid(),
                name: 'description',
                dataField: null,
                values: [
                    {
                        id: nanoid(),
                        name: '',
                        value: line['ItemDescription'],
                    },
                ],
            },
        ];
    }

    private getItemSku(line: any) {
        return `${line['ManufacturerItemCode']}-${line['ItemID']}`;
    }

    private checkAvailability(value: any) {
        return !!Number(value || 0);
    }

    private groupVariants(line: any, products: any) {
        const sku = this.getItemSku(line);
        const variant = this.constructVariantData(line);
        const productId = line['ProductID'];

        if (!products[productId].data.variants[sku]) {
            products[productId].data.variants[sku] = variant;
        } else {
            const existingVariant = products[productId].data.variants[sku];

            if (
                existingVariant.available !== variant.available ||
                existingVariant.price !== variant.price ||
                existingVariant.packaging !== variant.packaging ||
                existingVariant.description !== variant.description
            ) {
                products[productId].data.variants[sku] = variant;
            }
        }
    }

    private groupImages(line: any, products: any) {
        const image = this.constructImages(line);
        const imageFilename = line['ImageFileName'];
        const productId = line['ProductID'];

        if (!products[productId].data.images[imageFilename]) {
            products[productId].data.images[imageFilename] = image;
        } else {
            const existingImage =
                products[productId].data.images[imageFilename];

            if (
                existingImage.cdnLink !== image.cdnLink ||
                existingImage.alt !== image.alt
            ) {
                products[productId].data.images[imageFilename] =
                    this.constructImages(line);
            }
        }
    }

    private groupOptions(line: any, products: any) {
        const options = this.constructOptionsData(line);
        const productId = line['ProductID'];

        if (!products[productId].data.options.length) {
            products[productId].data.options = options;
        }
    }

    private async insertProducts(products: any[]) {
        const bulkOperations = [];

        for (let product of products) {
            product.data.variants = Object.values(product.data.variants);
            product.data.images = Object.values(product.data.images);
            const { docId } = product;
            delete product.docId;

            bulkOperations.push({
                updateOne: {
                    filter: { productId: product.productId },
                    update: {
                        $set: product,
                        $setOnInsert: {
                            docId,
                        },
                    },
                    upsert: true,
                },
            });
        }

        await this.productModel.bulkWrite(bulkOperations);
    }

    private async insertVendors(vendors: any[]) {
        const bulkOperations = [];

        for (let vendor of vendors) {
            bulkOperations.push({
                updateOne: {
                    filter: { vId: vendor.vId },
                    update: { $set: vendor },
                    upsert: true,
                },
            });
        }

        await this.vendorModel.bulkWrite(bulkOperations);
    }

    private async insertManufacturers(manufacturers: any[]) {
        const bulkOperations = [];

        for (let manufacturer of manufacturers) {
            bulkOperations.push({
                updateOne: {
                    filter: { mId: manufacturer.mId },
                    update: { $set: manufacturer },
                    upsert: true,
                },
            });
        }

        await this.manufacturerModel.bulkWrite(bulkOperations);
    }

    private getPrompt(name: string, description: string) {
        return `
            You are an expert in medical sales. Your specialty is medical consumables used by hospitals on a daily basis. Your task to enhance the description of a product based on the information provided.

            Product name: ${name}
            Product description: ${description}

            New Description:
        `;
    }

    async generateDescription(
        name: string,
        description: string,
    ): Promise<string> {
        const prompt = this.getPrompt(name, description);

        const response = await this.openaiClient.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            model: 'gpt-3.5-turbo',
        });

        return response.choices[0].message.content.trim();
    }
}
