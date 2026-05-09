/**
 * ============================================================================
 * whitelabel/appVariants — TENANT CONFIG ROOT (rgx_app fork)
 * ============================================================================
 *
 * 🔴 PER-FORK FILE. NOT BYTE-IDENTICAL ACROSS REPOS. 🔴
 *
 * The `APP_VARIANTS` map for tenants this fork ships. `src/utils/Config.js`
 * is the upstream-managed re-exporter (byte-identical across forks); this
 * file holds the actual values per repo.
 *
 * Migrated from `src/utils/Config.js` on 2026-05-10 (Phase 0 of the
 * src/-byte-identical sync; see `docs/SYNC_PLAN.md`).
 *
 * To add a new tenant, add an entry below. See
 * `docs/WHITELABEL_RECIPE.md` for the full contract.
 * ============================================================================
 */

import ARFSLogo from '../src/assets/ARFS_Black.svg';
import ARFSLogotool from '../src/assets/ARFS_FINAL3.svg';
import MagnusLogo from '../src/assets/logo.png';
import RGXLogo from '../src/assets/RGXResearchLogo.jpg';
import ZamzamLogo from '../src/assets/AppLogo/logo.png';

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
    basketcolor: '#721E30',
    basketsymbolbg: '#8D2952',
    basket1: '#9D2115',
    basket2: '#6B1207',
    subdomain: "magnus",
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
    basketcolor: '#721E30',
    basketsymbolbg: '#8D2952',
    basket1: '#9D2115',
    basket2: '#6B1207',
    subdomain: 'prod',
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
    logo: RGXLogo,
    toolbarlogo: RGXLogo,
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
    basketcolor: '#721E30',
    basketsymbolbg: '#8D2952',
    basket1: '#9D2115',
    basket2: '#6B1207',
    subdomain: 'rgxresearch',
    // Google Sign-In Web Client ID (from google-services.json for com.rgx.aq)
    googleWebClientId: '887826618956-83tfceb7n4m4h38qk93ld1emb78uj5rh.apps.googleusercontent.com',
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
    themeColor: '#ff0000',
    logo: ZamzamLogo,
    toolbarlogo: ZamzamLogo,
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
    backgroundColor: '#6B1400',
    darkerColor: '#3A0B00',
    mediumColor: '#4D2418',
    brighterColor: '#8B2500',
    mutedColor: '#5A3327',
    lightColor: '#F8E8E5',
    mediumLightShade: '#F5DDD8',
    lightWarmColor: '#E4F1FE',
  },
};

export default APP_VARIANTS;
