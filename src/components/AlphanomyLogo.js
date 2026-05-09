/**
 * AlphanomyLogo — JS-drawn brand mark for the alphanomy variant.
 *
 * Mirrors the gradient logo used by `designs/alphanomy/screens/_AppHeader.js`
 * (a brand-blue → purple gradient square containing a white skewed bolt
 * shape). Drawn from primitives so we don't need a PNG asset checked into
 * the repo — Alphanomy doesn't yet ship a finalized logo file.
 *
 * Sized via the `size` prop (square). Pass `style` to add positioning,
 * margins, etc.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const ALPHANOMY_GRADIENT = ['#1246F0', '#7C3AED'];

const AlphanomyLogo = ({ size = 56, style }) => {
    // Bolt is ~45% the height of the mark so it reads at small sizes.
    const boltH = Math.round(size * 0.45);
    const boltW = Math.max(2, Math.round(boltH * 0.32));
    const radius = Math.round(size * 0.22);

    return (
        <View style={[{ width: size, height: size }, style]}>
            <LinearGradient
                colors={ALPHANOMY_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.frame, { borderRadius: radius }]}
            >
                <View
                    style={[
                        styles.bolt,
                        { width: boltW, height: boltH },
                    ]}
                />
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    frame: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bolt: {
        backgroundColor: '#FFFFFF',
        transform: [{ skewY: '-12deg' }],
        borderRadius: 2,
    },
});

export default AlphanomyLogo;
