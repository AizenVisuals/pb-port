import { spawnSync } from 'node:child_process';
import { mkdirSync, copyFileSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url).pathname;
function run(command, args, cwd = root, env = process.env) {
  const result = spawnSync(command, args, { cwd, env, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
run('node', ['scripts/package-android.mjs']);
run('npx', ['cap', 'sync', 'android']);
const env = { ...process.env };
if (env.HTTPS_PROXY) {
  const proxy = new URL(env.HTTPS_PROXY);
  env.GRADLE_OPTS = `${env.GRADLE_OPTS || ''} -Dhttps.proxyHost=${proxy.hostname} -Dhttps.proxyPort=${proxy.port || 80} -Dhttp.proxyHost=${proxy.hostname} -Dhttp.proxyPort=${proxy.port || 80}`;
}
run('./gradlew', ['--no-daemon', '--max-workers=2', 'assembleDebug'], root + 'android', env);
const out = process.env.PULSE_ARTIFACT_DIR || root + 'artifacts';
mkdirSync(out, { recursive: true });
const apk = out + '/PULSE-ARENA-debug.apk';
copyFileSync(root + 'android/app/build/outputs/apk/debug/app-debug.apk', apk);
writeFileSync(apk + '.sha256', createHash('sha256').update(readFileSync(apk)).digest('hex') + '  PULSE-ARENA-debug.apk\n');
console.log('APK: ' + apk);
