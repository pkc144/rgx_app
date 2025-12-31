
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Config from 'react-native-config';
import APP_VARIANTS from '../utils/Config';
import { generateToken } from '../utils/SecurityTokenManager';

const ConfigContext = createContext();

export const useConfig = () => {
    return useContext(ConfigContext);
};

export const ConfigProvider = ({ children }) => {
    const selectedVariant = Config.APP_VARIANT || 'arfs'; // Default to "arfs" if not set
    const initialConfig = { ...APP_VARIANTS[selectedVariant], selectedVariant };
    const [config, setConfig] = useState(initialConfig);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                // Get base URL and subdomain from environment variables
                const baseUrl = Config.REACT_APP_NODE_SERVER_API_URL || 'http://localhost:8001/';
                const subdomain = Config.REACT_APP_ADVISOR_SUBDOMAIN || Config.REACT_APP_HEADER_NAME || 'zamzamcapital';

                // Construct the API URL
                const apiUrl = `${baseUrl}api/app-advisor/get?appSubdomain=${subdomain}`;

                console.log('Fetching config from:', apiUrl);

                // Prepare headers with authentication
                const headers = {
                    'Content-Type': 'application/json',
                    'X-Advisor-Subdomain': Config.REACT_APP_X_ADVISOR_SUBDOMAIN || Config.REACT_APP_HEADER_NAME || subdomain,
                    'aq-encrypted-key': Config.REACT_APP_AQ_ENCRYPTED_KEY || generateToken(
                        Config.REACT_APP_AQ_KEYS,
                        Config.REACT_APP_AQ_SECRET
                    ),
                };

                const response = await axios.get(apiUrl, { headers });

                console.log('API Response:', response.data);

                if (response.data && response.data.data) {
                    const apiData = response.data.data; // API returns data nested under response.data.data

                    console.log('✅ API Data received from database:', {
                        appName: apiData.appName,
                        subdomain: apiData.subdomain,
                        themeColor: apiData.themeColor,
                        hasApiKeys: !!apiData.apiKeys,
                        advisorSpecificTag: apiData.apiKeys?.advisorSpecificTag,
                        advisorRaCode: apiData.apiKeys?.advisorRaCode,
                    });

                    // Map API response to APP_VARIANTS structure
                    // Priority: API data first, then fallback to static APP_VARIANTS for UI-specific fields
                    const newConfig = {
                        // Start with static UI defaults (colors, gradients, layout settings)
                        ...initialConfig,

                        // Override with API data (this is the primary source)
                        selectedVariant, // Add selectedVariant to the config

                        // ============================================================================
                        // BASIC INFO
                        // ============================================================================
                        appName: apiData.appName || initialConfig.appName,
                        subdomain: apiData.subdomain || initialConfig.subdomain,

                        // ============================================================================
                        // CONTACT INFO
                        // ============================================================================
                        email: apiData.email || apiData.contactEmail || initialConfig.email,
                        supportEmail: apiData.supportEmail || apiData.contactEmail || initialConfig.supportEmail,
                        contactEmail: apiData.contactEmail || initialConfig.contactEmail,
                        adminEmail: apiData.adminEmail || initialConfig.adminEmail,

                        // ============================================================================
                        // AUTHENTICATION
                        // ============================================================================
                        googleWebClientId: apiData.googleWebClientId || initialConfig.googleWebClientId,

                        // ============================================================================
                        // DIGIO CONFIGURATION
                        // Backend stores in nested digioConfig object, so we extract from there
                        // digioCheck: 'beforePayment' or 'afterPayment'
                        // ============================================================================
                        digioCheck: apiData.digioConfig?.digioCheck || apiData.digioCheck || apiData.REACT_APP_DIGIO_CHECK || Config.REACT_APP_DIGIO_CHECK || 'beforePayment',
                        digioEnabled: apiData.digioConfig?.digioEnabled !== undefined
                            ? apiData.digioConfig.digioEnabled
                            : (apiData.digioEnabled !== undefined ? apiData.digioEnabled : true),
                        otpBasedAuthentication: apiData.digioConfig?.otpBasedAuthentication || apiData.otpBasedAuthentication || apiData.REACT_APP_OTP_BASED_AUTHENTICATION || false,
                        aadhaarBasedAuthentication: apiData.digioConfig?.aadhaarBasedAuthentication !== undefined
                            ? apiData.digioConfig.aadhaarBasedAuthentication
                            : true,

                        // ============================================================================
                        // FEATURE FLAGS
                        // Backend stores in nested featureFlags object
                        // ============================================================================
                        modelPortfolioEnabled: apiData.featureFlags?.modelPortfolioEnabled !== undefined
                            ? apiData.featureFlags.modelPortfolioEnabled
                            : (apiData.modelPortfolioEnabled !== undefined ? apiData.modelPortfolioEnabled : true),
                        bespokePlansEnabled: apiData.featureFlags?.bespokePlansEnabled !== undefined
                            ? apiData.featureFlags.bespokePlansEnabled
                            : (apiData.bespokePlansEnabled !== undefined ? apiData.bespokePlansEnabled : true),
                        brokerConnectEnabled: apiData.featureFlags?.brokerConnectEnabled !== undefined
                            ? apiData.featureFlags.brokerConnectEnabled
                            : true,

                        // ============================================================================
                        // PAYMENT CONFIGURATION
                        // ============================================================================
                        paymentPlatform: apiData.paymentPlatform || 'cashfree',
                        razorpayKey: apiData.razorpayKey || '',
                        cashfreeAppId: apiData.cashfreeAppId || '',

                        // ============================================================================
                        // BRANDING & THEME COLORS
                        // ============================================================================
                        themeColor: apiData.themeColor || initialConfig.themeColor,
                        logo: apiData.logo || initialConfig.logo,
                        toolbarlogo: apiData.toolbarlogo || initialConfig.toolbarlogo,
                        mainColor: apiData.mainColor || initialConfig.mainColor,
                        secondaryColor: apiData.secondaryColor || initialConfig.secondaryColor,
                        gradient1: apiData.gradient1 || initialConfig.gradient1,
                        gradient2: apiData.gradient2 || initialConfig.gradient2,
                        placeholderText: apiData.placeholderText || initialConfig.placeholderText,

                        // ============================================================================
                        // LAYOUT CONFIGURATION
                        // ============================================================================
                        homeScreenLayout: apiData.homeScreenLayout || initialConfig.homeScreenLayout,

                        // ============================================================================
                        // CARD STYLING
                        // Note: API uses camelCase (cardBorderWidth), static config uses CardborderWidth
                        // ============================================================================
                        CardborderWidth: apiData.cardBorderWidth ?? apiData.CardborderWidth ?? initialConfig.CardborderWidth,
                        cardElevation: apiData.cardElevation ?? initialConfig.cardElevation,
                        cardverticalmargin: apiData.cardVerticalMargin ?? apiData.cardverticalmargin ?? initialConfig.cardverticalmargin,

                        // ============================================================================
                        // BOTTOM TAB / NAVIGATION STYLING
                        // Note: API uses camelCase, static config uses mixed case
                        // ============================================================================
                        tabIconColor: apiData.tabIconColor || initialConfig.tabIconColor,
                        bottomTabBorderTopWidth: apiData.bottomTabBorderTopWidth ?? initialConfig.bottomTabBorderTopWidth,
                        bottomTabbg: apiData.bottomTabBg || apiData.bottomTabbg || initialConfig.bottomTabbg,
                        selectedTabcolor: apiData.selectedTabColor || apiData.selectedTabcolor || initialConfig.selectedTabcolor,

                        // ============================================================================
                        // BASKET COLORS (for stock basket cards)
                        // Note: API uses camelCase, static config uses lowercase
                        // ============================================================================
                        basket1: apiData.basket1 || initialConfig.basket1,
                        basket2: apiData.basket2 || initialConfig.basket2,
                        basketcolor: apiData.basketColor || apiData.basketcolor || initialConfig.basketcolor,
                        basketsymbolbg: apiData.basketSymbolBg || apiData.basketsymbolbg || initialConfig.basketsymbolbg,

                        // ============================================================================
                        // API KEYS (nested object) - API data takes priority
                        // ============================================================================
                        apiKeys: {
                            ...(initialConfig.apiKeys || {}),
                            ...(apiData.apiKeys || {}),
                        },

                        // ============================================================================
                        // PAYMENT MODAL UI CUSTOMIZATION
                        // ============================================================================
                        paymentModal: {
                            ...(initialConfig.paymentModal || {}),
                            ...(apiData.paymentModal || {}),
                        },

                        // ============================================================================
                        // EMPTY STATE UI COLORS
                        // ============================================================================
                        EmptyStateUi: {
                            ...(APP_VARIANTS.EmptyStateUi || {}),
                            ...(apiData.EmptyStateUi || apiData.emptyStateUi || {}),
                        },
                    };

                    console.log('✅ Using newConfig from API for APP_VARIANTS:', {
                        // Basic Info
                        appName: newConfig.appName,
                        subdomain: newConfig.subdomain,
                        // Theme & Branding
                        themeColor: newConfig.themeColor,
                        mainColor: newConfig.mainColor,
                        homeScreenLayout: newConfig.homeScreenLayout,
                        // Authentication
                        googleWebClientId: newConfig.googleWebClientId,
                        // Digio Config
                        digioCheck: newConfig.digioCheck,
                        digioEnabled: newConfig.digioEnabled,
                        // Feature Flags
                        modelPortfolioEnabled: newConfig.modelPortfolioEnabled,
                        bespokePlansEnabled: newConfig.bespokePlansEnabled,
                        // API Keys
                        advisorSpecificTag: newConfig.apiKeys?.advisorSpecificTag,
                        advisorRaCode: newConfig.apiKeys?.advisorRaCode,
                    });

                    setConfig(newConfig);
                }
            } catch (error) {
                console.error('Error fetching app config:', error);
                // Fallback to default config is already set in initial state
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []); // Empty dependency array - run only once on mount

    return (
        <ConfigContext.Provider value={{ ...config, configLoading: loading }}>
            {children}
        </ConfigContext.Provider>
    );
};
