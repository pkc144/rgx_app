import React, { memo } from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";

const CustomTabBar = memo(({ navigationState, jumpTo }) => {
  return (
    <View style={tabStyles.tabBarWrapper}>
      {navigationState.routes.map((route, idx) => {
        const isActive = navigationState.index === idx;
        return (
          <TouchableOpacity
            key={route.key}
            style={[
              tabStyles.tabItem,
              { backgroundColor: isActive ? "rgba(0, 86, 183, 1)" : "#F4F4F4" },
            ]}
            activeOpacity={0.9}
            onPress={() => jumpTo(route.key)}
          >
            <Text
              style={[
                tabStyles.tabLabel,
                { color: isActive ? "#FFFFFF" : "#808080" },
              ]}
            >
              {route.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

const tabStyles = StyleSheet.create({
  tabBarWrapper: {
    flexDirection: "row",
    marginVertical: 14,
    marginHorizontal:20,
    justifyContent: "center",
  },
  tabItem: {
    flex: 1,
    borderRadius: 3,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    marginHorizontal: 2,
  },
  tabLabel: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    textAlign: "center",
  },
});

export default CustomTabBar;
