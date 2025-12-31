// TradeContext.js
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import axios from 'axios';
import CryptoJS from 'react-native-crypto-js';
import {getAuth} from '@react-native-firebase/auth';
import server from '../utils/serverConfig';
import {fetchFunds} from '../FunctionCall/fetchFunds';
import {fetchBrokerAllHoldings} from '../FunctionCall/fetchBrokerAllHoldings';
import {fetchBrokerSpecificHoldings} from '../FunctionCall/fetchBrokerSpecificHoldings';

import {getConfigData, isUserDataComplete} from '../utils/storageUtils';
import Config from 'react-native-config';
const TradeContext = createContext();
import {generateToken} from '../utils/SecurityTokenManager';
import {getAdvisorSubdomain} from '../utils/variantHelper';
export const useTrade = () => {
  return useContext(TradeContext);
};

const checkValidApiAnSecret = data => {
  const bytesKey = CryptoJS.AES.decrypt(data, 'ApiKeySecret');
  const Key = bytesKey.toString(CryptoJS.enc.Utf8);
  if (Key) {
    return Key;
  }
};

export const TradeProvider = ({children}) => {
  const [stockRecoNotExecutedfinal, setstockRecoNotExecutedfinal] = useState(
    [],
  );
  const [recommendationStockfinal, setrecommendationStockfinal] = useState([]);
  const [isDatafetching, setIsDatafetching] = useState(false);
  const [isDatafetchingvideos, setIsDatafetchingvideos] = useState(false);
  const [rejectedTrades, setrejectedTrades] = useState([]);
  const [ignoredTrades, setIgnoredTrades] = useState([]);
  const [isBrokerConnected, setIsBrokerConnected] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;
  const userEmail = user?.email;

  const [configData, setConfigData] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);

  // ENHANCED: Load stored data with retry mechanism and better logging
  const loadStoredData = useCallback(async (retryCount = 3) => {
    try {
      const dataCheck = await isUserDataComplete();
      if (!dataCheck.isComplete) {
        if (retryCount > 0) {
          setTimeout(() => loadStoredData(retryCount - 1), 1000);
          return;
        } else {
          setConfigData(null);
          setConfigLoading(false);
          return;
        }
      }
      const config = await getConfigData();
      if (config) {
        setConfigData(config);
        setConfigLoading(false);
        console.log('✅ [TradeContext] Config data loaded successfully');
      } else {
        // If no config and we have retries left, wait and try again
        if (retryCount > 0) {
          setTimeout(() => loadStoredData(retryCount - 1), 1000);
          return;
        } else {
          setConfigData(null);
          setConfigLoading(false);
        }
      }
    } catch (error) {
      // Retry on error if we have attempts left
      if (retryCount > 0) {
        setTimeout(() => loadStoredData(retryCount - 1), 1000);
        return;
      } else {
        setConfigData(null);
        setConfigLoading(false);
      }
    }
  }, []);

  // ENHANCED: Force reload config data (called from login/signup flows)
  const reloadConfigData = useCallback(async () => {
    setConfigLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    await loadStoredData(3); // Retry up to 3 times
  }, [loadStoredData]);

  useEffect(() => {
    loadStoredData();
  }, [loadStoredData]);

  const advisortag = configData?.config?.REACT_APP_ADVISOR_TAG;
  const advisorspecific = configData?.config?.REACT_APP_ADVISOR_SPECIFIC_TAG;
  const showAdviceStatusDays = Config.REACT_APP_ADVICE_SHOW_LATEST_DAYS;

  const [modelPortfolioStrategyfinal, setModelPortfolioStrategyfinal] =
    useState([]);
  const [isDatafetchinMP, setIsDatafetchingMP] = useState(false);

  const isValidSymbolExpiry = (symbol, exchange) => {
    // Only filter NFO and BFO exchanges
    if (exchange !== 'NFO' && exchange !== 'BFO') {
      return true; // Accept all other exchanges
    }

    if (!symbol) {
      return false;
    }

    // This handles symbols like AXISBANK30SEP251180CE, NIFTY16SEP2525250CE
    const expiryRegex =
      /(\d{1,2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{2})/i;

    const match = symbol.match(expiryRegex);
    if (!match) {
      return false;
    }

    try {
      const day = parseInt(match[1], 10);
      const monthStr = match[2].toUpperCase();
      const yearStr = match[3]; // Only the first 2 digits after month

      const monthMap = {
        JAN: 0,
        FEB: 1,
        MAR: 2,
        APR: 3,
        MAY: 4,
        JUN: 5,
        JUL: 6,
        AUG: 7,
        SEP: 8,
        OCT: 9,
        NOV: 10,
        DEC: 11,
      };

      const monthIndex = monthMap[monthStr];
      if (monthIndex === undefined) {
        return false;
      }

      // Convert 2-digit year to full year (25 -> 2025)
      const currentYear = new Date().getFullYear();
      const currentCentury = Math.floor(currentYear / 100) * 100;
      let year = currentCentury + parseInt(yearStr, 10);

      // Handle century rollover if needed
      if (year < currentYear - 10) {
        year += 100;
      }

      // Create expiry date - set to end of expiry day
      const expiryDate = new Date(year, monthIndex, day, 23, 59, 59, 999);

      // Get today's date (start of day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const isValid = expiryDate >= today;
      return isValid;
    } catch (error) {
      return false;
    }
  };

  // Updated helper function to filter out conflicting BUY/SELL orders for same symbol in basket
  const filterConflictingOrders = basketAdvice => {
    if (!basketAdvice || basketAdvice.length === 0) {
      return basketAdvice;
    }

    // Group basket advice by symbol
    const symbolGroups = basketAdvice.reduce((groups, advice) => {
      const symbol = advice.Symbol;
      if (!groups[symbol]) {
        groups[symbol] = {
          buy: [],
          sell: [],
          all: [],
        };
      }

      groups[symbol].all.push(advice);

      if (advice.Type === 'BUY') {
        groups[symbol].buy.push(advice);
      } else if (advice.Type === 'SELL') {
        groups[symbol].sell.push(advice);
      }

      return groups;
    }, {});

    // Filter out symbols that have both BUY and SELL orders AND BOTH have complete status
    const validAdvice = [];

    Object.entries(symbolGroups).forEach(([symbol, orders]) => {
      const hasBuy = orders.buy.length > 0;
      const hasSell = orders.sell.length > 0;

      // Check if ALL BUY orders have COMPLETE status
      const allBuyComplete =
        orders.buy.length > 0 &&
        orders.buy.every(
          order =>
            order.trade_place_status === 'complete' ||
            order.trade_place_status === 'COMPLETE',
        );

      // Check if ALL SELL orders have COMPLETE status
      const allSellComplete =
        orders.sell.length > 0 &&
        orders.sell.every(
          order =>
            order.trade_place_status === 'complete' ||
            order.trade_place_status === 'COMPLETE',
        );

      // NEW LOGIC: Remove only if has both BUY/SELL AND both types are complete
      if (hasBuy && hasSell && allBuyComplete && allSellComplete) {
        // Filter out - both BUY and SELL orders have complete status
        // Don't add to validAdvice
      } else {
        // Keep all orders for this symbol
        validAdvice.push(...orders.all);
      }
    });

    return validAdvice;
  };

  // Add this debug function in your TradeProvider
  const debugBasketProcessing = (basketAdvice, basketName) => {
    // Debug logging can be enabled/disabled here
  };

  /**
   * Net basket trades by symbol - consolidates multiple trades of same symbol
   * For regular baskets: Calculates net position (BUY - SELL)
   * For closure baskets: De-duplicates by symbol, uses toTradeQty
   * @param {Array} trades - Array of basket trades
   * @returns {Array} - Netted trades array
   */
  const netBasketTrades = (trades) => {
    if (!trades || trades.length === 0) return [];

    // Separate closure trades from regular trades
    const closureTrades = trades.filter(t => t.isClosure === true);
    const regularTrades = trades.filter(t => t.isClosure !== true);

    // Process closure trades - de-duplicate by symbol
    const closureBySymbol = {};
    closureTrades.forEach(trade => {
      const symbol = trade.Symbol;
      if (!closureBySymbol[symbol]) {
        closureBySymbol[symbol] = {
          ...trade,
          // Current holding is opposite of toTradeQty
          currentHolding: Math.abs(trade.toTradeQty || 0),
          // Type is determined by toTradeQty sign (negative = SELL)
          Type: (trade.toTradeQty || 0) < 0 ? 'SELL' : 'BUY',
          Quantity: Math.abs(trade.toTradeQty || trade.Quantity || 1),
        };
      }
    });

    // Process regular trades - net by symbol
    const regularBySymbol = {};
    regularTrades.forEach(trade => {
      const symbol = trade.Symbol;
      if (!regularBySymbol[symbol]) {
        regularBySymbol[symbol] = {
          ...trade,
          buyQty: 0,
          sellQty: 0,
        };
      }

      const qty = trade.Quantity || 1;
      if (trade.Type === 'BUY') {
        regularBySymbol[symbol].buyQty += qty;
      } else if (trade.Type === 'SELL') {
        regularBySymbol[symbol].sellQty += qty;
      }
    });

    // Calculate net positions for regular trades
    const nettedRegular = Object.values(regularBySymbol).map(trade => {
      const netQty = trade.buyQty - trade.sellQty;
      if (netQty === 0) return null; // Fully cancelled out

      return {
        ...trade,
        Type: netQty > 0 ? 'BUY' : 'SELL',
        Quantity: Math.abs(netQty),
        netQuantity: netQty,
      };
    }).filter(Boolean);

    // Combine closure and netted regular trades
    return [
      ...Object.values(closureBySymbol),
      ...nettedRegular,
    ];
  };

  /**
   * Check if a basket has been edited (lastUpdated != date)
   */
  const isBasketEdited = (basket) => {
    if (!basket.lastUpdated || !basket.date) return false;
    const dateVal = new Date(basket.date).getTime();
    const lastUpdatedVal = new Date(basket.lastUpdated).getTime();
    // Consider edited if difference is more than 1 minute
    return Math.abs(lastUpdatedVal - dateVal) > 60000;
  };

  /**
   * Check if any trade in basket is expired
   */
  const isBasketExpired = (trades) => {
    if (!trades || trades.length === 0) return false;
    return trades.some(trade => {
      if (trade.Exchange !== 'NFO' && trade.Exchange !== 'BFO') return false;
      return !isValidSymbolExpiry(trade.Symbol, trade.Exchange);
    });
  };

  const getModelPortfolioStrategyDetails = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    const userEmail = user?.email;

    try {
      setIsDatafetchingMP(true);
      if (userEmail && configData) {
        console.log(
          '📊 TradeContext: Getting model portfolio with config:',
          configData?.config?.REACT_APP_HEADER_NAME,
        );

        const requesturl = `${server.server.baseUrl}api/model-portfolio/subscribed-strategies/${userEmail}`;
        const response = await axios.get(requesturl, {
          headers: {
            'Content-Type': 'application/json',
            'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME,
            'aq-encrypted-key': generateToken(
              Config.REACT_APP_AQ_KEYS,
              Config.REACT_APP_AQ_SECRET,
            ),
          },
        });

        setModelPortfolioStrategyfinal(response?.data?.subscribedPortfolios);
      } else {
        console.warn('TradeContext: User email or config data is not provided');
        console.log('TradeContext: userEmail:', userEmail);
        console.log('TradeContext: configData:', !!configData);
      }
    } catch (error) {
      setModelPortfolioStrategyfinal([]);
      if (error.response) {
        console.error(
          'TradeContext: Model Portfolio API Error:',
          error.response.status,
        );
      } else if (error.request) {
        console.error('TradeContext: Model Portfolio No response received');
      } else {
        console.error(
          'TradeContext: Model Portfolio Request Error:',
          error.message,
        );
      }
    } finally {
      setIsDatafetchingMP(false);
    }
  };

  function logStockDetailsBySymbol(symbol, stockData) {
    const matchedStocks = stockData.filter(stock => stock.Symbol === symbol);
    if (matchedStocks.length > 0) {
      console.log(
        `Found ${matchedStocks.length} stock(s) for symbol: ${symbol}`,
      );
    }
  }
