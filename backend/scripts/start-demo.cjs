// Complete catch-up before accepting requests after a restart/deployment.
const {spawnSync, spawn} = require('node:child_process');
if (process.env.APP_MODE === 'demo') {
  const result = spawnSync(process.execPath, [require.resolve('./refresh-demo.cjs')], {stdio:'inherit',env:process.env});
  if (result.status !== 0) process.exit(result.status || 1);
}
const app = spawn(process.execPath, [require.resolve('next/dist/bin/next'),'start'], {stdio:'inherit',env:process.env});
for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>app.kill(signal));
app.on('exit',code=>process.exit(code ?? 1));
app.on('error',error=>{console.error(error);process.exit(1)});
