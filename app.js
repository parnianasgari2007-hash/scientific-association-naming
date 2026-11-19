const db = supabase.createClient(CFG.URL, CFG.KEY);
const $ = id => document.getElementById(id);
const fa = n => n.toLocaleString("fa-IR");
const OK = /^[\p{L}\p{M}\p{N} \u200c\-_.!؟?،]+$/u;
let last = "", lastAt = 0;
function say(t, c){ const m=$("msg"); m.textContent=t; m.className="msg "+(c||""); }

$("f").addEventListener("submit", async e => {
  e.preventDefault();
  const name = $("name").value.replace(/\s+/g," ").trim();
  if ($("hp").value) return say("پیشنهادت ثبت شد! بعد از بررسی مدیران، در صفحه نمایش داده می‌شود.","ok"); // bot: fake success
  if (!name) return say("لطفاً یک نام بنویس.","err");
  if (name.length < 2) return say("نام باید حداقل ۲ حرف باشد.","err");
  if (!OK.test(name)) return say("فقط حروف، عدد و علائم نگارشی ساده مجاز است.","err");
  if (name === last && Date.now()-lastAt < 60000) return say("همین پیشنهاد را همین حالا فرستادی.","err");
  if (Date.now()-lastAt < 3000) return say("چند ثانیه صبر کن و دوباره امتحان کن.","err");
  $("go").disabled = true;
  const { error } = await db.from("suggestions").insert({ name }, { returning: "minimal" });
  $("go").disabled = false;
  // 23505 = already suggested by someone; treat as success so nothing leaks about pending items
  if (error && error.code !== "23505") return say("ثبت نشد. اتصال اینترنت را بررسی کن و دوباره تلاش کن.","err");
  last = name; lastAt = Date.now(); $("name").value = "";
  say("پیشنهادت ثبت شد! بعد از بررسی مدیران، در صفحه نمایش داده می‌شود.","ok");
});

let shown = "";
async function load(){
  const { data, error } = await db.from("suggestions").select("id,name").eq("approved", true).order("created_at",{ascending:false});
  if (error) return;
  const key = data.map(d=>d.id).join();
  if (key === shown) return; shown = key;
  $("cnt").textContent = data.length ? fa(data.length)+" پیشنهاد" : "";
  const g = $("grid"); g.replaceChildren();
  if (!data.length){ const d=document.createElement("div"); d.className="empty"; d.style.gridColumn="1/-1";
    d.textContent="هنوز پیشنهادی تأیید نشده. اولین ایده را تو بده!"; g.append(d); return; }
  data.forEach(s => { const c=document.createElement("div"); c.className="card"; c.textContent=s.name; g.append(c); });
}
load(); setInterval(load, 30000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) load(); });
