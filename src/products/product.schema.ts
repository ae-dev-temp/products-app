import { Schema, Document } from 'mongoose';
const { nanoid } = require('fix-esm').require('nanoid');

interface Variant {
    id: string;
    sku: string;
    description: string;
    packaging: string;
    price: number;
    cost: number;
}

interface OptionValues {
    id: string;
    name: string;
    value: string;
}

interface Options {
    id: string;
    name: string;
    dataField: string | null;
    values: OptionValues[];
}

interface Images {
    fileName: string;
    cdnLink: string;
    i: number;
    alt: string | null;
}

interface ProductData {
    name: string;
    type: string;
    description: string;
    shortDescription: string;
    vendorId: string;
    manufacturerId: string;
    storefrontPriceVisibility: string;
    variants: Variant[];
    options: Options[];
    availability: string;
    isFragile: boolean;
    published: string;
    isTaxable: boolean;
    images: Images[];
    categoryId: string;
}

interface ProductInfo {
    createdBy: string;
    createdAt: Date;
    updatedBy: string;
    updatedAt: Date;
    deletedBy: string | null;
    deletedAt: Date | null;
    dataSource: string;
    companyStatus: string;
    transactionId: string;
    skipEvent: boolean;
    userRequestId: string;
}

export interface Product extends Document {
    docId: string;
    productId: string;
    fullData: string | null;
    data: ProductData;
    immutable: boolean;
    deploymentId: string;
    docType: string;
    namespace: string;
    companyId: string;
    status: string;
    info: ProductInfo;
}

export const ProductSchema = new Schema<Product>({
    docId: { type: String, unique: true, default: () => nanoid() },
    productId: { type: String, unique: true, required: true },
    fullData: { type: String, default: null },
    data: {
        name: { type: String, required: true },
        type: { type: String, required: true },
        description: { type: String, required: true },
        shortDescription: { type: String, required: true },
        vendorId: { type: String, required: true },
        manufacturerId: { type: String, required: true },
        storefrontPriceVisibility: { type: String, required: true },
        variants: [
            {
                id: { type: String, default: () => nanoid() },
                sku: { type: String, required: true },
                description: String,
                packaging: String,
                price: Number,
                cost: Number,
            },
        ],
        options: [
            {
                id: { type: String, required: true },
                name: { type: String, required: true },
                dataField: { type: String, default: null },
                values: [
                    {
                        id: { type: String, required: true },
                        name: { type: String, required: true },
                        value: { type: String, required: true },
                    },
                ],
            },
        ],
        availability: { type: String, required: true },
        isFragile: { type: Boolean, required: true },
        published: { type: String, required: true },
        isTaxable: { type: Boolean, required: true },
        images: [
            {
                fileName: { type: String, required: true },
                cdnLink: { type: String, required: true },
                i: { type: Number, default: 0 },
                alt: { type: String, default: null },
            },
        ],
        categoryId: { type: String, default: () => nanoid() },
    },
    immutable: { type: Boolean, required: true },
    deploymentId: { type: String, required: true },
    docType: { type: String, required: true },
    namespace: { type: String, required: true },
    companyId: { type: String, required: true },
    status: { type: String, required: true },
    info: {
        createdBy: { type: String, required: true },
        createdAt: { type: Date, required: true },
        updatedBy: { type: String, required: true },
        updatedAt: { type: Date, required: true },
        deletedBy: { type: String, default: null },
        deletedAt: { type: Date, default: null },
        dataSource: { type: String, default: 'nao' },
        companyStatus: { type: String, default: 'active' },
        transactionId: { type: String, default: () => nanoid() },
        skipEvent: { type: Boolean, default: false },
        userRequestId: { type: String, required: true },
    },
});
