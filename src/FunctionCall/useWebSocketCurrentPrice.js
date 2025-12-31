import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import io from "socket.io-client";
import axios from "axios";

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 5000; // 5 seconds

// Utility functions
const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

const throttle = (func, limit) => {
  let lastFunc;
  let lastRan;
  return (...args) => {
    const context = this;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
};

const useWebSocketCurrentPrice = (symbols) => {
  const ccxtUrl = 'https://ccxt.alphaquark.in';
  const [ltp, setLtp] = useState([]);
  const socketRef = useRef(null);
  const subscribedSymbolsRef = useRef(new Set());
  const failedSubscriptionsRef = useRef({});

  const memoizedSymbols = useMemo(() => [...new Set(symbols)], [symbols]);

  const updateLtp = useCallback((data) => {
    setLtp((prev) => {
      // console.log("prev",prev)
      const index = prev.findIndex(
        (item) => item.tradingSymbol === data.stockSymbol
      );
      if (index !== -1) {
        const newLtp = [...prev];
        if (newLtp[index].lastPrice !== data.last_traded_price) {
          newLtp[index] = {
            ...newLtp[index],
            lastPrice: data.last_traded_price,
          };
        }
        return newLtp;
      } else {
        return [
          ...prev,
          {
            tradingSymbol: data.stockSymbol,
            lastPrice: data.last_traded_price,
          },
        ];
      }
    });
  }, []);

  useEffect(() => {
    socketRef.current = io("wss://ccxt.alphaquark.in", {
      transports: ["websocket"],
      query: { EIO: "4" },
    });

    socketRef.current.on("market_data", updateLtp);

    const pingInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("ping");
      }
    }, 20000);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      clearInterval(pingInterval);
    };
  }, [updateLtp]);

  const subscribeToSymbol = useCallback(async (symbol) => {
    if (subscribedSymbolsRef.current.has(symbol.tradingSymbol)) return;

    try {
      await axios.post(`${ccxtUrl}/websocket/subscribe`, {
        symbol: symbol.tradingSymbol,
        exchange: symbol.exchange,
      });
      subscribedSymbolsRef.current.add(symbol.tradingSymbol);
      delete failedSubscriptionsRef.current[symbol.tradingSymbol];
    } catch (error) {
      failedSubscriptionsRef.current[symbol.tradingSymbol] =
        (failedSubscriptionsRef.current[symbol.tradingSymbol] || 0) + 1;

      if (
        failedSubscriptionsRef.current[symbol.tradingSymbol] <
        MAX_RETRY_ATTEMPTS
      ) {
        setTimeout(() => subscribeToSymbol(symbol), RETRY_DELAY);
      }
    }
  }, []);

  const subscribeToNewSymbols = useCallback(
    debounce(() => {
      if (!memoizedSymbols || memoizedSymbols.length === 0) return;

      const newSymbols = memoizedSymbols
        .map((item) => {
          const symbol = item.symbol || item.Symbol;
          const isNSE = symbol?.includes("-EQ") || symbol?.includes("-BE");
          return {
            exchange: isNSE ? "NSE" : "BSE",
            tradingSymbol: symbol,
          };
        })
        .filter(
          (symbol) =>
            !subscribedSymbolsRef.current.has(symbol.tradingSymbol) &&
            (!failedSubscriptionsRef.current[symbol.tradingSymbol] ||
              failedSubscriptionsRef.current[symbol.tradingSymbol] <
                MAX_RETRY_ATTEMPTS)
        );

      newSymbols.forEach(subscribeToSymbol);
    }, 300),
    [memoizedSymbols, subscribeToSymbol]
  );

  useEffect(() => {
    subscribeToNewSymbols();
  }, [subscribeToNewSymbols]);

  const getLTPForSymbol = useCallback(
    (symbol) => {
      const ltpOne = ltp.find(
        (item) => item.tradingSymbol === symbol
      )?.lastPrice;
      return ltpOne ? ltpOne.toFixed(2) : "-";
    },
    [ltp]
  );

  return {
    ltp,
    getLTPForSymbol,
  };
};

export default useWebSocketCurrentPrice;

