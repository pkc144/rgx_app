/**
 * BrandLogo — variant-aware brand-mark renderer.
 *
 * Drop-in replacement for places that historically rendered the
 * legacy AlphaQuark / Zamzam PNG via `<Image source={...}>`. On the
 * alphanomy fork (`DESIGN_VARIANT=alphanomy`) we render the JS-drawn
 * `<AlphanomyLogo>` instead — the alphanomy variant doesn't ship a
 * finalized PNG and the gradient mark is what `designs/alphanomy/`
 * uses everywhere else (`_AppHeader`, profile card, etc.).
 *
 * Other variants render `<Image source={source}>` exactly as before
 * — no behavioural change.
 *
 * Usage:
 *   import BrandLogo from '.../BrandLogo';
 *   import LegacyLogo from '../assets/logo.png';
 *   <BrandLogo source={LegacyLogo} size={150} style={...} />
 */

import React from 'react';
import { Image } from 'react-native';
import Config from '../utils/safeConfig';
import AlphanomyLogo from './AlphanomyLogo';

const BrandLogo = ({ source, size = 56, style, resizeMode = 'contain' }) => {
    const variant = Config?.DESIGN_VARIANT;
    if (variant === 'alphanomy') {
        return <AlphanomyLogo size={size} style={style} />;
    }
    return (
        <Image
            source={source}
            style={[{ width: size, height: size }, style]}
            resizeMode={resizeMode}
        />
    );
};

export default BrandLogo;
