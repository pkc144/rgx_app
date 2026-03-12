import axios from "axios";
import CryptoJS from "react-native-crypto-js";
import Toast from "react-native-toast-message";
import Config from "react-native-config";
import server from "../utils/serverConfig";
import { generateToken } from "../utils/SecurityTokenManager";
import { getAdvisorSubdomain } from "../utils/variantHelper";

const angelOneApiKey = Config.REACT_APP_ANGEL_ONE_API_KEY;

const BROKER_URL_MAP = {
  Kotak: "kotak",
  Fyers: "fyers",
  AliceBlue: "aliceblue",
  Dhan: "dhan",
  "ICICI Direct": "icici",
  "IIFL Securities": "iifl",
  Upstox: "upstox",
  "Hdfc Securities": "hdfc",
  "Angel One": "angelone",
  "Motilal Oswal": "motilal-oswal",
  Zerodha: "zerodha/api",
  Groww: "groww",
};

const checkValidApiAnSecret = (details) => {
  try {
    const bytesKey = CryptoJS.AES.decrypt(details, "ApiKeySecret");
    const Key = bytesKey.toString(CryptoJS.enc.Utf8);

    if (Key) {
      return Key;
    } else {
      throw new Error("Decryption failed or invalid key.");
    }
  } catch (error) {
    return null;
  }
};

