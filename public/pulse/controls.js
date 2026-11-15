/** Each finger owns its control; secondary touches never steal the movement stick. */
export function bindBattleControls({surface, stick, knob, getSnapshot, command}) {
  let stickPointer = null;
  const pressed = new Map();
  const actionFor = button => {
    if (!button || button.disabled) return null;
    if (button.dataset.move !== undefined) return {kind:'move',index:Number(button.dataset.move)};
    if (button.dataset.switch !== undefined) return {kind:'switch',to:Number(button.dataset.switch)};
    const kind = {'battle-auto':'manual','battle-guard':'guard','battle-dodge':'dodge','battle-mega':'mega'}[button.id];
    return kind ? {kind} : null;
  };
  const resetStick = () => {
    const id = stickPointer;
    stickPointer = null;
    knob.style.transform = '';
    if (id !== null) {
      command({kind:'steer',dir:0});
      if (stick.hasPointerCapture(id)) stick.releasePointerCapture(id);
    }
  };
  const steer = event => {
    if (event.pointerId !== stickPointer) return;
    if (!getSnapshot()?.manual || getSnapshot()?.state !== 'running') { resetStick(); return; }
    event.preventDefault();
    const r = stick.getBoundingClientRect();
    const x = event.clientX-r.left-r.width/2, y = event.clientY-r.top-r.height/2;
    const distance = Math.hypot(x,y), scale = Math.min(1,30/(distance || 1));
    knob.style.transform = `translate(${x*scale}px,${y*scale}px)`;
    command({kind:'steer',dir:distance<10 ? 0 : 1+((Math.round(Math.atan2(y,x)/(Math.PI/4))+8)%8)});
  };
  const down = event => {
    if (event.button !== 0 || stickPointer !== null || !getSnapshot()?.manual || getSnapshot()?.state !== 'running') return;
    event.preventDefault();
    stickPointer = event.pointerId;
    stick.setPointerCapture(event.pointerId);
    steer(event);
  };
  const end = event => { if (event.pointerId === stickPointer) resetStick(); };
  const actionDown = event => {
    if (event.button !== 0 || getSnapshot()?.state !== 'running') return;
    const button = event.target.closest('button');
    const action = actionFor(button);
    if (!action) return;
    event.preventDefault();
    pressed.set(event.pointerId, button);
    button.classList.add('is-pressed');
    button.setPointerCapture(event.pointerId);
    command(action);
    if (action.kind === 'manual') resetStick();
  };
  const actionEnd = event => {
    const button = pressed.get(event.pointerId);
    if (!button) return;
    pressed.delete(event.pointerId);
    if (![...pressed.values()].includes(button)) button.classList.remove('is-pressed');
    if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId);
  };
  // Keyboard/assistive clicks still work. Physical pointer clicks already fired on down.
  const click = event => {
    const action = actionFor(event.target.closest('button'));
    if (!action) return;
    event.preventDefault();
    if (event.detail === 0) { command(action); if (action.kind === 'manual') resetStick(); }
  };
  const reset = () => {
    resetStick();
    for (const pointerId of [...pressed.keys()]) actionEnd({pointerId});
  };
  const visibility = () => { if (surface.ownerDocument.hidden) reset(); };
  const bindings = [
    [stick,'pointerdown',down],[stick,'pointermove',steer],
    ...['pointerup','pointercancel','lostpointercapture'].map(name=>[stick,name,end]),
    [surface,'pointerdown',actionDown],[surface,'click',click],
    ...['pointerup','pointercancel','lostpointercapture'].map(name=>[surface,name,actionEnd]),
    [surface.ownerDocument.defaultView,'blur',reset],
    [surface.ownerDocument,'visibilitychange',visibility],
  ];
  for (const [target,type,handler] of bindings) target.addEventListener(type,handler);
  return () => { reset(); for (const [target,type,handler] of bindings) target.removeEventListener(type,handler); };
}
