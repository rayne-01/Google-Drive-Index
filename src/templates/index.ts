/**
 * HTML Templates
 * @version 3.0.0
 */

import { config } from '../config';
import type { FrontendModel } from '../types';

const { auth, ui, player } = config;

export function getMainHTML(driveOrder: number = 0, model: FrontendModel): string {
  const appJs = config.environment === 'production' ? '/app.js' : '/app.js';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <title>${auth.siteName}</title>
  <meta name="robots" content="noindex">
  <link rel="icon" href="${ui.favicon}">
  <link href="https://cdn.jsdelivr.net/npm/bootswatch@5.3.0/dist/${ui.theme}/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
  <style>
    a{color:${ui.css_a_tag_color}}p{color:${ui.css_p_tag_color}}
    .loading{position:fixed;z-index:999;height:2em;width:2em;overflow:show;margin:auto;top:0;left:0;bottom:0;right:0}
    .loading:before{content:'';display:block;position:fixed;top:0;left:0;width:100%;height:100%;background:radial-gradient(rgba(20,20,20,.8),rgba(0,0,0,.8))}
  </style>
  <script>
    window.drive_names=${JSON.stringify(auth.roots.map(r=>r.name))};
    window.MODEL=${JSON.stringify(model)};
    window.current_drive_order=${driveOrder};
    window.UI=${JSON.stringify(ui)};
    window.player_config=${JSON.stringify(player)};
    window.download_mode='${config.download_mode}';
  </script>
</head>
<body></body>
<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.0/dist/jquery.min.js"></script>
<script src="${appJs}"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/marked@9.0.0/lib/marked.umd.min.js"></script>
</html>`;
}

export function getHomepageHTML(): string {
  const driveList = auth.roots.map((r, i) => 
    `<a href="/${i}:/" style="color:${ui.folder_text_color}" class="list-group-item list-group-item-action">
      <i class="bi bi-folder-fill text-warning"></i> ${r.name}
    </a>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${auth.siteName}</title>
  <meta name="robots" content="noindex">
  <link rel="icon" href="${ui.favicon}">
  <link href="https://cdn.jsdelivr.net/npm/bootswatch@5.3.0/dist/${ui.theme}/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
  <style>a{color:${ui.css_a_tag_color}}p{color:${ui.css_p_tag_color}}</style>
</head>
<body>
  <nav class="navbar navbar-expand-lg ${ui.fixed_header?'fixed-top':''} ${ui.header_style_class}">
    <div class="container-fluid">
      <a class="navbar-brand" href="/">${ui.logo_image?`<img src="${ui.logo_link_name}" width="${ui.logo_width}" alt="${ui.company_name}">`:ui.logo_link_name}</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="nav">
        <ul class="navbar-nav me-auto">
          <li class="nav-item"><a class="nav-link" href="/">${ui.nav_link_1}</a></li>
          <li class="nav-item"><a class="nav-link" href="${ui.contact_link}" target="_blank">${ui.nav_link_4}</a></li>
        </ul>
        <form class="d-flex" method="get" action="${auth.search_all_drives ? '/search' : '/0:search'}">
          <input class="form-control me-2" name="q" type="search" placeholder="Search${auth.search_all_drives ? ' All Drives' : ''}" required>
          <button class="${ui.search_button_class}" type="submit">Search</button>
        </form>
      </div>
    </div>
  </nav>
  <div id="content" style="padding-top:${ui.header_padding}px">
    <div class="container">
      <div class="${ui.path_nav_alert_class}" style="margin-bottom:0">
        <nav><ol class="breadcrumb mb-0"><li class="breadcrumb-item"><a href="/">Home</a></li></ol></nav>
      </div>
      <div id="list" class="list-group">${driveList}</div>
      <div class="${ui.file_count_alert_class} text-center">Total ${auth.roots.length} drives</div>
    </div>
  </div>
  ${ui.hide_footer?'':`<footer class="footer mt-auto py-3 ${ui.footer_style_class}"><div class="container"><p>© ${ui.copyright_year} <a href="${ui.company_link}">${ui.company_name}</a></p></div></footer>`}
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
}

