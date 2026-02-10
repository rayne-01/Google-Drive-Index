export function getAdminLoginHTML(): string {
  return `<!DOCTYPE html><html><head><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><title>Admin Login</title>
<link href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css' rel=stylesheet>
<link rel=stylesheet href='https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css'>
<style>body{min-height:100vh;display:flex;align-items:center;background:#1e293b;font-family:'Segoe UI',system-ui,sans-serif}.login-card{max-width:400px;margin:auto;background:#fff;border-radius:16px;padding:40px;box-shadow:0 20px 60px rgba(0,0,0,.3)}.logo-icon{width:64px;height:64px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;color:#fff;font-size:28px}</style>
</head><body><div class=login-card>
<div class=logo-icon><i class='bi bi-shield-lock-fill'></i></div>
<h4 class='text-center mb-1'>Admin Panel</h4>
<p class='text-center text-muted mb-4'>Sign in to manage your drives</p>
<div id=error class='alert alert-danger d-none small'></div>
<form id=f><div class=mb-3><label class='form-label fw-semibold small text-uppercase text-muted'>Username</label><input type=text class='form-control form-control-lg' name=username required autofocus placeholder='Enter username'></div>
<div class=mb-3><label class='form-label fw-semibold small text-uppercase text-muted'>Password</label><input type=password class='form-control form-control-lg' name=password required placeholder='Enter password'></div>
<button type=submit class='btn btn-primary btn-lg w-100 mt-2'>Sign In <i class='bi bi-arrow-right'></i></button></form>
</div>
<script>document.getElementById('f').onsubmit=async(e)=>{e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;b.innerHTML='Signing in...';try{const r=await fetch('/admin/login',{method:'POST',body:new FormData(e.target)});const d=await r.json();if(d.ok)location.reload();else{document.getElementById('error').textContent=d.error;document.getElementById('error').classList.remove('d-none')}}finally{b.disabled=false;b.innerHTML='Sign In <i class="bi bi-arrow-right"></i>'}}</script></body></html>`;
}

