import Order from '../models/Order.js';
import User from '../models/User.js';
import fetch from 'node-fetch';

export const addMessageToOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const userId = req.user._id || req.user.id;
    const userDoc = await User.findById(userId);
    if (!userDoc) return res.status(404).json({ message: 'User not found' });

    const newMessage = {
      user: userDoc._id,
      name: userDoc.name,
      text: text.trim(),
    };

    order.chat.push(newMessage);
    await order.save();

    const populated = await Order.findById(orderId).populate('chat.user', 'name');
    const last = populated.chat[populated.chat.length - 1];

    res.status(201).json(last);
  } catch (error) {
    console.error('addMessageToOrder error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

export const createOrder = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ msg: 'User not found' });

    const { platform, upiId, optionalMessage } = req.body;

    const newOrder = new Order({
      initiatedBy: user._id,
      hostel: user.hostel,
      platform,
      upiId,
      optionalMessage,
      qrImage: req.file ? req.file.filename : null,
      items: []
    });

    await newOrder.save();

    console.log(`[WebHook] Attempting to alert microservice for hostel: ${newOrder.hostel}`);
    
    fetch('https://notification-backend-1q5k.onrender.com/api/notifications/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostelName: newOrder.hostel,
        initiatorId: newOrder.initiatedBy
      })
    })
    .then(async (res) => {
       console.log(`[WebHook] Microservice responded with Status: ${res.status}`);
       if (!res.ok) {
           const text = await res.text();
           console.log(`[WebHook] Microservice error details:`, text);
       }
    })
    .catch(err => console.error('[WebHook] Network trigger critically failed:', err.message));

    res.status(201).json(newOrder);
  } catch (err) {
    console.error('Create Order Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const getOrdersByHostel = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const orders = await Order.find({ hostel: user.hostel, status: 'Open' })
      .populate('initiatedBy', 'name email roomNumber')
      .populate('items.user', 'name email roomNumber')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error('Get Orders Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const joinOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { cartLink } = req.body; 
    const userId = req.user._id || req.user.id;
    if (!cartLink) {
        return res.status(400).json({ msg: 'Cart link is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ msg: 'Order not found' });
    if (order.status === 'Locked') return res.status(403).json({ msg: 'Order is locked' });

    order.items.push({ user: userId, cartLink });
    
    if (!order.joinedUsers.includes(userId)) {
      order.joinedUsers.push(userId);
    }

    await order.save();

    const populatedOrder = await Order.findById(orderId)
      .populate('items.user', 'name email roomNumber')
      .populate('initiatedBy', 'name email roomNumber');

    res.json(populatedOrder);
  } catch (err) {
    console.error('Join Order Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
  
export const lockOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id || req.user.id;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ msg: 'Order not found' });

    if (order.initiatedBy.toString() !== String(userId)) {
      return res.status(403).json({ msg: 'Only the initiator can lock the order' });
    }

    order.status = 'Locked';
    order.lockedAt = new Date();
    await order.save();
    res.json(order);
  } catch (err) {
    console.error('Lock Order Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ $or: [{ initiatedBy: userId }, { 'items.user': userId }] })
      .populate('initiatedBy', 'name email roomNumber')
      .populate('items.user', 'name email roomNumber')
      .populate('chat.user', 'name')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Get User Orders Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('initiatedBy', 'name email roomNumber')
      .populate('items.user', 'name email roomNumber')
      .populate('chat.user', 'name');
    if (!order) return res.status(404).json({ msg: 'Order not found' });
    res.json(order);
  } catch (err) {
    console.error('Get Order By ID Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user._id || req.user.id;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ msg: 'Order not found' });

    const isInitiator = order.initiatedBy.toString() === String(userId);
    const isParticipant = order.items.some(item => item.user.toString() === String(userId));

    if (!isInitiator && !isParticipant) {
      return res.status(403).json({ msg: 'Not authorized to delete this order' });
    }

    if (isInitiator) {
      await Order.findByIdAndDelete(orderId);
      return res.status(200).json({ msg: 'Order deleted for all users in same hostel' });
    }

    order.items = order.items.filter(item => item.user.toString() !== String(userId));
    await order.save();
    return res.status(200).json({ msg: 'You have left the order' });
  } catch (error) {
    console.error('Delete Order Error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};