export function getLoginHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Sign In - ${auth.siteName}</title>
  <meta name="robots" content="noindex,nofollow">
  <link rel="icon" href="${ui.favicon}">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>.login{min-height:100vh}</style>
</head>
<body class="bg-light">
  <div class="container">
    <div class="row justify-content-center align-items-center login">
      <div class="col-md-4">
        <div class="card shadow">
          <div class="card-body p-4">
            <div class="text-center mb-4">
              <img src="${ui.login_image}" alt="Logo" style="max-width:100px">
              <h4 class="mt-3">${auth.siteName}</h4>
            </div>
            <div id="error" class="alert alert-danger d-none"></div>
            <form id="loginForm">
              <div class="mb-3">
                <input type="text" class="form-control" name="username" placeholder="Username" required>
              </div>
              <div class="mb-3">
                <input type="password" class="form-control" name="password" placeholder="Password" required>
              </div>
              <button type="submit" class="btn btn-primary w-100">Login</button>
            </form>
            ${auth.enable_signup?'<a href="/signup" class="btn btn-outline-secondary w-100 mt-2">Sign Up</a>':''}
          </div>
        </div>
      </div>
    </div>
  </div>
  <script>
    document.getElementById('loginForm').onsubmit=async(e)=>{
      e.preventDefault();
      const form=new FormData(e.target);
      const res=await fetch('/login',{method:'POST',body:form});
      const data=await res.json();
      if(data.ok)location.reload();
      else{document.getElementById('error').textContent=data.error||'Login failed';document.getElementById('error').classList.remove('d-none')}
    };
  </script>
</body>
</html>`;
}

export function getErrorHTML(status: number, message: string): string {
  return `<!DOCTYPE html>
<html><head><title>Error ${status}</title>
<style>body{font:15px/22px arial;background:#fff;color:#222;padding:15px;margin:7% auto;max-width:500px}h1{margin:0 0 20px;font-size:24px}</style>
</head><body><h1>Error ${status}</h1><p>${message}</p><a href="/">← Back to Home</a></body></html>`;
}

export function getBlockedHTML(): string {
  return getErrorHTML(403, 'Access Denied - Your region or network is blocked.');
}

export function getGlobalSearchHTML(q: string = ''): string {
  const appJs = config.environment === 'production' ? '/app.js' : '/app.js';
  const totalDrives = auth.roots.length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <title>${auth.siteName} - Search${q ? ': ' + q : ''}</title>
  <meta name="robots" content="noindex">
  <link rel="icon" href="${ui.favicon}">
  <link href="https://cdn.jsdelivr.net/npm/bootswatch@5.3.0/dist/${ui.theme}/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
  <style>
    a{color:${ui.css_a_tag_color}}p{color:${ui.css_p_tag_color}}
    .loading{position:fixed;z-index:999;height:2em;width:2em;overflow:show;margin:auto;top:0;left:0;bottom:0;right:0}
    .loading:before{content:'';display:block;position:fixed;top:0;left:0;width:100%;height:100%;background:radial-gradient(rgba(20,20,20,.8),rgba(0,0,0,.8))}
  </style>
  <script>
    window.drive_names=${JSON.stringify(auth.roots.map(r=>r.name))};
    window.MODEL=${JSON.stringify({ is_search_page: true, is_global_search: true, q, root_type: 0, total_drives: totalDrives })};
    window.current_drive_order=0;
    window.UI=${JSON.stringify(ui)};
    window.player_config=${JSON.stringify(player)};
    window.download_mode='${config.download_mode}';
  </script>
</head>
<body></body>
<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.0/dist/jquery.min.js"></script>
<script src="${appJs}"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/marked@9.0.0/lib/marked.umd.min.js"></script>
</html>`;
}
