import axios from "axios";
import server from "../../utils/serverConfig";

import { generateToken } from "../../utils/SecurityTokenManager";
import Config from "react-native-config";


export function getStrategyDetails(modelSpecificStrategy, configData) {
  const normalizedStrategyName = modelSpecificStrategy
    .replaceAll("_", " ")
    .toLowerCase();
  return axios.get(
    `${server.server.baseUrl}api/model-portfolio/portfolios/strategy/${normalizedStrategyName}`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Advisor-Subdomain": configData?.config?.REACT_APP_HEADER_NAME,
        "aq-encrypted-key": generateToken(
          Config.REACT_APP_AQ_KEYS,
          Config.REACT_APP_AQ_SECRET
        ),
      },
    }
  );
}

export function updateStrategySubscription(email, action, strategyDetails, configData) {
  let payloadData = JSON.stringify({
    email: email,
    action: action,
  });
  return axios.put(
    `${server.server.baseUrl}api/model-portfolio/subscribe-strategy/${strategyDetails?._id}`,
    payloadData,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Advisor-Subdomain": configData?.config?.REACT_APP_HEADER_NAME,
        "aq-encrypted-key": generateToken(
          Config.REACT_APP_AQ_KEYS,
          Config.REACT_APP_AQ_SECRET
        ),
      },
    }
  );
}

export function userInsertDoc(email, strategyDetails, investAmount, broker, configData) {
  const insertDocPayload = {
    userEmail: email,
    model: strategyDetails?.model_name,
    advisor: strategyDetails?.advisor,
    model_id: strategyDetails?.model_Id,
    userBroker: broker ? broker : "DummyBroker",
    subscriptionAmountRaw: [
      {
        amount: investAmount,
        dateTime: new Date(),
      },
    ],
  };
  return axios.post(
    `${server.ccxtServer.baseUrl}rebalance/insert-user-doc`,
    insertDocPayload,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Advisor-Subdomain": configData?.config?.REACT_APP_HEADER_NAME,
        "aq-encrypted-key": generateToken(
          Config.REACT_APP_AQ_KEYS,
          Config.REACT_APP_AQ_SECRET
        ),
      },
    }
  );
}
