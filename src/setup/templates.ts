/**
 * Setup Wizard HTML Templates
 */

export function getSetupWizardHTML(step: number, data: any = {}): string {
  const steps = ['Backend', 'Database', 'Admin', 'Drives', 'Finish'];
  
  return `<!DOCTYPE html>
<html><head><title>Setup - Google Drive Index</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<style>body{background:#f5f5f5}.setup-container{max-width:800px;margin:50px auto}</style>
</head><body>
<div class="setup-container">
<div class="card shadow">
<div class="card-header bg-primary text-white"><h4>Setup Wizard - Step ${step}/5</h4></div>
<div class="card-body">
<div class="progress mb-4"><div class="progress-bar" style="width:${step*20}%">${step*20}%</div></div>
${getStepContent(step, data)}
</div></div></div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script>${getStepScript(step)}</script>
</body></html>`;
}

function getStepContent(step: number, data: any): string {
  switch(step) {
    case 1: return `<h5>Choose Configuration Backend</h5>
<div class="mb-3"><label class="form-label">Select Backend:</label>
<select class="form-select" id="backend">
<option value="static">Static (config.ts file)</option>
<option value="d1">Cloudflare D1 Database</option>
<option value="hyperdrive">HyperDrive (External DB)</option>
</select></div>
<div class="alert alert-info"><strong>Static:</strong> Simple, no database needed<br>
<strong>D1:</strong> Cloudflare's SQL database<br>
<strong>HyperDrive:</strong> Connect to PostgreSQL/MySQL</div>
<button class="btn btn-primary" onclick="submitStep1()">Next</button>`;

    case 2: return `<h5>Initialize Database</h5>
<div id="status" class="alert alert-info">Creating tables...</div>
<button class="btn btn-primary" onclick="initDB()">Initialize</button>`;

    case 3: return `<h5>Create Admin Account</h5>
<div class="mb-3"><label>Username</label>
<input type="text" class="form-control" id="username" value="admin"></div>
<div class="mb-3"><label>Password</label>
<input type="password" class="form-control" id="password"></div>
<div class="mb-3"><label>Site Name</label>
<input type="text" class="form-control" id="siteName" value="Google Drive Index"></div>
<button class="btn btn-primary" onclick="submitStep3()">Next</button>`;

    case 4: return `<h5>Add Google Drives</h5>
<div id="drives"></div>
<button class="btn btn-secondary" onclick="addDrive()">Add Drive</button>
<button class="btn btn-primary" onclick="submitStep4()">Next</button>`;

    case 5: return `<h5>Setup Complete!</h5>
<div class="alert alert-success">Your Google Drive Index is ready!</div>
<a href="/" class="btn btn-primary">Go to Homepage</a>
<a href="/admin" class="btn btn-secondary">Admin Panel</a>`;

    default: return '';
  }
}

function getStepScript(step: number): string {
  const base = `
async function post(url,data){
  const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  return r.json();
}`;

  switch(step) {
    case 1: return base + `
function submitStep1(){
  const backend=document.getElementById('backend').value;
  post('/setup/step1',{backend}).then(()=>location.href='/setup?step=2');
}`;

    case 2: return base + `
function initDB(){
  document.getElementById('status').textContent='Initializing...';
  post('/setup/step2',{}).then(r=>{
    if(r.success)location.href='/setup?step=3';
    else document.getElementById('status').textContent='Error: '+r.error;
  });
}
window.onload=()=>setTimeout(initDB,1000);`;

    case 3: return base + `
function submitStep3(){
  post('/setup/step3',{
    username:document.getElementById('username').value,
    password:document.getElementById('password').value,
    siteName:document.getElementById('siteName').value
  }).then(()=>location.href='/setup?step=4');
}`;

    case 4: return base + `
let driveCount=0;
function addDrive(){
  const html='<div class="mb-3"><input class="form-control mb-2" placeholder="Drive ID" id="did'+driveCount+'">'+
  '<input class="form-control" placeholder="Name" id="dname'+driveCount+'"></div>';
  document.getElementById('drives').innerHTML+=html;
  driveCount++;
}
function submitStep4(){
  const drives=[];
  for(let i=0;i<driveCount;i++){
    const id=document.getElementById('did'+i).value;
    const name=document.getElementById('dname'+i).value;
    if(id)drives.push({id,name});
  }
  post('/setup/step4',{drives}).then(()=>location.href='/setup?step=5');
}
addDrive();`;

    default: return base;
  }
}
