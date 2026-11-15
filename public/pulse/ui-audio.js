import {unlockAudio,menuMusic,setMuted,playSfx} from '../audio.js';
let pulseContext,pulseGain;
let enabled=true,ambient=true,unlocked=false;
try{enabled=localStorage.getItem('pulse-arena.sound')!=='off';}catch{}
function sync(){if(pulseGain)pulseGain.gain.value=enabled?1:0;setMuted(!enabled);if(unlocked)menuMusic(enabled&&ambient&&!document.hidden);}
export function setMenuAmbient(value){ambient=value;sync();}
export function rewardSound(){if(enabled&&unlocked)playSfx('rb9_coins',.35);}
export function installAudioControls(){
 const checkbox=document.getElementById('sound-enabled');checkbox.checked=enabled;
 checkbox.onchange=()=>{enabled=checkbox.checked;try{localStorage.setItem('pulse-arena.sound',enabled?'on':'off');}catch{}sync();};
 document.addEventListener('pointerdown',()=>{if(!unlocked){unlockAudio();unlocked=true;sync();}},{once:true});
 document.addEventListener('visibilitychange',sync);sync();
}

const pulseBuffers=new Map();
function unlockPulseAudio(){try{pulseContext||=new AudioContext();if(!pulseGain){pulseGain=pulseContext.createGain();pulseGain.connect(pulseContext.destination);}pulseGain.gain.value=enabled?1:0;pulseContext.resume().catch(()=>{});}catch{}}
export async function playPulseSound(kind){
 if(!enabled||!unlocked)return;
 const file={item:'item-plim',evolution:'evolution',evolved:'evolution-end'}[kind];if(!file)return;
 unlockPulseAudio();if(!pulseContext)return;
 try{if(!pulseBuffers.has(file))pulseBuffers.set(file,fetch(`/pulse/assets/audio/${file}.wav`).then(r=>r.arrayBuffer()).then(b=>pulseContext.decodeAudioData(b)));const buffer=await pulseBuffers.get(file);if(!enabled)return;const source=pulseContext.createBufferSource();source.buffer=buffer;source.connect(pulseGain);source.start();}catch{}
}
document.addEventListener('pointerdown',unlockPulseAudio,{once:true});
