import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { StatusBar } from '@capacitor/status-bar';
const isNative = Capacitor.isNativePlatform();
window.PulseNative = {
  isNative,
  async signInGoogle() {
    const result=await FirebaseAuthentication.signInWithGoogle({skipNativeAuth:true});
    return result.credential;
  },
  async signOutGoogle() { await FirebaseAuthentication.signOut(); },
  exitApp() { if (isNative) return App.exitApp(); },
  async exportSave(data) {
    const file = await Filesystem.writeFile({path:'pulse-arena-progresso.json',data,directory:Directory.Cache,encoding:Encoding.UTF8});
    await Share.share({title:'Progresso PULSE ARENA',dialogTitle:'Salvar cópia do progresso',files:[file.uri]});
  },
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
