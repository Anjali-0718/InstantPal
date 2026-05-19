import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { api } from '../utils/api';

const ChatBox = ({ orderId, currentUser, onNewMessage }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const socketUrl = api.defaults.baseURL.replace('/api', '');
    const socket = io(socketUrl, { credentials: true });
    socketRef.current = socket;

    const fetchChatHistory = async () => {
      try {
        const res = await api.get(`/orders/${orderId}`, config);
        setMessages(res.data.chat || []);
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      }
    };

    fetchChatHistory();

    socket.emit('join_order_room', orderId);

    const handleReceive = (incomingMessage) => {
      setMessages((prev) => [...prev, incomingMessage]);
      if (onNewMessage) onNewMessage();
    };

    socket.on('receive_message', handleReceive);

    return () => {
      socket.emit('leave_order_room', orderId);
      socket.off('receive_message', handleReceive);
      socket.disconnect();
    };
  }, [orderId]);

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed) return;

    if (socketRef.current) {
      socketRef.current.emit('send_message', {
        orderId,
        userId: currentUser?._id || currentUser?.id,
        text: trimmed,
      });
      
      setNewMessage('');
    }
  };

  return (
    <div className="mt-4 border-t pt-4 w-full max-w-full">
      <h4 className="font-semibold text-gray-800 mb-2">Group Chat</h4>

      <div className="h-64 overflow-y-auto bg-gray-50 p-3 rounded-lg border flex flex-col gap-3">
        {messages.map((msg, index) => {
          const senderId = msg?.user?._id || msg?.user;
          const isMe = String(senderId) === String(currentUser?._id || currentUser?.id);
          const senderName = msg?.name || msg?.user?.name || 'User';

          return (
            <div
              key={msg._id || index}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} w-full`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-xl ${
                  isMe ? 'bg-pink-100 text-black' : 'bg-blue-100 text-gray-800'
                }`}
              >
                <p className="text-[10px] font-bold mb-0.5 opacity-60 uppercase tracking-wider">{senderName}</p>
                <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="mt-3 flex w-full gap-2 items-center">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 min-w-0 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
        />
        <button
          type="submit"
          className="bg-blue-500 text-black font-semibold text-sm px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 shrink-0"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatBox;