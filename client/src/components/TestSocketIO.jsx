import { useEffect, useState } from 'react';
import socketService from '../services/socket.service';

/**
 * Simple test component to verify Socket.IO is working
 */
export default function TestSocketIO() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    console.log('[TestSocketIO] Mounting component');
    
    // Connect to socket
    const socket = socketService.connect();
    
    socket.on('connect', () => {
      console.log('[TestSocketIO] Connected!');
      setConnected(true);
      addMessage('✅ Connected to Socket.IO server');
    });

    socket.on('disconnect', () => {
      console.log('[TestSocketIO] Disconnected');
      setConnected(false);
      addMessage('❌ Disconnected from server');
    });

    socket.on('error', (error) => {
      console.error('[TestSocketIO] Error:', error);
      addMessage(`❌ Error: ${error.message}`);
    });

    // Test event
    socket.on('test-event', (data) => {
      console.log('[TestSocketIO] Received test event:', data);
      addMessage(`📨 Received: ${JSON.stringify(data)}`);
    });

    return () => {
      console.log('[TestSocketIO] Unmounting component');
      socketService.disconnect();
    };
  }, []);

  const addMessage = (msg) => {
    setMessages(prev => [...prev, { text: msg, time: new Date().toLocaleTimeString() }]);
  };

  const sendTestEvent = () => {
    socketService.emit('test-event', { message: 'Hello from client!' });
    addMessage('📤 Sent test event');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Socket.IO Test</h2>
        
        {/* Connection Status */}
        <div className="mb-6">
          <div className={`inline-flex items-center px-4 py-2 rounded-full ${
            connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <span className="mr-2">{connected ? '🟢' : '🔴'}</span>
            <span className="font-semibold">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Test Button */}
        <button
          onClick={sendTestEvent}
          disabled={!connected}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed mb-6"
        >
          Send Test Event
        </button>

        {/* Messages */}
        <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
          <h3 className="font-semibold mb-2">Messages:</h3>
          {messages.length === 0 ? (
            <p className="text-gray-500 text-sm">No messages yet...</p>
          ) : (
            <div className="space-y-2">
              {messages.map((msg, idx) => (
                <div key={idx} className="text-sm">
                  <span className="text-gray-500">[{msg.time}]</span>{' '}
                  <span>{msg.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
