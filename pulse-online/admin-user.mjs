// Local bootstrap only. A Google account must already have signed in successfully.
import {openDb} from './db.mjs';
const [uid,action]=process.argv.slice(2);
if(!uid||!['grant','revoke'].includes(action)){console.error('Uso: DATA_DIR=/caminho node admin-user.mjs <user_id> grant|revoke');process.exit(1);}
const db=openDb(process.env.DATA_DIR||'./data');
try{const user=db.prepare('SELECT id,provider FROM users WHERE id=?').get(uid);if(!user||user.provider!=='google')throw new Error('Escolha um usuário Google já autenticado, nunca um convidado.');db.prepare('UPDATE users SET is_admin=? WHERE id=?').run(action==='grant'?1:0,uid);console.log(action==='grant'?'Permissão concedida.':'Permissão removida.');}finally{db.close();}
