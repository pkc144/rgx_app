module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-worklets/plugin',
    ['dotenv-import', {
      moduleName: '@env',
      path: '.env',
    }],
  ],
};
