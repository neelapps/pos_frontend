import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
      const newSocket = io(socketUrl);
      setSocket(newSocket);

      // Join room based on user role
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        if (user.role === 'Kitchen') {
          newSocket.emit('join_room', 'kitchen');
        } else if (user.role === 'Admin' || user.role === 'Manager') {
          newSocket.emit('join_room', 'kitchen'); // also listen to kitchen updates
        }
      });

      return () => newSocket.disconnect();
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
