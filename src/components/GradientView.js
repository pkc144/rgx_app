import React from 'react';
import {View, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

// Wraps LinearGradient in a View to fix layout/clipping issues on iOS Fabric (RN 0.78+).
// Use this as a drop-in replacement for LinearGradient when it's used as a container.
const GradientView = ({colors, start, end, locations, useAngle, angle, angleCenter, style, children, ...rest}) => {
  return (
    <View style={style} {...rest}>
      <LinearGradient
        colors={colors}
        start={start}
        end={end}
        locations={locations}
        useAngle={useAngle}
        angle={angle}
        angleCenter={angleCenter}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
};

export default GradientView;
