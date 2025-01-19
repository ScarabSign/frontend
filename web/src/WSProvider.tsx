import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

interface WSContextType {
	sendMessage: (channel: string, message: string) => void;
	subscribe: (channel: string, callback: (message: string) => void) => void;
	unsubscribe: (channel: string) => void;
	isConnected: boolean;
}

const WSContext = createContext<WSContextType | null>(null);

interface WSProviderProps {
	children: React.ReactNode;
}

export const WSProvider: React.FC<WSProviderProps> = ({ children }) => {
	const [isConnected, setIsConnected] = useState(false);
	const ws = useRef<WebSocket | null>(null);
	const callbacks = useRef<Map<string, Set<(message: string) => void>>>(new Map());
	const pendingSubscriptions = useRef<Set<string>>(new Set());

	useEffect(() => {
		const connect = () => {
			ws.current = new WebSocket(import.meta.env.VITE_WS_URL);

			ws.current.onopen = () => {
				setIsConnected(true);
				console.log('WebSocket connected');
				// Resubscribe to all pending channels
				pendingSubscriptions.current.forEach(channel => {
					ws.current?.send(JSON.stringify({ type: 'subscribe', channel }));
				});
			};

			ws.current.onclose = () => {
				setIsConnected(false);
				console.log('WebSocket disconnected');
				setTimeout(connect, 5000);
			};

			ws.current.onmessage = (event) => {
				const { type, channel, message } = JSON.parse(event.data);
				if (type === 'message') {
					const channelCallbacks = callbacks.current.get(channel);
					channelCallbacks?.forEach(callback => callback(message));
				}
			};
		};

		connect();
		return () => {
			if (ws.current) {
				ws.current.onclose = null; // Prevent reconnection attempt on unmount
				ws.current.close();
			}
		};
	}, []);

	const sendMessage = (channel: string, message: string) => {
		if (!isConnected) {
			console.warn('WebSocket not connected, message not sent');
			return;
		}
		ws.current?.send(JSON.stringify({ type: 'message', channel, message }));
	};
	const subscribe = (channel: string, callback: (message: string) => void) => {
		if (!callbacks.current.has(channel)) {
			callbacks.current.set(channel, new Set());
			if (isConnected && ws.current) {
				// Send subscribe event
				ws.current.send(JSON.stringify({ 
					type: 'subscribe', 
					channel,
					message: '' // Added to match server expectation
				}));
			}
		}
		callbacks.current.get(channel)?.add(callback);
	};

	const unsubscribe = (channel: string) => {
		if (callbacks.current.has(channel)) {
			callbacks.current.delete(channel);
			if (isConnected && ws.current) {
				// Send unsubscribe event
				ws.current.send(JSON.stringify({ 
					type: 'unsubscribe', 
					channel,
					message: '' // Added to match server expectation
				}));
			}
		}
	};

	return (
		<WSContext.Provider value={{ sendMessage, subscribe, unsubscribe, isConnected }}>
			{children}
		</WSContext.Provider>
	);
};

export const useWS = () => {
	const context = useContext(WSContext);
	if (!context) {
		throw new Error('useWS must be used within a WSProvider');
	}
	return context;
};
