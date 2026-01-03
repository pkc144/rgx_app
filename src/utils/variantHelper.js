import Config from './safeConfig';
import APP_VARIANTS from './Config';

export const getAdvisorSubdomain = () => {
  const selectedVariant = Config?.APP_VARIANT || 'alphaquark';
  const variantConfig = APP_VARIANTS[selectedVariant] || APP_VARIANTS['alphaquark'] || {};

  // Return subdomain if exists, otherwise default to 'common'
  return variantConfig?.subdomain || 'common';
};

export const getGoogleWebClientId = () => {
  const selectedVariant = Config?.APP_VARIANT || 'alphaquark';
  const variantConfig = APP_VARIANTS[selectedVariant] || APP_VARIANTS['alphaquark'] || {};

  // Return googleWebClientId if exists, otherwise return a default/fallback
  return (
    variantConfig?.googleWebClientId ||
    '892331696104-e26pu9iotqrjk1o6jq4ifd4e95fasil1.apps.googleusercontent.com' // Default fallback
  );
};
