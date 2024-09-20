import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VendorDocument = HydratedDocument<Vendor>;

@Schema()
export class Vendor {
    @Prop({ unique: true }) vId: string;
    @Prop() name: string;
    @Prop() email: string;
    @Prop() phone: string;
    @Prop() address: string;
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);
