"""Switch only the PB local process; preserve profiles and the running tunnel."""
from pathlib import Path
import os,signal,subprocess,time,json,urllib.request,shutil,datetime
home=Path.home()/'.local/share/pb-selfhost';new=home/'releases/20261115-controls-portraits-rooms'
def health():
 with urllib.request.urlopen('http://127.0.0.1:3015/api/health',timeout=3) as r:return json.load(r)
h=health()
if h['matches'] or h['online']:raise SystemExit('Players online; refusing restart during play')
pid=int((home/'server.pid').read_text());old=Path(os.readlink(f'/proc/{pid}/cwd'))
env=dict(os.environ)
for item in Path(f'/proc/{pid}/environ').read_bytes().split(b'\0'):
 if item.startswith(b'DATA_DIR='):env['DATA_DIR']=item.decode().split('=',1)[1]
if Path(env.get('DATA_DIR',''))!=home/'data':raise SystemExit('Unexpected DATA_DIR')
backup=home/'backups'/datetime.datetime.now().strftime('%Y%m%d-%H%M%S');backup.mkdir(parents=True,mode=0o700)
players=home/'data/players.json'
if players.exists():shutil.copy2(players,backup/'players.json');(backup/'players.json').chmod(0o600)
(backup/'previous-release.txt').write_text(str(old))
def start(release):
 with (home/'server.log').open('ab') as log:
  process=subprocess.Popen(['node','server/index.mjs','--host','127.0.0.1','--port','3015'],cwd=release,env=env,stdout=log,stderr=log,start_new_session=True)
 (home/'server.pid').write_text(str(process.pid));return process
os.kill(pid,signal.SIGTERM)
for _ in range(100):
 try:os.kill(pid,0)
 except ProcessLookupError:break
 time.sleep(.05)
process=start(new)
ready=False
for _ in range(100):
 try:
  if health()['ok']:ready=True;print('LIVE',new.name,'PID',process.pid);break
 except Exception:pass
 if process.poll() is not None:break
 time.sleep(.1)
if not ready:
 if process.poll() is None:process.terminate();process.wait(timeout=10)
 restore=start(old);raise SystemExit('New process failed; restored previous release PID '+str(restore.pid))
