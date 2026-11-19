const db = supabase.createClient(CFG.URL, CFG.KEY);
const $ = id => document.getElementById(id);
const fa = n => n.toLocaleString("fa-IR");
let rows = [];
async function init(){
  const { data:{ session } } = await db.auth.getSession();
  if (!session) return show(false);
  const { data } = await db.from("admins").select("user_id").maybeSingle();
  if (!data){ await db.auth.signOut(); $("lm").textContent="این حساب مدیر نیست."; return show(false); }
  show(true); refresh();
}
function show(ok){ $("app").hidden=!ok; $("login").hidden=ok; }
$("lf").addEventListener("submit", async e => {
  e.preventDefault();
  const { error } = await db.auth.signInWithPassword({ email:$("em").value, password:$("pw").value });
  if (error) return $("lm").textContent="ایمیل یا رمز عبور درست نیست.";
  $("lm").textContent=""; $("pw").value=""; init();
});
$("out").onclick = async () => { await db.auth.signOut(); show(false); };

async function refresh(){
  const { data, error } = await db.from("suggestions").select("*").order("created_at",{ascending:false});
  if (error) return;
  rows = data; draw();
}
function draw(){
  const p = rows.filter(r=>!r.approved), a = rows.filter(r=>r.approved);
  $("sp").textContent = "در انتظار: "+fa(p.length); $("sa").textContent = "تأییدشده: "+fa(a.length);
  fill($("pend"), p, true); fill($("appr"), a, false);
}
function fill(el, list, pending){
  el.replaceChildren();
  if (!list.length){ el.textContent="موردی نیست."; return; }
  list.forEach(r => {
    const d=document.createElement("div"); d.className="row";
    const b=document.createElement("b"); b.textContent=r.name;
    const s=document.createElement("small"); s.textContent=new Date(r.created_at).toLocaleDateString("fa-IR");
    const t=document.createElement("button"); t.className="btn sm"; t.textContent=pending?"تأیید":"لغو تأیید";
    t.onclick=()=>act(db.from("suggestions").update({approved:pending}).eq("id",r.id));
    const x=document.createElement("button"); x.className="btn sm ghost"; x.textContent="حذف";
    x.onclick=()=>{ if (confirm("«"+r.name+"» حذف شود؟")) act(db.from("suggestions").delete().eq("id",r.id)); };
    d.append(b,s,t,x); el.append(d);
  });
}
async function act(q){ const { error } = await q; if (error) alert("انجام نشد: "+error.message); refresh(); }
$("csv").onclick = () => {
  const q = v => { v=String(v); if (/^[=+\-@]/.test(v)) v="'"+v; return '"'+v.replace(/"/g,'""')+'"'; };
  const out = ["id,name,status,created_at", ...rows.map(r=>[r.id,q(r.name),r.approved?"approved":"pending",r.created_at].join(","))].join("\n");
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob(["\ufeff"+out],{type:"text/csv;charset=utf-8"}));
  a.download="suggestions.csv"; a.click(); URL.revokeObjectURL(a.href);
};
init();