export function getAdminDashboardHTML(origin: string): string {
  const redirectUri = origin + '/google_callback';
  return `<!DOCTYPE html><html><head><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><title>Admin Panel</title>
<link href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css' rel=stylesheet>
<link rel=stylesheet href='https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css'>
<style>
*{box-sizing:border-box}
body{background:#f1f5f9;margin:0;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#334155}
.sb{background:#0f172a;width:260px;min-height:100vh;position:fixed;top:0;left:0;z-index:100;transition:width .2s;overflow:hidden;display:flex;flex-direction:column}
.sb.collapsed{width:64px}
.sb .brand{padding:20px 16px;display:flex;align-items:center;gap:12px;border-bottom:1px solid rgba(255,255,255,.06)}
.sb .brand-icon{width:36px;height:36px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;flex-shrink:0}
.sb .brand h5{color:#f8fafc;margin:0;font-size:16px;font-weight:600;white-space:nowrap}
.sb .brand small{color:#64748b;font-size:11px}
.sb.collapsed .brand h5,.sb.collapsed .brand small,.sb.collapsed .nav-text,.sb.collapsed .sb-footer .btn-text{display:none}
.sb .nav-section{padding:12px 0;flex:1;overflow-y:auto}
.sb .nav-section .nav-label{padding:8px 20px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#475569}
.sb .nav-link{color:#94a3b8;padding:10px 16px;margin:1px 8px;border-radius:8px;display:flex;align-items:center;gap:12px;text-decoration:none;font-size:14px;font-weight:500;transition:all .15s}
.sb .nav-link:hover{color:#e2e8f0;background:rgba(255,255,255,.04)}
.sb .nav-link.active{color:#fff;background:rgba(59,130,246,.15);border-left:3px solid #3b82f6}
.sb .nav-link i{font-size:18px;width:22px;text-align:center;flex-shrink:0;opacity:.7}
.sb .nav-link.active i{opacity:1;color:#3b82f6}
.sb-footer{padding:16px;border-top:1px solid rgba(255,255,255,.06)}
.sb-footer a{display:flex;align-items:center;gap:8px;color:#94a3b8;text-decoration:none;font-size:13px;padding:8px 12px;border-radius:6px;transition:.15s}
.sb-footer a:hover{color:#e2e8f0;background:rgba(255,255,255,.04)}
.sb-toggle{position:absolute;top:20px;right:-14px;width:28px;height:28px;border-radius:50%;background:#fff;border:1px solid #e2e8f0;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:101;box-shadow:0 2px 8px rgba(0,0,0,.1);font-size:12px;color:#64748b;transition:transform .2s}
.sb.collapsed .sb-toggle{transform:rotate(180deg)}
.main{margin-left:260px;padding:32px;min-height:100vh;transition:margin-left .2s}
.main.expanded{margin-left:64px}
.page-header{margin-bottom:24px;display:flex;justify-content:space-between;align-items:center}
.page-header h4{font-weight:700;font-size:22px;color:#1e293b;margin:0}
.card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.04);margin-bottom:16px}
.card-header{background:transparent;border-bottom:1px solid #f1f5f9;padding:16px 20px;font-weight:600;font-size:14px}
.card-body{padding:20px}
.stat-card{border-left:4px solid;border-radius:12px;transition:transform .15s}
.stat-card:hover{transform:translateY(-2px)}
.stat-card .stat-value{font-size:28px;font-weight:700;line-height:1.2}
.stat-card .stat-label{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#64748b}
.table{font-size:14px;margin:0}
.table th{font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#64748b;border-bottom:2px solid #f1f5f9;padding:12px 16px}
.table td{padding:12px 16px;vertical-align:middle;border-color:#f8fafc}
.table tbody tr:hover{background:#f8fafc}
.badge{font-weight:500;font-size:11px;padding:4px 8px}
#tc{position:fixed;top:20px;right:20px;z-index:9999}
@media(max-width:768px){.sb{width:64px}.sb .nav-text,.sb .brand h5,.sb .brand small,.sb-footer .btn-text{display:none}.main{margin-left:64px}}
</style></head><body>
<div id=tc></div>
<div class=sb id=sidebar>
<div class=sb-toggle onclick=toggleSidebar()><i class="bi bi-chevron-left"></i></div>
<div class=brand><div class=brand-icon><i class="bi bi-grid-fill"></i></div><div><h5>Drive Index</h5><small>Administration</small></div></div>
<div class=nav-section>
<div class=nav-label>Main</div>
<a class="nav-link active" href=# data-tab=dashboard><i class="bi bi-speedometer2"></i><span class=nav-text>Dashboard</span></a>
<a class="nav-link" href=# data-tab=credentials><i class="bi bi-shield-lock"></i><span class=nav-text>Credentials</span></a>
<a class="nav-link" href=# data-tab=drives><i class="bi bi-hdd-network"></i><span class=nav-text>Drives</span></a>
<a class="nav-link" href=# data-tab=sa><i class="bi bi-file-earmark-lock"></i><span class=nav-text>Service Accounts</span></a>
<a class="nav-link" href=# data-tab=config><i class="bi bi-gear"></i><span class=nav-text>Configuration</span></a>
<a class="nav-link" href=# data-tab=google-login><i class="bi bi-google"></i><span class=nav-text>Google Login</span></a>
<a class="nav-link" href=# data-tab=security><i class="bi bi-lock"></i><span class=nav-text>Security</span></a>
</div>
<div class=sb-footer>
<a href=/ target=_blank><i class="bi bi-box-arrow-up-right"></i><span class=btn-text>View Site</span></a>
<a href=/admin/logout><i class="bi bi-box-arrow-left"></i><span class=btn-text>Sign Out</span></a>
</div></div>
<div class=main id=main></div>
<div class="modal fade" id=credM tabindex=-1><div class=modal-dialog><div class=modal-content><div class="modal-header border-0 pb-0"><h5 class=modal-title><i class="bi bi-shield-lock me-2"></i>Add OAuth Credential</h5><button type=button class=btn-close data-bs-dismiss=modal></button></div><div class=modal-body><p class="text-muted small">Store your Google OAuth2 credentials securely. Values are encrypted and never displayed after saving.</p><div class=mb-3><label class="form-label fw-semibold">Credential Name</label><input type=text class=form-control id=cred-name placeholder="e.g. My Google Cloud Project"></div><div class=mb-3><label class="form-label fw-semibold">Client ID</label><input type=text class=form-control id=cred-cid placeholder="xxx.apps.googleusercontent.com"></div><div class=mb-3><label class="form-label fw-semibold">Client Secret</label><input type=password class=form-control id=cred-cs placeholder="GOCSPX-xxx"></div><div class=mb-3><label class="form-label fw-semibold">Refresh Token</label><input type=password class=form-control id=cred-rt placeholder="1//xxx"></div></div><div class="modal-footer border-0 pt-0"><button class="btn btn-light" data-bs-dismiss=modal>Cancel</button><button class="btn btn-primary" onclick=addOAuthCred()><i class="bi bi-check-lg me-1"></i>Save Credential</button></div></div></div></div>
<div class="modal fade" id=dm tabindex=-1><div class=modal-dialog><div class=modal-content><div class="modal-header border-0 pb-0"><h5 class=modal-title id=dmt><i class="bi bi-hdd-network me-2"></i>Add Drive</h5><button type=button class=btn-close data-bs-dismiss=modal></button></div><div class=modal-body><input type=hidden id=dei><div class=mb-3><label class="form-label fw-semibold">Drive Name</label><input type=text class=form-control id=dn placeholder="My Shared Drive"></div><div class=mb-3><label class="form-label fw-semibold">Drive / Folder ID</label><input type=text class="form-control font-monospace" id=di placeholder="Enter ID or type root"><div class="mt-2 d-flex gap-2"><button class="btn btn-outline-primary btn-sm" onclick=fetchRoot()><i class="bi bi-arrow-repeat me-1"></i>Fetch Info</button><button class="btn btn-outline-success btn-sm" onclick=browseShared()><i class="bi bi-list-ul me-1"></i>Browse Drives</button></div><small id=fetchResult class="d-block mt-2 text-muted"></small></div><div class=mb-3><label class="form-label fw-semibold">Authentication Method</label><select class=form-select id=d-auth onchange=onAuthTypeChange()><option value=oauth>OAuth Credential</option><option value=service_account>Service Account</option></select></div><div id=d-auth-oauth class=mb-3><label class="form-label fw-semibold">Select Credential</label><select class=form-select id=d-cred><option value="">-- Choose credential --</option></select><small class=text-muted>Manage in Credentials tab</small></div><div id=d-auth-sa class=mb-3 style="display:none"><label class="form-label fw-semibold">Select Service Account</label><select class=form-select id=d-sa><option value="">-- Choose service account --</option></select></div><div class="form-check"><input class=form-check-input type=checkbox id=dp><label class=form-check-label for=dp>Protect file download links</label></div></div><div class="modal-footer border-0 pt-0"><button class="btn btn-light" data-bs-dismiss=modal>Cancel</button><button class="btn btn-primary" onclick=saveDrive()><i class="bi bi-check-lg me-1"></i>Save Drive</button></div></div></div></div>
<div class="modal fade" id=cm tabindex=-1><div class=modal-dialog><div class=modal-content><div class="modal-header border-0 pb-0"><h5 class=modal-title><i class="bi bi-gear me-2"></i>Add Config Key</h5><button type=button class=btn-close data-bs-dismiss=modal></button></div><div class=modal-body><div class=mb-3><label class="form-label fw-semibold">Key</label><input type=text class="form-control font-monospace" id=ck placeholder="category.key_name"></div><div class=mb-3><label class="form-label fw-semibold">Value</label><input type=text class=form-control id=cv></div></div><div class="modal-footer border-0 pt-0"><button class="btn btn-light" data-bs-dismiss=modal>Cancel</button><button class="btn btn-primary" onclick=addCfgKey()><i class="bi bi-check-lg me-1"></i>Add</button></div></div></div></div>
<div class="modal fade" id=sm tabindex=-1><div class="modal-dialog modal-lg"><div class=modal-content><div class="modal-header border-0 pb-0"><h5 class=modal-title><i class="bi bi-file-earmark-lock me-2"></i>Add Service Account</h5><button type=button class=btn-close data-bs-dismiss=modal></button></div><div class=modal-body><p class="text-muted small">Paste the full JSON content of your Google Cloud service account key file.</p><textarea class="form-control font-monospace" id=sj rows=12 placeholder='{"type":"service_account","project_id":"..."}'></textarea></div><div class="modal-footer border-0 pt-0"><button class="btn btn-light" data-bs-dismiss=modal>Cancel</button><button class="btn btn-primary" onclick=addSA()><i class="bi bi-check-lg me-1"></i>Add Account</button></div></div></div></div>
<script src='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js'></script>
<script>
const REDIRECT_URI='${redirectUri}';
let AD=[],AC=[],ASA=[],ACREDS=[];
const $=s=>document.getElementById(s);
const esc=s=>s==null?'':String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function toggleSidebar(){const sb=$('sidebar'),mn=$('main');sb.classList.toggle('collapsed');mn.classList.toggle('expanded');localStorage.setItem('sb_collapsed',sb.classList.contains('collapsed'))}
if(localStorage.getItem('sb_collapsed')==='true'){$('sidebar').classList.add('collapsed');$('main').classList.add('expanded')}
function toast(m,t='success'){const id='t'+Date.now();$('tc').insertAdjacentHTML('beforeend','<div id="'+id+'" class="toast show align-items-center text-bg-'+t+' border-0 mb-2"><div class="d-flex"><div class="toast-body">'+m+'</div><button class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div></div>');setTimeout(()=>{const e=$(id);if(e)e.remove()},3000)}
async function api(p,b){const o=b?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}:{};const r=await fetch('/admin/api/'+p,o);const d=await r.json();if(d.error)throw new Error(d.error);return d}
const BK=['auth.enable_login','auth.enable_signup','ui.logo_image','ui.fixed_header','ui.hide_footer','ui.credit','ui.display_size','ui.display_download','ui.render_readme_md','ui.show_logout_button'];
const SK={'site.download_mode':['path','id'],'player.player':['videojs','plyr','dplayer','jwplayer'],'ui.theme':['cerulean','cosmo','cyborg','darkly','flatly','journal','litera','lumen','lux','materia','minty','morph','pulse','quartz','sandstone','simplex','sketchy','slate','solar','spacelab','superhero','united','vapor','yeti','zephyr']};
function sc(i,l,v,c){return '<div class="col-md-3"><div class="card sc border-start border-4 border-'+c+'"><div class="card-body py-3"><div class="d-flex align-items-center"><div class="flex-grow-1"><div class="text-muted small">'+l+'</div><div class="h4 mb-0">'+v+'</div></div><i class="bi '+i+' fs-2 text-'+c+'"></i></div></div></div></div>'}
document.querySelectorAll('[data-tab]').forEach(a=>{a.addEventListener('click',e=>{e.preventDefault();document.querySelectorAll('.sb .nav-link').forEach(n=>n.classList.remove('active'));a.classList.add('active');loadTab(a.dataset.tab)})});
function loadTab(t){$('main').innerHTML='<div class="text-center py-5"><div class="spinner-border"></div></div>';({dashboard:loadDash,credentials:loadCreds,drives:loadDrives,config:loadCfg,sa:loadSA,'google-login':loadGL,security:loadSec})[t]()}
</script></body></html>`;
}
