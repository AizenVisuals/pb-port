import {unlockAudio,menuMusic,setMuted,playSfx} from '../audio.js';
let enabled=true,ambient=true,unlocked=false;
try{enabled=localStorage.getItem('pulse-arena.sound')!=='off';}catch{}
function sync(){setMuted(!enabled);if(unlocked)menuMusic(enabled&&ambient&&!document.hidden);}
export function setMenuAmbient(value){ambient=value;sync();}
export function rewardSound(){if(enabled&&unlocked)playSfx('rb9_coins',.35);}
export function installAudioControls(){
 const checkbox=document.getElementById('sound-enabled');checkbox.checked=enabled;
 checkbox.onchange=()=>{enabled=checkbox.checked;try{localStorage.setItem('pulse-arena.sound',enabled?'on':'off');}catch{}sync();};
 document.addEventListener('pointerdown',()=>{if(!unlocked){unlockAudio();unlocked=true;sync();}},{once:true});
 document.addEventListener('visibilitychange',sync);sync();
}
