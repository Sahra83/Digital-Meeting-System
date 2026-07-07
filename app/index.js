console.log("=> index.js is starting");
import 'react-native-gesture-handler';

import { registerRootComponent } from 'expo';

import App from './src/App';
console.log("=> App imported in index.js");

registerRootComponent(App);
console.log("=> registerRootComponent called");
