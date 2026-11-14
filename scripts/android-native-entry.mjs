import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { StatusBar } from '@capacitor/status-bar';
const isNative = Capacitor.isNativePlatform();
window.PulseNative = {
  isNative,
  async setBattleMode(battle) {
    if (!isNative) return;
    await ScreenOrientation.lock({ orientation: 'landscape' }).catch(console.warn);
    await (battle ? StatusBar.hide() : StatusBar.show()).catch(console.warn);
  },
};
if (isNative) {
  App.addListener('appStateChange', ({ isActive }) => window.dispatchEvent(new CustomEvent(isActive ? 'pulse-native-resume' : 'pulse-native-pause')));
  App.addListener('backButton', () => {
    window.dispatchEvent(new CustomEvent('pulse-native-back', { cancelable: true }));
  });
  window.PulseNative.setBattleMode(false);
}
