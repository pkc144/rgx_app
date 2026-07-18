/**
 * ============================================================================
 * whitelabel/appVariants — TENANT CONFIG ROOT (rgx_app fork)
 * ============================================================================
 *
 * 🔴 PER-FORK FILE. NOT BYTE-IDENTICAL ACROSS REPOS. 🔴
 *
 * The `APP_VARIANTS` map for tenants this repo ships. `src/utils/Config.js`
 * is the upstream-managed re-exporter (byte-identical across forks); this
 * file holds the actual values per repo.
 *
 * To add a new tenant, add an entry below. To create a fork (whitelabel
 * overlay), copy this file into the fork's `whitelabel/appVariants.js`
 * and edit. See `docs/WHITELABEL_RECIPE.md`.
 *
 * rgx_app note: this fork's own tenant (`rgxresearch`) keeps its full,
 * explicit config block (own logo + googleWebClientId for com.rgx.aq)
 * instead of the `sharedUIConfig` spread upstream uses for tenants it
 * doesn't ship — the spread's `SharedDefaultLogo` is ZamZam-branded and
 * would leak ZamZam branding into this app. Re-apply this block on every
 * upstream re-sync (see docs/CLAUDE_NAV or the fullsync commit history).
 * ============================================================================
 */

// SharedDefaultLogo is the fallback logo applied to every variant
// that doesn't explicitly override `logo`. The file at
// `src/assets/AppLogo/logo.png` is the ZamZam-branded logo (the
// asset is byte-identical to `src/assets/AppLogo/Zamzam.png`) — so
// any variant that inherits `sharedUIConfig` without overriding
// `logo` will display ZamZam branding. Variants which need their
// own brand MUST set `logo` and `toolbarlogo` explicitly (see
// `alphaquark` and `rgxresearch` below). The variable was previously
// named `ZamzamLogo`, which made the leak path visually obvious in
// code review but was misleading: this is the SHARED-CONFIG fallback
// logo, not a ZamZam-specific asset.
import SharedDefaultLogo from '../src/assets/AppLogo/logo.png';
import AlphaQuarkLogo from '../src/assets/logo.png';
import RGXLogo from '../src/assets/RGXResearchLogo.png';

// Shared UI config — theme, colors, layout
const sharedUIConfig = {
  themeColor: '#ff0000',
  logo: SharedDefaultLogo,
  toolbarlogo: SharedDefaultLogo,
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
  googleWebClientId: '892331696104-e26pu9iotqrjk1o6jq4ifd4e95fasil1.apps.googleusercontent.com',
};

// Per-advisor config: subdomain + advisorRaCode
// When copying the app for a new advisor, just add a new entry here.
const APP_VARIANTS = {
  alphaquark: {
    themeColor: '#0000ff',
    logo: AlphaQuarkLogo,
    toolbarlogo: AlphaQuarkLogo,
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
    googleWebClientId: '892331696104-e26pu9iotqrjk1o6jq4ifd4e95fasil1.apps.googleusercontent.com',
    subdomain: 'prod',
    advisorRaCode: 'ALPHAQUARK',
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
  zamzamcapital: {...sharedUIConfig, subdomain: 'zamzamcapital',   advisorRaCode: 'ZAMZAMCAPITAL'},
  // rgxresearch: this fork's own tenant — full explicit block (own brand
  // logo + Google Sign-In client id for com.rgx.aq), NOT the sharedUIConfig
  // spread. See file header note.
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
    advisorRaCode: 'RGXRESEARCH',
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
  arfs:          {...sharedUIConfig, subdomain: 'arfs',            advisorRaCode: 'ARFS'},
  magnus:        {...sharedUIConfig, subdomain: 'zamzamcapital',   advisorRaCode: 'ZAMZAMCAPITAL'},

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
