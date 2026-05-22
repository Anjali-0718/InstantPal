import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { api } from '../utils/api';

const socket = io(api.defaults.baseURL);

const JoinOrderModal = ({ order, isOpen, onClose, onSubmit, currentUser }) => {
  const [cartLink, setcartLink] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (isOpen) {
      fetch('https://notification-backend-1q5k.onrender.com/api/health')
        .catch(() => {}); 
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if(!cartLink.trim()){
      setError('Please provide a valid cart link');
      return ;
    }
    setError('');

    onSubmit({ cartLink });
    setcartLink('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-yellow-50 bg-opacity-50 flex justify-center items-center z-50">
      {/* Modal Content */}
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2">Join Order</h2>
        <p className="mb-4">
          Add your item to the <span className="font-semibold">{order.platform}</span> order.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Cart link</label>
            <input
              type="url"
              value={cartLink}
              onChange={(e) => setcartLink(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              placeholder="Paste the cart link here"
            />
          </div>
        
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-yellow-400 text-black font-semibold px-4 py-2 rounded-md hover:bg-yellow-500"
            >
              Submit Cart
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinOrderModal;
