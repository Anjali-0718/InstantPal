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
    
    const io = req.app.get('io');
    if (io) {
      io.emit('new_order_added');
    }

    fetch('https://notification-backend-1q5k.onrender.com/api/notifications/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostelName: newOrder.hostel,
        initiatorId: newOrder.initiatedBy
      })
    }).catch(() => {});

    res.status(201).json(newOrder);
  } catch (err) {
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

    const joiner = await User.findById(userId);

    order.items.push({ user: userId, cartLink });
    
    if (!order.joinedUsers.includes(userId)) {
      order.joinedUsers.push(userId);
    }

    await order.save();

    if (String(order.initiatedBy) !== String(userId)) { 
      fetch('https://notification-backend-1q5k.onrender.com/api/notifications/notify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: order.initiatedBy,
          title: "New Order Member! 🛒",
          body: `${joiner.name} just added items to your group order.`
        })
      }).catch(() => {});
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('order_status_changed'); 
    }
    
    const populatedOrder = await Order.findById(orderId)
      .populate('items.user', 'name email roomNumber')
      .populate('initiatedBy', 'name email roomNumber');

    res.json(populatedOrder);
  } catch (err) {
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
    
    const io = req.app.get('io');
    if (io) {
      io.emit('order_status_changed');
    }
    res.json(order);
  } catch (err) {
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

    const io = req.app.get('io');

    if (isInitiator) {
      await Order.findByIdAndDelete(orderId);
      if (io) io.emit('order_status_changed'); 
      return res.status(200).json({ msg: 'Order deleted for all users in same hostel' });
    }

    order.items = order.items.filter(item => item.user.toString() !== String(userId));
    await order.save();
    
    if (io) io.emit('order_status_changed'); 
    
    return res.status(200).json({ msg: 'You have left the order' });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};
