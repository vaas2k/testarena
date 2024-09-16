import { io } from 'socket.io-client';
import { useMemo } from 'react';


const useSocket = () => {
    const socket = useMemo(
        () =>
          io('http://localhost:8000', {
            withCredentials: true,
          }),
        []
      );
    return socket;    
}




export default useSocket;