export const createPlaceOrderFunction = ({
  setLoading,
  userDetails,
  getAllTrades,
  getAllTradesUpdate,
  getCartAllStocks,
  stockDetails,
  broker,
  clientCode,
  apiKey,
  secretKey,
  jwtToken,
  sid,
  serverId,
  setShowOtherBrokerModel,
  setShowDhanTpinModel,
  setShowAngleOneTpinModel,
  setShowDdpiModal,
  setShowFyersTpinModal,
  setOpenReviewTrade,
  setOrderPlacementResponse,
  setOpenSucessModal,
  setGttOpenSucessModal,
  updatePortfolioData,
  isReturningFromOtherBrokerModal,
  setIsReturningFromOtherBrokerModal,
}) => {
  return async () => {
    setLoading(true);

    // Separate GTT and regular orders
    const gttOrders = stockDetails.filter(
      (stock) =>
        stock.gttCheck === true &&
        ["upstox", "zerodha"].includes(broker.toLowerCase())
    );

    const regularOrders = stockDetails.filter(
      (stock) =>
        !(
          stock.gttCheck === true &&
          ["upstox", "zerodha"].includes(broker.toLowerCase())
        )
    );

    const getOrderPayload = () => {
      const basePayload = {
        user_broker: broker,
      };

      // If there are GTT orders, create special payload
      if (gttOrders.length > 0) {
        const gttTrades = gttOrders.map((stock) => {
          const baseGttTrade = {
            trade_given_by: stock.trade_given_by || userDetails?.email,
            user_broker: broker,
            user_email: userDetails?.email,
            zerodhaTradeId: stock.zerodhaTradeId,
          };

          // Add legs based on the stock data
          if (stock.entryLeg) {
            baseGttTrade.entryLeg = {
              tradingSymbol: stock.entryLeg.Symbol,
              exchange: stock.entryLeg.Exchange,
              transactionType: stock.entryLeg.Type,
              quantity: stock.quantity,
              orderType: stock.entryLeg.OrderType,
              productType: stock.entryLeg.ProductType,
              price: parseFloat(stock.entryLeg.triggerPrice),
              triggerPrice: parseFloat(stock.entryLeg.triggerPrice),
              ltp: parseFloat(stock.entryLeg.ltp),
            };
          }

          if (stock.leg1) {
            baseGttTrade.leg1 = {
              tradingSymbol: stock.leg1.Symbol,
              exchange: stock.leg1.Exchange,
              transactionType: stock.leg1.Type,
              quantity: stock.quantity,
              orderType: stock.leg1.OrderType,
              productType: stock.leg1.ProductType,
              price: parseFloat(stock.leg1.triggerPrice),
              triggerPrice: parseFloat(stock.leg1.triggerPrice),
              ltp: parseFloat(stock.leg1.ltp),
            };
          }

          if (stock.leg2) {
            baseGttTrade.leg2 = {
              tradingSymbol: stock.leg2.Symbol,
              exchange: stock.leg2.Exchange,
              transactionType: stock.leg2.Type,
              quantity: stock.quantity,
              orderType: stock.leg2.OrderType,
              productType: stock.leg2.ProductType,
              price: parseFloat(stock.leg2.triggerPrice),
              triggerPrice: parseFloat(stock.leg2.triggerPrice),
              ltp: parseFloat(stock.leg2.ltp),
            };
          }
          return baseGttTrade;
        });

        // Add broker-specific credentials for GTT orders
        const gttPayload = {
          ...basePayload,
          trades: gttTrades,
          gtt: true,
        };

        switch (broker) {
          case "IIFL Securities":
            return { ...gttPayload, clientCode, jwtToken };
          case "ICICI Direct":
            return {
              ...gttPayload,
              apiKey: checkValidApiAnSecret(apiKey),
              secretKey: checkValidApiAnSecret(secretKey),
              accessToken: jwtToken,
            };
          case "Upstox":
            return {
              ...gttPayload,
              apiKey: checkValidApiAnSecret(apiKey),
              apiSecret: checkValidApiAnSecret(secretKey),
              accessToken: jwtToken,
            };
          case "Kotak":
            return {
              ...gttPayload,
              apiKey: checkValidApiAnSecret(apiKey),
              secretKey: checkValidApiAnSecret(secretKey),
              accessToken: jwtToken,
              sid,
              serverId: serverId ? serverId : "",
            };
          case "Hdfc Securities":
            return {
              ...gttPayload,
              apiKey: checkValidApiAnSecret(apiKey),
              accessToken: jwtToken,
            };
          case "Dhan":
            return { ...gttPayload, clientCode, accessToken: jwtToken };
          case "Groww":
            return { ...gttPayload, accessToken: jwtToken };
          case "AliceBlue":
            return {
              ...gttPayload,
              clientCode,
              apiKey: checkValidApiAnSecret(apiKey),
              accessToken: jwtToken,
            };
          case "Fyers":
            return { ...gttPayload, clientCode, accessToken: jwtToken };
          case "Motilal Oswal":
            return {
              ...gttPayload,
              clientCode,
              apiKey: checkValidApiAnSecret(apiKey),
              accessToken: jwtToken,
            };
          case "Zerodha":
            // Server fetches apiKey/secretKey from DB using userEmail
            return {
              ...gttPayload,
              accessToken: jwtToken,
            };
          case "Angel One":
            return {
              ...gttPayload,
              apiKey: angelOneApiKey,
              accessToken: jwtToken,
            };
          default:
            return { ...gttPayload, apiKey, accessToken: jwtToken };
        }
      }

      // For regular orders, use the existing logic
      const regularPayload = {
        ...basePayload,
        trades: regularOrders,
      };

      // Add broker-specific credentials based on broker type
      switch (broker) {
        case "IIFL Securities":
          return { ...regularPayload, clientCode, jwtToken };
        case "ICICI Direct":
          return { ...regularPayload, apiKey, secretKey, jwtToken };
        case "Upstox":
          return { ...regularPayload, apiKey, jwtToken, secretKey };
        case "Kotak":
          return {
            ...regularPayload,
            apiKey,
            secretKey,
            jwtToken,
            sid,
            serverId: serverId ? serverId : "",
          };
        case "Hdfc Securities":
          return { ...regularPayload, apiKey, jwtToken };
        case "Dhan":
          return { ...regularPayload, clientCode, jwtToken };
        case "Groww":
          return { ...regularPayload, jwtToken };
        case "AliceBlue":
          return { ...regularPayload, clientCode, jwtToken, apiKey: checkValidApiAnSecret(apiKey) };
        case "Fyers":
          return { ...regularPayload, clientCode, jwtToken };
        case "Motilal Oswal":
          return { ...regularPayload, apiKey, clientCode, jwtToken };
        case "Zerodha":
          // Server fetches apiKey/secretKey from DB using userEmail
          return { ...regularPayload, jwtToken };
        case "Angel One":
          return {
            ...regularPayload,
            apiKey: angelOneApiKey,
            secretKey,
            jwtToken,
          };
        default:
          return { ...regularPayload, apiKey, jwtToken };
      }
    };

    const allBuy = stockDetails.every(
      (stock) => stock.transactionType === "BUY"
    );
    const allSell = stockDetails.every(
      (stock) => stock.transactionType === "SELL"
    );

    const isMixed =
      stockDetails?.some((stock) => stock.transactionType === "BUY") &&
      stockDetails?.some((stock) => stock.transactionType === "SELL");

    const specialBrokers = [
      "IIFL Securities",
      "ICICI Direct",
      "Upstox",
      "Kotak",
      "Hdfc Securities",
      "AliceBlue",
      "Motilal Oswal",
      "Groww",
    ];

    try {
      const payload = getOrderPayload();

      // Dynamic endpoint selection based on GTT orders and broker
      let endpoint;

      if (gttOrders.length > 0) {
        const brokerUrl = BROKER_URL_MAP[broker];
        endpoint = `${server.ccxtServer.baseUrl}${brokerUrl}/process-trades`;
      } else {
        // Regular order endpoint
        endpoint = `${server.server.baseUrl}api/process-trades/order-place`;
      }

      const response = await axios.request({
        method: "post",
        url: endpoint,
        data: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          "X-Advisor-Subdomain": getAdvisorSubdomain(),
          "aq-encrypted-key": generateToken(
            Config.REACT_APP_AQ_KEYS,
            Config.REACT_APP_AQ_SECRET
          ),
        },
      });

      if (gttOrders.length > 0) {
        setOrderPlacementResponse(response.data[0]);
        setGttOpenSucessModal(true);
        setOpenReviewTrade(false);
        setLoading(false);
        await Promise.all([
          updatePortfolioData(broker, userDetails?.email),
          getAllTrades(),
          getAllTradesUpdate?.(),
          getCartAllStocks(),
        ]);
      } else {
        setOrderPlacementResponse(response.data.response);
        setOpenSucessModal(true);
        setOpenReviewTrade(false);
        setLoading(false);
        const rejectedSellCount = response.data.response.reduce(
          (count, order) => {
            const isRejected = [
              "REJECTED",
              "Rejected",
              "rejected",
              "cancelled",
              "CANCELLED",
              "Cancelled",
              "FAILURE",
              "failure",
              "Failure",
            ].includes(order?.orderStatus);
            return isRejected && order.transactionType === "SELL"
              ? count + 1
              : count;
          },
          0
        );

        // Handle TPIN/EDIS modals for all brokers when sell orders are rejected
        // Don't rely on CDSL keyword detection — error message formats can change
        if (
          !isReturningFromOtherBrokerModal &&
          (allSell || isMixed) &&
          rejectedSellCount >= 1
        ) {
          if (broker === "Dhan" && setShowDhanTpinModel) {
            setShowDhanTpinModel(true);
            setOpenReviewTrade(false);
            setLoading(false);
            return;
          } else if (broker === "Angel One" && setShowAngleOneTpinModel) {
            setShowAngleOneTpinModel(true);
            setOpenReviewTrade(false);
            setLoading(false);
            return;
          } else if (broker === "Zerodha" && setShowDdpiModal) {
            setShowDdpiModal(true);
            setOpenReviewTrade(false);
            setLoading(false);
            return;
          } else if (broker === "Fyers" && setShowFyersTpinModal) {
            setShowFyersTpinModal(true);
            setOpenReviewTrade(false);
            setLoading(false);
            return;
          }
        }

        if (
          !isReturningFromOtherBrokerModal &&
          specialBrokers.includes(broker)
        ) {
          if (allBuy) {
            setOpenSucessModal(true);
            setOpenReviewTrade(false);
          } else if (
            (allSell || isMixed) &&
            rejectedSellCount >= 1
          ) {
            // Don't gate on is_authorized_for_sell DB flag — it persists across
            // sessions but EDIS authorization expires per-session
            setShowOtherBrokerModel(true);
            setOpenReviewTrade(false);
            setLoading(false);
            return;
          } else {
            setOpenSucessModal(true);
            setOpenReviewTrade(false);
          }
        } else {
          setOpenSucessModal(true);
        }
        setOpenReviewTrade(false);

        await Promise.all([
          updatePortfolioData(broker, userDetails?.email),
          getAllTrades(),
          getAllTradesUpdate?.(),
          getCartAllStocks(),
        ]);
      }
    } catch (error) {
      console.error("Error placing order:", error);
      setLoading(false);

      let errorMsg;
      if (error?.code === "ERR_NETWORK" || error?.code === "ECONNABORTED") {
        errorMsg = `Unable to connect to ${broker} trading server. This could be due to broker session expiry or a temporary server issue. Please reconnect your broker and try again.`;
      } else if (error?.response?.status === 401 || error?.response?.status === 403) {
        errorMsg = `${broker} session has expired. Please reconnect your broker and try again.`;
      } else {
        errorMsg = error?.response?.data?.error || error?.response?.data?.message || "There was an issue in placing the trade, please try again after sometime or contact your admin";
      }

      Toast.show({
        type: "error",
        text1: "Order Failed",
        text2: errorMsg,
        position: "top",
        visibilityTime: 6000,
      });
    }
    setIsReturningFromOtherBrokerModal(false);
  };
};

// Export default for backwards compatibility
export default {
  createPlaceOrderFunction,
};
