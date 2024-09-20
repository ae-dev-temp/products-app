import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ManufacturerDocument = HydratedDocument<Manufacturer>;

@Schema()
export class Manufacturer {
    @Prop({ unique: true }) mId: string;
    @Prop() name: string;
    @Prop() email: string;
    @Prop() phone: string;
    @Prop() address: string;
}

export const ManufacturerSchema = SchemaFactory.createForClass(Manufacturer);
