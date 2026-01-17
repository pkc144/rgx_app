import React, {useState} from 'react';
import {View, StyleSheet} from 'react-native';
import Svg, {Defs, LinearGradient as SvgLinearGradient, Stop, Rect} from 'react-native-svg';

/**
 * SVGGradient - A drop-in replacement for react-native-linear-gradient
 * that works with iOS Fabric/New Architecture using react-native-svg
 *
 * @param {Array} colors - Array of color strings (e.g., ['#1A358C', '#2D5CF2'])
 * @param {Object} start - Start point {x: 0, y: 0} (0-1 range)
 * @param {Object} end - End point {x: 1, y: 1} (0-1 range)
 * @param {Array} locations - Optional array of color stop positions (0-1 range)
 * @param {Object} style - Style object for the container
 * @param {React.ReactNode} children - Child components
 */
const SVGGradient = ({
  colors = ['#0076FB', '#002651'],
  start = {x: 0, y: 0},
  end = {x: 1, y: 0},
  locations,
  style,
  children,
}) => {
  const [dimensions, setDimensions] = useState({width: 0, height: 0});

  // Generate unique ID for gradient
  const gradientId = React.useId ? React.useId() : `grad_${Math.random().toString(36).substr(2, 9)}`;

  // Calculate stop positions
  const getStopOffset = (index, total) => {
    if (locations && locations[index] !== undefined) {
      return locations[index];
    }
    return index / (total - 1);
  };

  const onLayout = (event) => {
    const {width, height} = event.nativeEvent.layout;
    setDimensions({width, height});
  };

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      {dimensions.width > 0 && dimensions.height > 0 && (
        <Svg
          width={dimensions.width}
          height={dimensions.height}
          style={styles.svgBackground}>
          <Defs>
            <SvgLinearGradient
              id={gradientId}
              x1={`${start.x * 100}%`}
              y1={`${start.y * 100}%`}
              x2={`${end.x * 100}%`}
              y2={`${end.y * 100}%`}>
              {colors.map((color, index) => (
                <Stop
                  key={index}
                  offset={getStopOffset(index, colors.length)}
                  stopColor={color}
                  stopOpacity="1"
                />
              ))}
            </SvgLinearGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width={dimensions.width}
            height={dimensions.height}
            fill={`url(#${gradientId})`}
          />
        </Svg>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  svgBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default SVGGradient;
