import ARFSLogo from '../assets/ARFS_Black.svg';
import ARFSLogotool from '../assets/ARFS_FINAL3.svg';
import MagnusLogo from '../assets/logo.png';
import ZamzamLogo from '../assets/AppLogo/logo.png';

const APP_VARIANTS = {
  arfs: {
    themeColor: '#ff0000',
    logo: ARFSLogo,
    toolbarlogo: ARFSLogotool,
    homeScreenLayout: 'layout1',
    mainColor: '#0D021F',
    secondaryColor: '#3D0E55',
    gradient1: '#F0F0F0',
    gradient2: '#773D9A',
    placeholderText: '#B893F1',
    CardborderWidth: 1.5,
    cardElevation: 0,
    basket1: '#6A29CA',
    basket2: '#4F0A9E',
    cardverticalmargin: 3,
    tabIconColor: '#fff',
    bottomTabBorderTopWidth: 0,
    bottomTabbg: '#242424',
    selectedTabcolor: '#8555EF',
    basketcolor: '#600CC0',
    basketsymbolbg: '#6D0DD6',
    subdomain: 'arfs',
  },
  magnus: {
    themeColor: '#0000ff',
    logo: MagnusLogo,
    toolbarlogo: MagnusLogo,
    homeScreenLayout: 'layout2',
    mainColor: '#4CAAA0',
    secondaryColor: '#F0F0F0',
    gradient1: '#F0F0F0',
    gradient2: '#F0F0F0',
    placeholderText: '#FFFFFF',
    CardborderWidth: 0,
    cardElevation: 3,
    cardverticalmargin: 3,
    tabIconColor: '#000',
    bottomTabBorderTopWidth: 1.5,
    bottomTabbg: '#fff',
    selectedTabcolor: '#000',
    basketcolor: '#721E30', //#8D2952
    basketsymbolbg: '#8D2952',
    basket1: '#9D2115',
    basket2: '#6B1207',
    subdomain: "magnus",
    // Payment Modal Colors
    paymentModal: {
      headerBg: '#0056B7',
      stepActiveColor: '#0056B7',
      stepCompletedColor: '#29A400',
      buttonPrimaryBg: '#0056B7',
      buttonSecondaryBg: '#0056B7',
      accentColor: '#0056B7',
      checkboxActiveColor: '#29A400',
      linkColor: '#0056B7',
      progressBarColor: '#0056B7',
    },
  },
  alphaquark: {
    themeColor: '#0000ff',
    logo: MagnusLogo,
    toolbarlogo: MagnusLogo,
    homeScreenLayout: 'layout2',
    mainColor: '#4CAAA0',
    secondaryColor: '#F0F0F0',
    gradient1: '#F0F0F0',
    gradient2: '#F0F0F0',
    placeholderText: '#FFFFFF',
    CardborderWidth: 0,
    cardElevation: 3,
    cardverticalmargin: 3,
    tabIconColor: '#000',
    bottomTabBorderTopWidth: 1.5,
    bottomTabbg: '#fff',
    selectedTabcolor: '#000',
    basketcolor: '#721E30', //#8D2952
    basketsymbolbg: '#8D2952',
    basket1: '#9D2115',
    basket2: '#6B1207',
    subdomain: 'prod',
    // Payment Modal Colors
    paymentModal: {
      headerBg: '#0056B7',
      stepActiveColor: '#0056B7',
      stepCompletedColor: '#29A400',
      buttonPrimaryBg: '#0056B7',
      buttonSecondaryBg: '#0056B7',
      accentColor: '#0056B7',
      checkboxActiveColor: '#29A400',
      linkColor: '#0056B7',
      progressBarColor: '#0056B7',
    },
  },
  rgxresearch: {
    themeColor: '#0000ff',
    logo: MagnusLogo,
    toolbarlogo: MagnusLogo,
    homeScreenLayout: 'layout2',
    mainColor: '#4CAAA0',
    secondaryColor: '#F0F0F0',
    gradient1: '#F0F0F0',
    gradient2: '#F0F0F0',
    placeholderText: '#FFFFFF',
    CardborderWidth: 0,
    cardElevation: 3,
    cardverticalmargin: 3,
    tabIconColor: '#000',
    bottomTabBorderTopWidth: 1.5,
    bottomTabbg: '#fff',
    selectedTabcolor: '#000',
    basketcolor: '#721E30', //#8D2952
    basketsymbolbg: '#8D2952',
    basket1: '#9D2115',
    basket2: '#6B1207',
    subdomain: 'rgxresearch',
    // Payment Modal Colors
    paymentModal: {
      headerBg: '#0056B7',
      stepActiveColor: '#0056B7',
      stepCompletedColor: '#29A400',
      buttonPrimaryBg: '#0056B7',
      buttonSecondaryBg: '#0056B7',
      accentColor: '#0056B7',
      checkboxActiveColor: '#29A400',
      linkColor: '#0056B7',
      progressBarColor: '#0056B7',
    },
  },

  zamzamcapital: {
//    themeColor: '#ff0000',
   // logo: ZamzamLogo,
  //  toolbarlogo: ZamzamLogo,
    homeScreenLayout: 'layout1',
    mainColor: '#0D021F',
    secondaryColor: '#ffffff',
    gradient1: '#F0F0F0',
    gradient2: '#773D9A',
    placeholderText: '#B893F1',
    CardborderWidth: 1.5,
    cardElevation: 0,
    basket1: '#6A29CA',
    basket2: '#4F0A9E',
    cardverticalmargin: 3,
    tabIconColor: '#fff',
    bottomTabBorderTopWidth: 0,
    bottomTabbg: '#242424',
    selectedTabcolor: '#8555EF',
    basketcolor: '#600CC0',
    basketsymbolbg: '#6D0DD6',
    subdomain: 'zamzamcapital',
  },

  EmptyStateUi: {
    backgroundColor: '#6B1400', // Main reference color
    darkerColor: '#3A0B00', // Darker shade of reference color
    mediumColor: '#4D2418', // Medium shade of reference color
    brighterColor: '#8B2500', // Brighter shade of reference color
    mutedColor: '#5A3327', // Muted shade of reference color
    lightColor: '#F8E8E5', // Light shade of reference color
    mediumLightShade: '#F5DDD8', // Medium light shade of reference color
    lightWarmColor: '#E4F1FE', // Light warm background
  },
};

export default APP_VARIANTS;
