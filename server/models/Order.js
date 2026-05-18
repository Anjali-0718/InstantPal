import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String, 
      required: true,
    },
    text: {
      type: String, 
      required: true,
    },
  },
  { timestamps: true }
);

const itemSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User',required: true },
  cartLink: { type: String, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hostel: {
      type: String,
      required: true,
    },
    platform: {
      type: String,
      required: true,
    },
    upiId: {
      type: String,
    },
    optionalMessage: {
      type: String,
    },
    qrImage: {
      type: String,
    },
    items: [itemSchema],

    status: {
      type: String,
      enum: ['Open', 'Locked'],
      default: 'Open',
    },
    lockedAt: { type: Date },

 
    chat: [messageSchema],

    joinedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);