import mongoose, { Schema, Document } from 'mongoose';

interface IPost extends Document {
  userId: string;
  title: string;
  description: string;
  mediaPath: string;
  mediaType: 'image' | 'video' | 'audio';
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  mediaPath: { type: String, required: false },
  mediaType: { type: String, enum: ['image', 'video', 'audio'], required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);
