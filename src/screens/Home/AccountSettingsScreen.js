/**
 * AccountSettingsScreen — container (Phase G batch 2, 2026-05-02)
 *
 * Owns: useTrade, useConfig, Firebase getAuth, APP_VARIANTS lookup,
 * feature-flag conditional logic (hide change manager), menu item
 * construction with navigation callbacks.
 * Renders presentation resolved from `screens.AccountSettingsScreen`.
 */

import React from 'react';
import { useConfig } from '../../context/ConfigContext';
import APP_VARIANTS from '../../utils/Config';
import {
    Link,
    BookPlus,
    GraduationCap,
    Receipt,
    Crown,
    Tags,
    LogOut,
    Bookmark,
} from 'lucide-react-native';
import { getAuth } from '@react-native-firebase/auth';
import Config from '../../utils/safeConfig';
import { useTrade } from '../TradeContext';
import { useComponent } from '../../design/useDesign';

const AccountSettingsScreen = ({ navigation }) => {
    const { userDetails } = useTrade();
    const config = useConfig();
    const selectedVariant = Config?.APP_VARIANT || 'rgxresearch';
    const validVariant = APP_VARIANTS[selectedVariant] ? selectedVariant : 'rgxresearch';
    const fallbackConfig = APP_VARIANTS[validVariant] || {};

    const showBackgroundLogo = config?.showBackgroundLogo !== false;
    const backgroundLogo = config?.backgroundLogo || config?.logo || fallbackConfig.logo;

    const auth = getAuth();
    const user = auth.currentUser;
    const imageUrl = user?.photoURL;

    const getInitials = name => {
        return name?.length > 0 ? name[0]?.toUpperCase() : '';
    };

    const handleMenuPress = screenName => {
        if (navigation?.navigate) {
            navigation.navigate(screenName);
        }
    };

    const menuItems = [
        {
            id: 'account',
            title: 'Account',
            items: [
                {
                    icon: Link,
                    label: 'Broker Account',
                    onPress: () => handleMenuPress('Broker Setting'),
                },
                {
                    icon: Crown,
                    label: 'My Subscription',
                    onPress: () => handleMenuPress('MySubscriptionsScreen'),
                },
                ...((() => {
                    const hideChangeManagerCodes = Config?.REACT_APP_HIDE_CHANGE_MANAGER_FOR_CODES
                        ?.split(',')
                        .map(code => code.trim().toUpperCase()) || [];
                    const currentCode = Config?.ADVISOR_RA_CODE?.toUpperCase() || '';
                    const shouldHide = Config?.REACT_APP_HIDE_CHANGE_MANAGER === 'true' ||
                        hideChangeManagerCodes.includes(currentCode);
                    return !shouldHide;
                })()
                    ? [
                        {
                            icon: Tags,
                            label: 'Change Manager',
                            onPress: () => handleMenuPress('Advisor Change'),
                        },
                    ]
                    : []),
            ],
        },
        {
            id: 'insights',
            title: 'Insights',
            items: [
                {
                    icon: BookPlus,
                    label: 'Research Report',
                    onPress: () => handleMenuPress('ResearchReportScreen'),
                },
                {
                    icon: Bookmark,
                    label: 'Watchlists',
                    onPress: () => handleMenuPress('WatchList'),
                },
                {
                    icon: Receipt,
                    label: 'My Invoices',
                    onPress: () => handleMenuPress('PaymentHistoryScreen'),
                },
                {
                    icon: GraduationCap,
                    label: 'Knowledge Hub',
                    onPress: () => handleMenuPress('KnowledgeHub'),
                },
            ],
        },
        {
            id: 'legal',
            title: 'Legal',
            items: [
                {
                    icon: Link,
                    label: 'Privacy Policy',
                    onPress: () => handleMenuPress('Privacy Policy'),
                },
                {
                    icon: Link,
                    label: 'Terms & Conditions',
                    onPress: () => handleMenuPress('Terms & Conditions'),
                },
                {
                    icon: LogOut,
                    label: 'Log Out',
                    onPress: () => handleMenuPress('Logout'),
                    isLogout: true,
                },
            ],
        },
    ];

    const gradientStart = config?.gradient1 || '#002651';
    const gradientEnd = config?.gradient2 || '#0056B7';

    const Presentation = useComponent('screens.AccountSettingsScreen');

    return (
        <Presentation
            viewModel={{
                userName: userDetails?.name,
                userEmail: userDetails?.email,
                imageUrl,
                userInitials: getInitials(userDetails?.name),
                menuItems,
                gradientStart,
                gradientEnd,
                showBackgroundLogo,
                backgroundLogo,
            }}
            actions={{
                onGoBack: () => navigation?.goBack(),
                onNavigateNotifications: () => navigation?.navigate('PushNotificationScreen'),
            }}
        />
    );
};

export default AccountSettingsScreen;