const getAllTrades = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const userEmail = user?.email;

  if (!userEmail) {
    console.error('[Trade Fetch] Error: User email is missing');
    setIsDatafetching(false);
    return;
  }

  if (!server?.server.baseUrl) {
    console.error('[Trade Fetch] Error: Server base URL is missing');
    setIsDatafetching(false);
    return;
  }

  if (!configData) {
    console.warn('[Trade Fetch] Warning: Config data is not available yet');
  }

  if (!configData || !userEmail) {
    console.warn("Skipping getAllTrades until configData & userEmail are ready");
    return;
  }

  setIsDatafetching(true);

  const planValid = await getPlanList();

  // Skip fetching trades for users without an active plan/subscription
  if (planValid === false) {
    console.log('[Trade Fetch] Skipping - User does not have an active plan');
    setstockRecoNotExecutedfinal([]);
    setrecommendationStockfinal([]);
    setrejectedTrades([]);
    setIgnoredTrades([]);
    setIsDatafetching(false);
    return;
  }

  const requestUrl = `${server.server.baseUrl}api/user/trade-reco-for-user?user_email=${userEmail}`;

  try {
    console.log(
      '📊 TradeContext: Getting trades with config:',
      configData?.config?.REACT_APP_HEADER_NAME,
    );

    const response = await axios.get(requestUrl, {
      headers: {
        'Content-Type': 'application/json',
        'X-Advisor-Subdomain':
          configData?.config?.REACT_APP_HEADER_NAME || 'common',
        'aq-encrypted-key': generateToken(
          Config.REACT_APP_AQ_KEYS,
          Config.REACT_APP_AQ_SECRET,
        ),
      },
    });

    const trades = response.data?.trades || [];

    const today = new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() - showAdviceStatusDays);

    const flattenResponse = response => {
      const rawTrades = response?.data?.trades ?? [];
      
      return rawTrades.flatMap(item => {
        // BASKET STRUCTURE: Has basket_advice array with trades
        if (item?.basket_advice && item?.basket_advice.length > 0) {
          const tradeDate = item.date?.$date
            ? new Date(item.date.$date)
            : new Date(item.date);

          console.log('🔍 Checking Basket:', {
            basketName: item.basketName,
            basketId: item.basketId,
            date: tradeDate,
            cutoffDate: cutoffDate,
            isAfterCutoff: tradeDate >= cutoffDate
          });

          // Check date on the parent basket
          if (tradeDate < cutoffDate) {
            console.log('❌ Basket filtered out - date before cutoff');
            return [];
          }

          console.log('🟢 Basket Found:', {
            basketName: item.basketName,
            basketId: item.basketId,
            adviceCount: item.basket_advice.length
          });

          // Filter basket advice for expiry validation
          const validExpiryAdvice = item.basket_advice.filter(advice => {
            const isValid = isValidSymbolExpiry(advice?.Symbol, advice?.Exchange);
            if (!isValid) {
              console.log('⚠️ Symbol filtered (expired):', advice?.Symbol);
            }
            return isValid;
          });

          console.log(`✅ Valid symbols after expiry check: ${validExpiryAdvice.length}/${item.basket_advice.length}`);

          debugBasketProcessing(validExpiryAdvice, item.basketName);

          // Filter out conflicting BUY/SELL orders for same symbol
          const validBasketAdvice = filterConflictingOrders(validExpiryAdvice);

          console.log(`✅ Valid symbols after conflict check: ${validBasketAdvice.length}/${validExpiryAdvice.length}`);

          if (validBasketAdvice.length === 0) {
            console.log('❌ Basket has no valid advice after filtering');
            return [];
          }

          // Map all valid basket advice trades with closure enrichment
          const mappedTrades = validBasketAdvice.map(advice => {
            const matchedToTrade = item?.to_trade_net?.find(
              t => t.Symbol === advice.Symbol,
            );

            // Determine if this is a closure position
            const isClosure = matchedToTrade?.closure === true;
            const toTradeQty = matchedToTrade?.toTradeQty ?? 0;

            // For closure positions, calculate current holding (opposite of toTradeQty)
            const currentHolding = isClosure ? Math.abs(toTradeQty) : 0;

            return {
              ...advice,
              basketId: item.basketId,
              basketName: item.basketName,
              advisor_name: item.advisor_name,
              date: item.date,
              lastUpdated: item.lastUpdated,
              description: item.description,
              toTradeQty: toTradeQty,
              // Closure-specific fields
              isClosure: isClosure,
              currentHolding: currentHolding,
              closurestatus: advice.closurestatus || null,
              // For basket metadata
              isEdited: isBasketEdited(item),
            };
          });

          console.log(`🎯 Returning ${mappedTrades.length} trades from basket ${item.basketName}`);
          return mappedTrades;
        }

        // REGULAR TRADES: Not a basket
        if (!isValidSymbolExpiry(item?.Symbol, item?.Exchange)) {
          return [];
        }
        return [item];
      });
    };

    const flattenedTrades = flattenResponse(response);

    const validTrades = flattenedTrades.filter(trade => {
      return isValidSymbolExpiry(trade?.Symbol, trade?.Exchange);
    });

    const rejectedStatuses = [
      'rejected',
      'failure',
      'failed',
      'REJECTED',
      'cancelled',
      'canceled',
      'declined',
      'error',
    ];

    const isRejectedStatus = status => {
      if (!status || typeof status !== 'string') return false;
      return rejectedStatuses.includes(status.toLowerCase());
    };

    const processedTrades = validTrades?.reduce(
      (acc, trade) => {
        const tradeDate = new Date(trade?.date);

        // BASKET TRADES: Have basketId and toTradeQty property
        if (trade.basketId && trade.hasOwnProperty('toTradeQty')) {
          // Include basket trades if:
          // 1. Status is 'recommend'
          // 2. Date is within cutoff
          // Note: We include even if toTradeQty is 0 for options baskets
          if (
            trade?.trade_place_status === 'recommend' &&
            tradeDate >= cutoffDate
          ) {
            acc.recommended.push(trade);
          }
          return acc;
        }

        // REGULAR TRADES: Process normally
        // REJECTED
        if (
          isRejectedStatus(trade?.trade_place_status) &&
          trade?.Basket === undefined &&
          (trade?.rebalance_status === undefined ||
            trade?.rebalance_status === null) &&
          tradeDate >= cutoffDate
        ) {
          acc.rejected.push(trade);
        }

        // RECOMMENDED
        if (
          (trade?.trade_place_status === 'recommend' &&
            tradeDate >= cutoffDate) ||
          (isRejectedStatus(trade?.trade_place_status) &&
            tradeDate >= cutoffDate)
        ) {
          acc.recommended.push(trade);
        }

        // IGNORED
        if (trade.trade_place_status === 'ignored') {
          acc.ignored.push(trade);
        }

        return acc;
      },
      {recommended: [], rejected: [], ignored: []},
    );

    // Sort recommended by latest date
    processedTrades.recommended.sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );

    setrejectedTrades(processedTrades.rejected);
    setIgnoredTrades(processedTrades.ignored);
    setstockRecoNotExecutedfinal(processedTrades.recommended);
    setrecommendationStockfinal(processedTrades.recommended);

    console.log("Process Recommend-----", processedTrades.recommended);

    if (trades.length === 0 && !hasFetchedTrades) {
      await handleNoTrades(userEmail, trades);
    }
  } catch (error) {
    console.error('[Trade Fetch] Error:', error);
  } finally {
    setIsDatafetching(false);
  }
};
  const [hasFetchedTrades, setHasFetchedTrades] = useState(false);
  const [planList, setPlanList] = useState(null);
  const hasFetchedTradesRef = useRef(false);

  const handleNoTrades = async (userEmail, trades) => {
    try {
      const response = await axios({
        method: 'get',
        url: `${server.server.baseUrl}api/sendnotification/${userEmail}`,
        headers: {
          'Content-Type': 'application/json',
          'X-Advisor-Subdomain':
            configData?.config?.REACT_APP_HEADER_NAME || 'common',
          'aq-encrypted-key': generateToken(
            Config.REACT_APP_AQ_KEYS,
            Config.REACT_APP_AQ_SECRET,
          ),
        },
      });

      setPlanList(response?.data?.isValid);

      // DISABLED: Don't send recommendations to users without active plans
      // Previously, we were sending last 2 recommendations even to non-subscribed users
      // This has been removed to ensure only paying subscribers receive trade recommendations

      // if (response?.data?.isValid === false) {
      //   const sendRecoUrl = `${server.ccxtServer.baseUrl}comms/send-last-reco/2`;
      //   const payload = {
      //     userEmail: userEmail,
      //     advisorName: advisorspecific,
      //   };

      //   await axios.post(sendRecoUrl, payload, {
      //     headers: {
      //       'Content-Type': 'application/json',
      //       'X-Advisor-Subdomain':
      //         configData?.config?.REACT_APP_HEADER_NAME || 'common',
      //       'aq-encrypted-key': generateToken(
      //         Config.REACT_APP_AQ_KEYS,
      //         Config.REACT_APP_AQ_SECRET,
      //       ),
      //     },
      //   });

      //   setTimeout(() => {
      //     if (!hasFetchedTradesRef.current) {
      //       console.log('Calling getAllTrades only once...');
      //       hasFetchedTradesRef.current = true;
      //       getAllTrades();
      //     }
      //   }, 1000);
      // }
      return response?.data?.isValid;
    } catch (planError) {
      if (planError.response) {
        if (
          planError.response.data.status === 1 &&
          planError.response.data.plans.length === 0
        ) {
          setPlanList(false);
        }
      } else if (planError.request) {
        console.error('No response received:', planError.request);
      } else {
        console.error('Error fetching plan list:', planError.message);
      }
    }
  };

  const getPlanList = async () => {
    try {
      const response = await axios({
        method: 'get',
        url: `${server.server.baseUrl}api/sendnotification/${userEmail}`,
        headers: {
          'Content-Type': 'application/json',
          'X-Advisor-Subdomain':
            configData?.config?.REACT_APP_HEADER_NAME || 'common',
          'aq-encrypted-key': generateToken(
            Config.REACT_APP_AQ_KEYS,
            Config.REACT_APP_AQ_SECRET,
          ),
        },
      });
      console.log("RESPONSE HERE FOR VALIDITY---cccccccccccccccccccc------", configData?.config?.REACT_APP_HEADER_NAME || 'common',response?.data)
      setPlanList(response?.data?.isValid);
      return response?.data?.isValid;
    } catch (planError) {
      if (planError.response) {
        console.error('API Error Response:', planError.response.data);
        if (
          planError.response.data.status === 1 &&
          planError.response.data.plans.length === 0
        ) {
          setPlanList(false);
        }
      } else if (planError.request) {
        console.error('No response received:', planError.request);
      } else {
        console.error('Error fetching plan list:', planError.message);
      }
    }
  };

  // ... (keeping all your other existing functions as they were)
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [userDetails, setUserDetails] = useState(null);
  const [brokerStatus, setBrokerStatus] = useState(null);
  const [funds, setFunds] = useState({});

  const getUserDeatils = async () => {
    try {
      const response = await axios.get(
        `${server.server.baseUrl}api/user/getUser/${userEmail}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || getAdvisorSubdomain(),
            'aq-encrypted-key': generateToken(
              Config.REACT_APP_AQ_KEYS,
              Config.REACT_APP_AQ_SECRET,
            ),
          },
        },
      );
      const user = response.data.User;

      // DEBUG: Log the entire user object and broker status
      console.log('🔍 [BROKER DEBUG] Full API Response User:', JSON.stringify(user, null, 2));
      console.log('🔍 [BROKER DEBUG] user_broker:', user?.user_broker);
      console.log('🔍 [BROKER DEBUG] connect_broker_status from API:', user?.connect_broker_status);
      console.log('🔍 [BROKER DEBUG] connect_broker_status type:', typeof user?.connect_broker_status);

      setBroker(user?.user_broker);
      setUserDetails(user);
      setIsBrokerConnected(!!user?.user_broker);
      console.log(
        'user details i get final-------:',
        !!user?.user_broker,
        user?.user_broker,
      );
      if (
        response?.data?.phone_number &&
        response?.data?.phone_number.toString().length >= 9
      ) {
        setIsProfileCompleted(true);
      }
      setBrokerStatus(user?.connect_broker_status);
      console.log('🔍 [BROKER DEBUG] brokerStatus SET TO:', user?.connect_broker_status);
      return user;
    } catch (error) {
      console.error('Error fetching user details:', error.message);
    }
  };

  const [broker, setBroker] = useState(
    userDetails ? userDetails?.user_broker : null,
  );

  const getAllFunds = async () => {
    if (!userDetails) {
      return;
    }
    if (
      broker === null ||
      broker === undefined ||
      broker === ''
    ) {
      setBrokerHoldingsData([]);
      return;
    }

    const {
      user_broker,
      clientCode,
      apiKey,
      jwtToken,
      secretKey,
      sid,
      viewToken,
      serverId,
    } = userDetails;

    try {
      const fetchedFunds = await fetchFunds(
        broker,
        clientCode,
        apiKey,
        jwtToken,
        secretKey,
        sid,
        viewToken,
        serverId,
        configData,
      );
      console.log("Fetched Funds-----",fetchedFunds);
      if (fetchedFunds) {
        setFunds(fetchedFunds);
      } else {
        console.error('No funds fetched.');
      }
    } catch (error) {
      console.error('Error fetching funds:', error);
    }
  };

  const fetchBrokerStatusModal = async () => {
    if (userEmail) {
      try {
        const updatedUserDetails = await getUserDeatils();
      } catch (error) {
        setIsBrokerConnected(false);
      } finally {
        const updatedUserDetails = await getUserDeatils();
      }
    }
  };

  const [isPerformerLoading, setIsPerformerLoading] = useState(false);
  const [bestPerformer, setbestPerformer] = useState();

  const getAllBestPerformers = async () => {
    try {
      setIsPerformerLoading(true);
      const response = await axios.get(
        `${server.ccxtServer.baseUrl}comms/reco/best-performer-closed-advice/arfs/30`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Advisor-Subdomain':
              configData?.config?.REACT_APP_HEADER_NAME || 'common',
            'aq-encrypted-key': generateToken(
              Config.REACT_APP_AQ_KEYS,
              Config.REACT_APP_AQ_SECRET,
            ),
          },
        },
      );
      setbestPerformer(response.data.bestPerformers);
    } catch (error) {
      console.error('Error fetching best performers:', error.response);
    } finally {
      setIsPerformerLoading(false);
    }
  };

  const [isNotificationLoading, setIsNotificationLoading] = useState(false);
  const [allNotifications, setAllNotifications] = useState(null);

  const getAllNotifcations = async () => {
    try {
      setIsNotificationLoading(true);
      const response = await axios.get(
        `${server.server.baseUrl}api/sendnotification/get-user-notifications/${userEmail}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Advisor-Subdomain':
              configData?.config?.REACT_APP_HEADER_NAME || 'common',
            'aq-encrypted-key': generateToken(
              Config.REACT_APP_AQ_KEYS,
              Config.REACT_APP_AQ_SECRET,
            ),
          },
        },
      );

      setAllNotifications(response.data.data);
    } catch (error) {
      console.error('Error fetching notifications', error);
    } finally {
      setIsNotificationLoading(false);
    }
  };

  const [pdf, setPdf] = useState([]);

  const fetchPdf = async () => {
    try {
      const response = await axios.get(
        `${server.ccxtServer.baseUrl}/misc/pdfs?advisor=${advisortag}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Advisor-Subdomain':
              configData?.config?.REACT_APP_HEADER_NAME || 'common',
            'aq-encrypted-key': generateToken(
              Config.REACT_APP_AQ_KEYS,
              Config.REACT_APP_AQ_SECRET,
            ),
          },
        },
      );

      if (response) {
        const data = await response.data.pdfs;
        setPdf(data);
      } else {
        throw new Error('Failed to fetch pdfs');
      }
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const fetchVideos = async () => {
    setIsDatafetchingvideos(true);
    try {
      const response = await axios.get(
        `${server.ccxtServer.baseUrl}/misc/videos?advisor=${advisortag}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Advisor-Subdomain':
              configData?.config?.REACT_APP_HEADER_NAME || 'common',
            'aq-encrypted-key': generateToken(
              Config.REACT_APP_AQ_KEYS,
              Config.REACT_APP_AQ_SECRET,
            ),
          },
        },
      );

      if (response) {
        const data = await response.data.videos;
        setVideos(data);
        setIsDatafetchingvideos(false);
      } else {
        throw new Error('Failed to fetch videos');
      }
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const [blogs, setBlogs] = useState([]);
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(false);
  const [blogsError, setBlogsError] = useState(null);
  const [currentBlogsPage, setCurrentBlogsPage] = useState(1);
  const [totalBlogsPages, setTotalBlogsPages] = useState(0);
  const blogsPerPage = 9;

  const fetchBlogs = useCallback(
    async (page = 1) => {
      // console.log('this hitbpgppa', page);
      setLoading(true);
      setBlogsError(null);

      const endpoint = `${server.ccxtServer.baseUrl}misc/s3/blogs-content?page=${page}&limit=${blogsPerPage}`;

      try {
        const response = await axios.get(endpoint, {
          headers: {
            'Content-Type': 'application/json',
            'X-Advisor-Subdomain':
              configData?.config?.REACT_APP_HEADER_NAME || 'common',
            'aq-encrypted-key': generateToken(
              Config.REACT_APP_AQ_KEYS,
              Config.REACT_APP_AQ_SECRET,
            ),
          },
        });

        if (response.data && response.data.data) {
          setBlogs(response.data.data.blogs || []);
          setTotalBlogsPages(response.data.data.totalPages || 0);
          setCurrentBlogsPage(response.data.data.currentPage || page);
        } else {
          setBlogs(response.data.blogs || response.data.items || []);
          setTotalBlogsPages(response.data.totalPages || 0);
          setCurrentBlogsPage(response.data.currentPage || page);
        }
      } catch (error) {
        console.error(
          'Error fetching blogs:',
          error.response?.data || error.message,
        );
        setBlogsError('Could not load blogs. Please try again later.');
        setBlogs([]);
        setTotalBlogsPages(0);
      } finally {
        setLoading(false);
      }
    },
    [advisortag, blogsPerPage, configData],
  );

  const [isProfileCompleted, setIsProfileCompleted] = useState(null);

  useEffect(() => {
    if (
      userDetails?.phone_number &&
      userDetails?.phone_number.toString().length >= 5
    ) {
      setIsProfileCompleted(true);
    } else {
      setIsProfileCompleted(false);
    }
  }, [userDetails]);

  // ENHANCED: Fetch data only when configData is available
  useEffect(() => {
    if (configData && advisortag) {
      console.log(
        '✅ TradeContext: Config available, fetching content data...',
      );
      fetchVideos();
      fetchBlogs();
      getAllBestPerformers();
      fetchPdf();
    } else {
      console.log(
        '⚠️ TradeContext: Waiting for config data before fetching content...',
      );
    }
  }, [advisortag, configData]);

  useEffect(() => {
    if (userEmail && configData) {
      console.log('✅ TradeContext: Config available, fetching user data...');
      getUserDeatils();
      getPlanList();
      // Refresh broker status on app launch to ensure correct state on new devices
      fetchBrokerStatusModal();
    } else {
      console.log(
        '⚠️ TradeContext: Waiting for config data before fetching user data...',
      );
    }
  }, [userEmail, configData]);

  useEffect(() => {
    if (userDetails && broker && configData) {
      setBroker(userDetails?.user_broker);
      getAllFunds();
    }
  }, [userDetails, configData]);

  useEffect(() => {
    if (userEmail && configData) {
      fetchVideos();
      getAllTrades();
      getAllNotifcations();
      getModelPortfolioStrategyDetails();
    }
  }, [userEmail, configData]);

  // for broker specigfic Holdings
  const [BrokerHoldingsData, setBrokerHoldingsData] = useState([]);

  const getAllBrokerSpecificHoldings = async () => {
    if (
      broker === null ||
      broker === undefined ||
      broker === '' ||
      brokerStatus === 'Disconnected'
    ) {
      setBrokerHoldingsData([]);
      return;
    }
    const {
      user_broker,
      clientCode,
      apiKey,
      jwtToken,
      secretKey,
      sid,
      viewToken,
      serverId,
    } = userDetails;

    try {
      const brokerSpecificHolding = await fetchBrokerSpecificHoldings(
        broker,
        clientCode,
        apiKey,
        jwtToken,
        secretKey,
        sid,
        viewToken,
        serverId,
        configData,
      );
      if (brokerSpecificHolding) {
        setBrokerHoldingsData(brokerSpecificHolding);
      } else {
        console.error('No funds fetched.');
      }
    } catch (error) {
      console.error('Error fetching funds:', error);
    }
  };

  // for broker specific all holdings calculation
  const [allHoldingsData, setAllHoldingsData] = useState();

  const getAllHoldings = async () => {
    if (
      broker === null ||
      broker === undefined ||
      broker === '' ||
      brokerStatus === 'Disconnected'
    ) {
      setAllHoldingsData();
      return;
    }
    const {
      user_broker,
      clientCode,
      apiKey,
      jwtToken,
      secretKey,
      sid,
      viewToken,
      serverId,
    } = userDetails;

    try {
      const allHoldings = await fetchBrokerAllHoldings(
        broker,
        clientCode,
        apiKey,
        jwtToken,
        secretKey,
        sid,
        viewToken,
        serverId,
        configData,
      );
      if (allHoldings) {
        setAllHoldingsData(allHoldings);
      } else {
        console.error('No funds fetched.');
      }
    } catch (error) {
      console.error('Error fetching funds:', error);
    }
  };

  useEffect(() => {
    if (userDetails) {
      setBroker(userDetails?.user_broker);
      getAllBrokerSpecificHoldings();
      getAllHoldings();
    }
  }, [userDetails]);

  const [marketPrices, setMarketPrices] = useState({});

  const fetchMarketPrices = async symbols => {
    try {
      const data = JSON.stringify({
        Orders: symbols.map(sym => ({
          exchange: 'NSE', // adjust if required per symbol
          segment: '',
          tradingSymbol: sym,
        })),
      });

      console.log('data', data);
      const config = {
        method: 'post',
        url: `${server.ccxtServer.baseUrl}angelone/market-data`,
        headers: {
          'Content-Type': 'application/json',
          'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME,
          'aq-encrypted-key': generateToken(
            Config.REACT_APP_AQ_KEYS,
            Config.REACT_APP_AQ_SECRET,
          ),
        },
        data,
      };

      const response = await axios.request(config);
      const pricesMap = {};
      response?.data?.data?.fetched?.forEach(item => {
        pricesMap[item.tradingSymbol] = item.ltp;
      });

      setMarketPrices(pricesMap);
    } catch (error) {
      console.error('Error fetching market prices:', error);
    }
  };
  return (
    <TradeContext.Provider
      value={{
        isProfileCompleted,
        userEmail,
        planList,
        setIsProfileCompleted,
        setVideos,
        setHasFetchedTrades,
        blogs,
        fetchBlogs,
        pdf,
        videos,
        fetchVideos,
        modelPortfolioStrategyfinal,
        stockRecoNotExecutedfinal,
        recommendationStockfinal,
        isDatafetching,
        getAllTrades,
        getModelPortfolioStrategyDetails,
        rejectedTrades,
        isDatafetchingvideos,
        ignoredTrades,
        isDatafetchinMP,
        userDetails,
        setUserDetails,
        setFunds,
        setBroker,
        setstockRecoNotExecutedfinal,
        setModelPortfolioStrategyfinal,
        isBrokerConnected,
        allNotifications,
        getAllNotifcations,
        isNotificationLoading,
        broker,
        brokerStatus,
        getUserDeatils,
        funds,
        getAllFunds,
        bestPerformer,
        isPerformerLoading,
        fetchBrokerStatusModal,
        getAllBestPerformers,
        fetchPdf,
        setUserDetails,
        getPlanList,
        configData,
        configLoading,
        reloadConfigData, // NEW: Expose this function to force reload config
        //for broker specific holdings
        BrokerHoldingsData,
        getAllBrokerSpecificHoldings,
        allHoldingsData,
        setAllHoldingsData,
        getAllHoldings,
        marketPrices,
        fetchMarketPrices,
        // Basket helper functions
        netBasketTrades,
        isBasketEdited,
        isBasketExpired,
        isValidSymbolExpiry,
      }}>
      {children}
    </TradeContext.Provider>
  );
};
