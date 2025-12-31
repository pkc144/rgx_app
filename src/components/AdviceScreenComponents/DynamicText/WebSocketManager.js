import { io } from "socket.io-client";
import axios from "axios";
import useLTPStore from "./useLtpStore";
import server from "../../../utils/serverConfig";
import {getAuth} from '@react-native-firebase/auth';

const WebSocketManager = (() => {
  let instance = null;
  let subscribers = new Map();
  let socket = null;
  let latestLTPs = new Map();
  let subscribedSymbols = new Set();
  let configData = null; // Store globally
  let userEmail = null; // Store globally

  const baseWsUrl = server.websocket.baseUrl;

  return {
    // NEW: Initialize method to be called once at app startup
    initialize(config, email) {
      configData = config;
      userEmail = email;
    },

    getInstance() {
      if (!instance) {
        instance = {
          connect() {
            return new Promise((resolve) => {
              if (socket && socket.connected) return resolve();

              socket = io(`${baseWsUrl}ltp`, {
                path: "/socket.io",
                transports: ["websocket"],
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                timeout: 20000
              });

              socket.on("connect", () => {
                socket.emit("subscribe_me", {
                  userEmail: userEmail || "31395cse@gmail.com",
                  dbName: configData?.config?.REACT_APP_HEADER_NAME || "prod"
                });

                // Wait a short time after subscribe_me to ensure server processes it
                // before resolving the promise and allowing subscriptions
                setTimeout(() => {
                  resolve();
                }, 200);
              });

              socket.on("connect_error", (e) => {
                // Connection error - silent
              });

              socket.on("ltp_update", (data) => {
                if (!data || !data.symbol || !data.ltp) return;

                const { symbol, ltp } = data;

                useLTPStore.getState().setLTP(symbol, ltp);
                latestLTPs.set(symbol, ltp);

                const callbacks = subscribers.get(symbol) || [];
                callbacks.forEach((cb) => cb({ symbol, ltp }));
              });

              socket.on("disconnect", () => {
                // WebSocket disconnected - silent
              });
            });
          },

          async subscribeToAllSymbols(symbols) {
            if (!symbols || symbols.length === 0) return;

            try {
              await this.connect();

              const cleanSymbols = symbols
                .map((item) => ({
                  symbol: item.symbol || item.Symbol || item.orginal_symbol,
                  exchange: item.exchange || item.Exchange,
                }))
                .filter((x) => x.symbol && x.exchange);

              if (cleanSymbols.length === 0) return;

              const response = await axios.post(`${baseWsUrl}subscribe-array`, {
                userEmail: userEmail,
                symbolExchange: cleanSymbols,
                dbName: configData?.config?.REACT_APP_HEADER_NAME || "prod",
              });

              cleanSymbols.forEach(({ symbol }) => {
                subscribedSymbols.add(symbol);
                if (!subscribers.has(symbol)) {
                  subscribers.set(symbol, []);
                }
              });
            } catch (error) {
              // Subscription error - silent
            }
          },

          subscribe(symbol, exchange, callback) {
            if (!symbol || !exchange || typeof callback !== "function") return;

            if (!subscribers.has(symbol)) {
              subscribers.set(symbol, []);
            }

            const list = subscribers.get(symbol);
            if (!list.includes(callback)) list.push(callback);

            const zustandLTP = useLTPStore.getState().getLTP(symbol);
            if (zustandLTP !== undefined) {
              callback({ symbol, ltp: zustandLTP });
            } else if (latestLTPs.has(symbol)) {
              callback({ symbol, ltp: latestLTPs.get(symbol) });
            }

            if (!subscribedSymbols.has(symbol)) {
              this.subscribeToAllSymbols([{ symbol, exchange }]);
            }
          },

          getLTP(symbol) {
            return new Promise((resolve, reject) => {
              const zs = useLTPStore.getState().getLTP(symbol);
              if (zs !== undefined) return resolve(zs);

              if (latestLTPs.has(symbol)) return resolve(latestLTPs.get(symbol));

              reject("LTP not available");
            });
          },

          disconnect() {
            if (socket) socket.disconnect();
            subscribers.clear();
            subscribedSymbols.clear();
            latestLTPs.clear();
            socket = null;
          },
        };
      }

      return instance;
    },
  };
})();

export default WebSocketManager;