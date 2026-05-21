import React, { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  FaTrash,
  FaLock,
  FaUsers,
  FaPlusCircle,
  FaTruck,
  FaUserCircle,
  FaRegCreditCard,
  FaComments,
} from "react-icons/fa";
import ChatBox from "./ChatBox";

const MyOrders = ({
  orders,
  handleLock,
  handleDelete,
  currentUser,
  onAddItemsClick,
  onRefreshData,
}) => {
  const [activeChatOrderId, setActiveChatOrderId] = useState(null);

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-gray-100 p-4 rounded-xl text-center">
        <p className="text-gray-600">
          You haven't initiated or joined any orders yet.
        </p>
      </div>
    );
  }
  const toggleChat = (orderId) => {
    setActiveChatOrderId((prevId) => (prevId === orderId ? null : orderId));
  };

  // 🔹 Split into Initiated vs Joined
  const initiatedOrders = orders.filter(
    (order) => order.initiatedBy?.email === currentUser?.email
  );
  const joinedOrders = orders.filter(
    (order) => order.initiatedBy?.email !== currentUser?.email
  );

  // 🔹 Reusable render function
  const renderOrders = (ordersList, isInitiator) =>
    ordersList.map((order) => {
      const locked = order.status === "Locked";

      return (
        <div
          key={order._id}
          className="border p-4 rounded-xl shadow-md bg-white"
        >
          {/* --- HEADER --- */}
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div>
              <p className="font-bold text-lg">{order.platform}</p>
              <p className="text-sm text-gray-500">
                Initiated by: {isInitiator ? "You" : `${order.initiatedBy?.name} (${order.initiatedBy?.roomNumber})`}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {locked ? (
                  <span className="text-blue-700 font-semibold flex items-center gap-2">
                    <FaTruck /> Order Placed
                  </span>
                ) : (
                  <span className="text-green-600 font-semibold"> Open</span>
                )}
              </p>

              {/* --- UPI DETAILS (if order is locked and I'm a participant) --- */}
              {locked && !isInitiator && order.upiId && (
                <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded-lg">
                  <p className="text-sm text-gray-800 flex items-center gap-2">
                    <FaRegCreditCard className="text-green-700" />
                    Pay initiator at:{" "}
                    <strong className="font-mono bg-white px-1 rounded">
                      {order.upiId}
                    </strong>
                  </p>
                </div>
              )}
            </div>

            <div className="text-right text-sm text-gray-500">
              {locked && order.lockedAt ? (
                <span className="font-medium">
                  Placed on <br />
                  {format(new Date(order.lockedAt), "dd MMM, h:mm a")}
                </span>
              ) : (
                formatDistanceToNow(new Date(order.createdAt)) + " ago"
              )}
            </div>
          </div>

          {/* --- JOINED ITEMS --- */}
        
          {order.items?.length > 0 && (!locked || (locked && !isInitiator)) && (
            <div className="mt-3 pt-3 border-t">
              <strong className="text-gray-700">
                Submitted Carts ({order.items.length}):
              </strong>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
                {order.items.map((item, idx) => {
                  const isMyItem = item.user?.email === currentUser?.email;
                  
                  return (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="font-medium">
                        {isMyItem ? "Me" : (item.user?.name || "Someone")}:
                      </span>
                      <a
                        href={item.cartLink} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 transition"
                      >
                         View Cart
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
                 
          {/* --- PARTICIPANT TIMELINE --- */}
          {isInitiator && locked && order.items.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-semibold text-gray-800 mb-3">
                Order Participants
              </h4>
              <div className="relative border-l-2 border-blue-200 pl-6 space-y-6">
                {order.items.map((item, index) => {
                   const isMyItem = item.user?.email === currentUser?.email;

                   return (
                    <div key={index} className="relative">
                      <div className="absolute -left-[33px] top-1 h-4 w-4 bg-white border-2 border-blue-500 rounded-full"></div>
                      <div className="font-bold flex items-center gap-2 text-gray-700">
                        <FaUserCircle />
                        {isMyItem ? "Me" : (item.user?.name || "A User")}
                        <div className="font-medium">({item.user?.roomNumber})</div>
                      </div>

                      <div className="pl-6 text-sm text-gray-600 mt-1">
                          <a
                            href={item.cartLink} // Updated to use cartLink
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                          >
                            🔗 Open Shared Cart
                          </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* --- ACTION BUTTONS --- */}
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            {isInitiator && !locked && (
              <button
                onClick={() => handleLock(order._id)}
                className="bg-blue-500 hover:bg-blue-600 text-black px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FaLock /> Lock & Place Order
              </button>
            )}
            {isInitiator && (
              <button
                onClick={() => handleDelete(order._id)}
                className="bg-red-500 hover:bg-red-600 text-black px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FaTrash /> Delete
              </button>
            )}
            {isInitiator && !locked && (
              <button
                onClick={() => onAddItemsClick(order)}
                className="bg-green-500 hover:bg-green-600 text-black font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FaPlusCircle /> Add Items
              </button>
            )}

            <button
              onClick={() => toggleChat(order._id)}
              className="bg-gray-500 hover:bg-gray-600 text-black font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FaComments />{" "}
              {activeChatOrderId === order._id ? "Close Chat" : "Open Chat"}
            </button>
          </div>

          {/* --- CHAT BOX --- */}
          {activeChatOrderId === order._id && (
            <ChatBox
              orderId={order._id}
              currentUser={currentUser}
              onNewMessage={onRefreshData}
            />
          )}
        </div>
      );
    });

  return (
    <div className="space-y-8">
      {/* Orders I Initiated */}
      {initiatedOrders.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <FaUsers className="text-2xl text-blue-600" />
            <h2 className="text-xl font-semibold">Orders I Initiated</h2>
          </div>
          <div className="space-y-4">{renderOrders(initiatedOrders, true)}</div>
        </div>
      )}

      {/* Orders I Joined */}
      {joinedOrders.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <FaUsers className="text-2xl text-teal-600" />
            <h2 className="text-xl font-semibold">Orders I Joined</h2>
          </div>
          <div className="space-y-4">{renderOrders(joinedOrders, false)}</div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
