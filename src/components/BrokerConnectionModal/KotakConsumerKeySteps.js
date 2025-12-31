import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Clipboard,
  Alert,
  Linking,
} from "react-native";
import { ChevronDown, ChevronUp, X as XIcon } from "lucide-react-native";

const KotakConsumerKeySteps = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleCopy = (text) => {
    Clipboard.setString(text);
    Alert.alert("Copied", "Link copied to clipboard!");
  };

  return (
    <>
      <View style={{ flexDirection: "row", marginTop: 20, alignItems: "center" }}>
        <TouchableOpacity onPress={onClose}>
          <XIcon size={24} color="#000" />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 16,
            marginHorizontal: 40,
            fontWeight: "bold",
            color: "black",
          }}
        >
          Kotak: Steps to get Consumer Key & Consumer Secret
        </Text>
        <TouchableOpacity onPress={toggleOpen} style={{ position: "absolute", right: 10 }}>
          {isOpen ? <ChevronUp size={20} color="black" /> : <ChevronDown size={20} color="black" />}
        </TouchableOpacity>
      </View>

      {isOpen && (
        <ScrollView contentContainerStyle={{ paddingBottom: 200 }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: "black" }}>
              Steps to obtain Consumer Key & Secret:
            </Text>

            {/* Step 1 */}
            <Text style={{ marginTop: 10 }}>
              <Text style={{ fontWeight: "bold" }}>1. Visit Kotak Neo Trading API Platform:</Text>
            </Text>
            <TouchableOpacity onPress={() => Linking.openURL("https://napi.kotaksecurities.com/devportal/apis")}>
              <Text style={{ color: "blue" }}>https://napi.kotaksecurities.com/devportal/apis</Text>
            </TouchableOpacity>

            {/* Step 2 */}
            <Text style={{ marginTop: 10 }}>
              <Text style={{ fontWeight: "bold" }}>2. Log In to Kotak API Portal:</Text>
            </Text>
            <TouchableOpacity onPress={() => Linking.openURL("https://napi.kotaksecurities.com/devportal/apis")}>
              <Text style={{ color: "blue" }}>napi.kotaksecurities.com/devportal/apis</Text>
            </TouchableOpacity>

            {/* Copy to Clipboard */}
            <TouchableOpacity onPress={() => handleCopy("https://napi.kotaksecurities.com/devportal/apis")}>
              <Text style={{ color: "gray", fontSize: 12 }}>📋 Copy Link</Text>
            </TouchableOpacity>

            {/* Step 3 */}
            <Text style={{ marginTop: 10 }}>
              <Text style={{ fontWeight: "bold" }}>3. Create an Application:</Text>
            </Text>
            <Text>- Navigate to the "Applications" section and click on "Add New Application".</Text>

            {/* Step 4 */}
            <Text style={{ marginTop: 10 }}>
              <Text style={{ fontWeight: "bold" }}>4. Subscribe to APIs:</Text>
            </Text>
            <Text>- In the "Subscriptions" tab, subscribe to all available APIs.</Text>

            {/* Step 5 */}
            <Text style={{ marginTop: 10 }}>
              <Text style={{ fontWeight: "bold" }}>5. Generate API & Secret Keys:</Text>
            </Text>
            <Text>- Go to the "Production Keys" section and click "Generate Keys".</Text>

            {/* Step 6 */}
            <Text style={{ marginTop: 10 }}>
              <Text style={{ fontWeight: "bold" }}>6. Totp Registration:</Text>
            </Text>
            <TouchableOpacity
              onPress={() =>
                Linking.openURL("https://www.kotaksecurities.com/platform/kotak-neo-trade-api/")
              }
            >
              <Text style={{ color: "blue" }}>
                https://www.kotaksecurities.com/platform/kotak-neo-trade-api/
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                handleCopy("https://www.kotaksecurities.com/platform/kotak-neo-trade-api/")
              }
            >
              <Text style={{ color: "gray", fontSize: 12 }}>📋 Copy Link</Text>
            </TouchableOpacity>

            {/* Additional Steps */}
            <Text style={{ marginTop: 10 }}>7. Verify your mobile number with OTP.</Text>
            <Text>8. Select an account for TOTP registration.</Text>
            <Text>9. Scan the QR code in an authenticator app.</Text>
            <Text>10. Submit the TOTP to complete registration.</Text>
          </View>
        </ScrollView>
      )}
    </>
  );
};

export default KotakConsumerKeySteps;
