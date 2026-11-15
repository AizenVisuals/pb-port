import {OfflineBattle} from './battle.js';

/** Server-clocked lockstep. Both clients keep canonical left/right team order. */
export class ArenaBattle extends OfflineBattle {
  constructor(options={}) {super(options);this.send=options.send;this.onServerResult=options.onServerResult||(()=>{});}
  async connectMatch(match,playerName,trainer) {
    this.match=match;this.targetFrame=0;this.networkInputs=[];this.resultSent=false;this.serverEnded=false;
    const result=await this.start({team:match.team,botTeam:match.vs_bot?{mons:match.bot_team}:match.opponent_team,
      seed:match.seed,arena:match.arena,format:match.format,difficulty:match.bot_level||3,
      battleId:match.match_id,opponentName:match.opponent.nick,trainer,
      networkMatch:{...match,playerName}});
    if(result){this.state='waiting';this._emit();}
    return result;
  }
  command(input={}) {
    const count=this.pendingInputs.length;
    if(!super.command(input))return false;
    const command=this.pendingInputs.splice(count)[0];
    if(command)this.send({t:'input',match_id:this.match.match_id,...command});
    return !!command;
  }
  receive(msg) {
    if(msg.match_id && msg.match_id!==this.match?.match_id)return;
    if(msg.t==='go'){this.state='running';this._emit();}
    if(msg.t==='tick'&&!this.serverEnded) {
      if(!Number.isInteger(msg.upTo)||msg.upTo<this.targetFrame)return;
      this.networkInputs.push(...(msg.inputs||[]));this.targetFrame=msg.upTo;
      this._drain();
    }
    if(msg.t==='end'&&!this.serverEnded) {
      this.serverEnded=true;this.serverResult=msg;this.onServerResult(msg);
      super._finish(msg.winner,msg.forfeit?'forfeit':msg.winner===(this.playerSide||0)?'win':'loss');
    }
    if(msg.t==='cancelled'){this.serverEnded=true;this.state='error';this.onError(new Error(msg.reason==='result_mismatch'?'A partida divergiu e foi anulada, sem pontos.':'A partida foi cancelada.'));}
  }
  _drain() {
    if(!this.battle||this.resultSent||this.serverEnded)return;
    while(this.battle.frame<this.targetFrame&&!this.resultSent) {
      const inputs=[];
      this.networkInputs=this.networkInputs.filter(input=>{if(input.at<=this.battle.frame){inputs.push(input);return false;}return true;});
      this.pendingInputs.push(...inputs);super._step();
    }
    this.render?.();this.audio?.update?.(false);this._emit();
  }
  _finish(winner) {
    if(this.resultSent||this.serverEnded)return;
    this.resultSent=true;this.state='confirming';
    this.send({t:'result',match_id:this.match.match_id,winner});this._emit();
  }
  _startLoop() {
    if(this.raf||!this.battle)return;
    const tick=()=>{this.raf=0;if(this.serverEnded||!this.battle)return;this.render?.();this.audio?.update?.(false);this.raf=requestAnimationFrame(tick);};
    this.raf=requestAnimationFrame(tick);
  }
  pause(){this.onUpdate({...this.snapshot(),onlineMenu:true});}
  resume(){} // An online match never pauses its opponent.
  surrender(){this.send({t:'surrender',match_id:this.match.match_id});}
  _resetSteering(){this.keys?.clear();if(this.match&&!this.serverEnded&&this.state==='running')this.send({t:'input',match_id:this.match.match_id,kind:'steer',dir:0});}
  disconnected(){if(!this.serverEnded){this.serverEnded=true;this.state='error';this._stopLoop();this.onError(new Error('Conexão perdida. A partida online não pode ser pausada; consulte o histórico ao reconectar.'));}}
}
