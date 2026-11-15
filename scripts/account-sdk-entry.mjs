import {initializeApp,getApps} from 'firebase/app';
import {getAuth,GoogleAuthProvider,onAuthStateChanged,signInWithPopup,signInWithCredential,signOut} from 'firebase/auth';

export function initializeAccount(config) {
  const app=getApps().find(app=>app.name==='pulse-account')||initializeApp(config,'pulse-account');
  const auth=getAuth(app);
  auth.languageCode='pt-BR';
  const provider=new GoogleAuthProvider();
  provider.setCustomParameters({prompt:'select_account'});
  return {
    subscribe(listener){return onAuthStateChanged(auth,user=>listener(user ? {uid:user.uid,name:user.displayName||'Treinador',email:user.email||''} : null));},
    async signIn(){
      if(window.PulseNative?.isNative){
        const tokens=await window.PulseNative.signInGoogle();
        if(!tokens?.idToken)throw new Error('O Google não retornou a credencial. Tente novamente.');
        return signInWithCredential(auth,GoogleAuthProvider.credential(tokens.idToken,tokens.accessToken));
      }
      return signInWithPopup(auth,provider);
    },
    async signOut(){
      // Clear native provider before the persisted Firebase session, so failures are visible.
      if(window.PulseNative?.isNative)await window.PulseNative.signOutGoogle();
      await signOut(auth);
    },
    // Firebase ID Token (RS256) para o servidor pulse-online trocar por um
    // token de sessão. O chamador usa e descarta; nunca é guardado.
    async getIdToken(){
      const user=auth.currentUser;
      return user?user.getIdToken():null;
    },
  };
}
