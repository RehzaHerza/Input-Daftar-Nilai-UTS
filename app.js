(function(){
const D=globalThis.DNU,KEY="dnuts_v1";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fresh=()=>({set:{semester:"GANJIL",tp:"2026/2027",tempat:"Manggar,  Oktober 2026",sekolah:"SMK Negeri 1 Manggar",kepsek:"TRIYUDO HENDRO SASONGKO, ST",nipKepsek:"19680905 200801 1 002",wali:"………………………………",nipWali:""},kktp:{X:[],XI:[]},students:[],cur:0,lastKelas:"",lastT:"X"});
let S;try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}
if(!S||!S.students||!S.set)S=fresh();
let armed=-1;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const cur=()=>S.students[S.cur];
function newStudent(nama,kelas,t){S.students.push({nama:nama||"",kelas:kelas??"",t:t||"X",nilai:[],ket:[]});S.cur=S.students.length-1}
if(!S.students.length)newStudent("",S.lastKelas,S.lastT);

function renderList(){
  $("#list").innerHTML=S.students.map((s,i)=>`<div class="item ${i===S.cur?"on":""}" data-go="${i}"><span>${i+1}. ${esc(s.nama)||"<i>(belum ada nama)</i>"}</span><small class="muted">${esc(s.kelas)}</small><button class="x" data-del="${i}" title="Hapus">${i===armed?"Hapus?":"✕"}</button></div>`).join("");
  $("#pos").textContent=`Siswa ${S.cur+1} dari ${S.students.length}`;
}
function renderPaper(){
  const s=cur(),m=D.MAPEL[s.t],st=S.set;
  $("#tCur").value=s.t;
  let h=`<h3>DAFTAR NILAI UJIAN TENGAH SEMESTER</h3><div class="hd">
   <span>NAMA</span><span style="display:flex;gap:4px">:<input data-f="nama" value="${esc(s.nama)}" placeholder="Nama siswa" autocomplete="off"></span><span>SEMESTER : ${esc(st.semester)}</span>
   <span>KELAS</span><span style="display:flex;gap:4px">:<input data-f="kelas" value="${esc(s.kelas)}" placeholder="mis. X RPL" autocomplete="off"></span><span>TP : ${esc(st.tp)}</span></div>
   <table><colgroup><col style="width:44px"><col><col style="width:66px"><col style="width:84px"><col style="width:112px"></colgroup>
   <tr><th>No.</th><th>MATA PELAJARAN</th><th>KKTP</th><th>NILAI UTS</th><th>Ket</th></tr>`;
  m.forEach((n,i)=>{h+=`<tr><td class="c">${i+1}</td><td style="font-size:12.5px">${esc(n)}</td>
   <td><input class="k${bad(S.kktp[s.t][i])?" bad":""}" inputmode="decimal" data-k="${i}" value="${esc(S.kktp[s.t][i]??"")}"></td>
   <td><input class="n${bad(s.nilai[i])?" bad":""}" inputmode="decimal" data-n="${i}" value="${esc(s.nilai[i]??"")}"></td>
   <td class="c ket" data-ket="${i}"></td></tr>`});
  h+=`<tr><td colspan="3" class="c">JUMLAH NILAI</td><td class="c" id="tot"></td><td></td></tr></table>
   <div class="sign"><div></div><div>${esc(st.tempat)}</div><div>Mengetahui,</div><div></div><div>Kepala ${esc(st.sekolah)}</div><div>Wali Kelas</div>
   <div style="grid-column:1/3;min-height:60px"></div><div>${esc(st.kepsek)}</div><div>${esc(st.wali)}</div><div>NIP. ${esc(st.nipKepsek)}</div><div>NIP.${st.nipWali?" "+esc(st.nipWali):""}</div></div>`;
  $("#paper").innerHTML=h;updTot();updKet();renderList();
}
function updKet(){const s=cur();document.querySelectorAll("#paper [data-ket]").forEach(td=>{const i=+td.dataset.ket,v=D.ketMapel(s.nilai[i],S.kktp[s.t][i]);td.textContent=v;td.style.color=v==="TIDAK TUNTAS"?"#c0392b":"#000"})}
function updTot(){const t=D.totalOf(cur());$("#tot").textContent=t?D.fmt(t):""}

$("#paper").addEventListener("input",e=>{
  const d=e.target.dataset,s=cur();
  if(d.f)s[d.f]=e.target.value;
  else if(d.k!==undefined){S.kktp[s.t][+d.k]=e.target.value;updKet()}
  else if(d.n!==undefined){s.nilai[+d.n]=e.target.value;updTot();updKet()}
  else if(d.e!==undefined)s.ket[+d.e]=e.target.value;
  if(d.n!==undefined||d.k!==undefined)e.target.classList.toggle("bad",bad(e.target.value));
  if(d.f==="kelas"){S.lastKelas=s.kelas}
  save();if(d.f)renderList();
});
$("#paper").addEventListener("keydown",e=>{
  if(e.key!=="Enter")return;e.preventDefault();
  const el=e.target,d=el.dataset,s=cur();
  const seq=[...$("#paper").querySelectorAll("input")];
  if(d.n!==undefined&&+d.n===D.MAPEL[s.t].length-1){addNext();return}
  if(d.n!==undefined){const nx=$(`#paper [data-n="${+d.n+1}"]`);nx&&nx.focus();return}
  const i=seq.indexOf(el);const first=$(`#paper [data-n="0"]`);
  if(d.f==="nama")$(`#paper [data-f="kelas"]`).focus();else if(d.f==="kelas")first.focus();
  else if(d.k!==undefined){const nx=$(`#paper [data-k="${+d.k+1}"]`)||first;nx.focus()}
  else seq[i+1]&&seq[i+1].focus();
});
$("#paper").addEventListener("focusin",e=>e.target.select&&e.target.select());

function addNext(){const s=cur();newStudent("",s.kelas,s.t);save();renderPaper();$(`#paper [data-f="nama"]`).focus()}
$("#add").onclick=()=>{newStudent("",$("#kNew").value.trim()||S.lastKelas,$("#tNew").value);S.lastT=cur().t;save();renderPaper();$(`#paper [data-f="nama"]`).focus()};
$("#bulkAdd").onclick=()=>{
  const names=$("#bulk").value.split(/\n/).map(x=>x.trim()).filter(Boolean);if(!names.length)return;
  const k=$("#kNew").value.trim()||S.lastKelas,t=$("#tNew").value;
  if(S.students.length===1&&!S.students[0].nama&&!S.students[0].nilai.some(Boolean)){S.students=[];}
  names.forEach(n=>newStudent(n,k,t));S.cur=S.students.length-names.length;S.lastT=t;S.lastKelas=k;$("#bulk").value="";save();renderPaper();
};
$("#kNew").value=S.lastKelas||"";$("#tNew").value=S.lastT||"X";

function removeAt(i){S.students.splice(i,1);if(!S.students.length)newStudent("",S.lastKelas,S.lastT);if(i<S.cur)S.cur--;S.cur=Math.max(0,Math.min(S.cur,S.students.length-1));save();renderPaper()}
const isEmpty=s=>!s.nama.trim()&&!s.nilai.some(v=>String(v??"").trim());
$("#list").onclick=e=>{
  const del=e.target.closest("[data-del]");
  if(del){const i=+del.dataset.del;
    if(!isEmpty(S.students[i])&&armed!==i){armed=i;renderList();return}
    armed=-1;removeAt(i);return}
  armed=-1;
  const it=e.target.closest("[data-go]");if(it){S.cur=+it.dataset.go;save();renderPaper()}
};
$("#clean").onclick=()=>{
  const keep=S.students.filter(s=>!isEmpty(s));
  S.students=keep;if(!keep.length)newStudent("",S.lastKelas,S.lastT);S.cur=0;armed=-1;save();renderPaper();
};
$("#prev").onclick=()=>{if(S.cur>0){S.cur--;renderPaper()}};
$("#next").onclick=()=>{if(S.cur<S.students.length-1){S.cur++;renderPaper()}};
$("#tCur").onchange=e=>{cur().t=e.target.value;save();renderPaper()};
function syncSet(){document.querySelectorAll("[data-s]").forEach(i=>{i.value=S.set[i.dataset.s]??""})}
document.querySelectorAll("[data-s]").forEach(i=>{i.onchange=()=>{S.set[i.dataset.s]=i.value;save();renderPaper()}});syncSet();

const MIME={xlsx:"xlsx",docx:"docx",pdf:"pdf"};
function missingLibs(fmt,zip){
  const need=[];
  if(fmt==="xlsx")need.push(["ExcelJS","libs/exceljs.min.js"]);
  if(fmt==="docx")need.push(["docx","libs/docx.umd.js"]);
  if(fmt==="pdf")need.push(["jspdf","libs/jspdf.umd.min.js dan libs/jspdf.plugin.autotable.min.js"]);
  if(zip)need.push(["JSZip","libs/jszip.min.js"]);
  const miss=need.filter(([g])=>typeof window[g]==="undefined");
  return miss.length?"Pustaka belum termuat: "+miss.map(x=>x[1]).join(", ")+". Pastikan folder libs ikut diunggah lengkap, lalu muat ulang halaman.":"";
}
async function saveFile(blob,name){
  let dl=null;try{dl=window.claude&&await window.claude.use("downloads")}catch(e){}
  if(dl){await dl.save({filename:name,data:blob});return}
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}
document.querySelectorAll("[data-ex]").forEach(b=>b.onclick=async()=>{
  const mode=$("#scope").value;
  const list=mode==="one"?[cur()]:S.students.filter(s=>s.nama.trim()||s.nilai.some(v=>String(v).trim()));
  const st=$("#stat");
  if(!list.length){st.textContent="Belum ada data siswa yang terisi.";return}
  const fmtx=b.dataset.ex;const ml=missingLibs(fmtx,mode==="zip");if(ml){st.textContent=ml;return}
  st.textContent="Menyiapkan berkas…";b.disabled=true;
  try{
    const gen=async l=>fmtx==="xlsx"?await D.makeXlsx(l,S):fmtx==="docx"?await D.makeDocx(l,S):D.makePdf(l,S);
    const clean=x=>String(x).replace(/[\\\/:*?"<>|]/g,"-").replace(/\s+/g," ").trim();
    const kelas=clean(list[0].kelas||"Kelas");
    if(mode==="zip"){
      const zip=new JSZip(),used=new Set();
      for(let i=0;i<list.length;i++){
        st.textContent=`Membuat berkas ${i+1} dari ${list.length}…`;await new Promise(r=>setTimeout(r,0));
        const base=clean(list[i].nama)||`Siswa ${i+1}`;let name=base,c=1;
        while(used.has(name.toLowerCase()))name=`${base} (${++c})`;
        used.add(name.toLowerCase());
        zip.file(`DAFTAR NILAI UTS - ${name}.${MIME[fmtx]}`,await gen([list[i]]));
      }
      st.textContent="Mengemas ZIP…";
      const zb=await zip.generateAsync({type:"blob",compression:"DEFLATE"});
      await saveFile(zb,`DAFTAR NILAI UTS ${kelas} per siswa (${fmtx.toUpperCase()}).zip`);
    }else{
      await saveFile(await gen(list),`DAFTAR NILAI UTS ${list.length===1?list[0].nama||kelas:kelas}.${MIME[fmtx]}`);
    }
    const nb=list.reduce((a,s)=>a+s.nilai.filter(bad).length,0);
    st.textContent=(mode==="zip"?`${list.length} berkas ${fmtx.toUpperCase()} dikemas dalam satu ZIP.`:`${list.length} siswa diekspor ke ${fmtx.toUpperCase()}.`)+(nb?` Perhatian: ${nb} nilai bukan angka 0–100 (kotak merah).`:"");
  }catch(err){st.textContent=err&&err.code==="declined"?"Unduhan dibatalkan.":"Gagal membuat berkas: "+(err&&err.message||err)}
  b.disabled=false;
});

/* ---- validasi nilai ---- */
function bad(v){v=String(v??"").trim();if(!v)return false;if(!/^[0-9]+([.,][0-9]+)?$/.test(v))return true;const n=D.toNum(v);return n===null||n<0||n>100}

/* ---- cadangan & pemulihan ---- */
let pending=null;
$("#bk").onclick=async()=>{
  const st=$("#bkStat");
  try{const blob=new Blob([JSON.stringify({app:"dnuts",v:1,tanggal:new Date().toISOString(),data:S})],{type:"application/json"});
    await saveFile(blob,`Cadangan Daftar Nilai UTS ${new Date().toISOString().slice(0,10)}.json`);st.textContent=`Cadangan ${S.students.length} siswa dibuat.`}
  catch(e){st.textContent=e&&e.code==="declined"?"Dibatalkan.":"Gagal: "+(e&&e.message||e)}
};
$("#rs").onclick=()=>$("#rsf").click();
$("#rsf").onchange=e=>{
  const f=e.target.files[0];e.target.value="";if(!f)return;const st=$("#bkStat");
  const r=new FileReader();
  r.onload=()=>{
    try{
      let o=JSON.parse(r.result);o=o.data||o;
      if(!Array.isArray(o.students)||!o.set||!o.kktp)throw new Error("format tidak dikenali");
      const base=fresh();
      pending={set:{...base.set,...o.set},kktp:{X:o.kktp.X||[],XI:o.kktp.XI||[]},cur:0,lastKelas:o.lastKelas||"",lastT:o.lastT||"X",
        students:o.students.map(s=>({nama:String(s.nama??""),kelas:String(s.kelas??""),t:s.t==="XI"?"XI":"X",nilai:Array.isArray(s.nilai)?s.nilai:[],ket:Array.isArray(s.ket)?s.ket:[]}))};
      st.innerHTML=`Berkas berisi <b id="rsN"></b> siswa. Data saat ini akan diganti. <button id="rsGo">Ganti data</button><button id="rsNo">Batal</button>`;
      $("#rsN").textContent=pending.students.length;
      $("#rsNo").onclick=()=>{pending=null;st.textContent="Dibatalkan."};
      $("#rsGo").onclick=()=>{S=pending;pending=null;if(!S.students.length)newStudent("",S.lastKelas,S.lastT);save();syncSet();$("#kNew").value=S.lastKelas||"";$("#tNew").value=S.lastT||"X";renderPaper();rekapOn&&renderRekap();st.textContent=`Data dipulihkan: ${S.students.length} siswa.`};
    }catch(err){pending=null;st.textContent="Berkas tidak valid: "+err.message}
  };
  r.readAsText(f);
};

/* ---- tab & rekap kelas (template terpisah) ---- */
let rekapOn=false;
const VIEWS={siswa:"#vSiswa",mapel:"#vMapel",rekap:"#vRekap"};
document.querySelectorAll(".tabs [data-v]").forEach(b=>b.onclick=()=>{
  const v=b.dataset.v;rekapOn=v==="rekap";
  document.querySelectorAll(".tabs [data-v]").forEach(x=>x.classList.toggle("on",x===b));
  Object.keys(VIEWS).forEach(k=>{$(VIEWS[k]).hidden=k!==v});
  if(v==="rekap"){$("#rT").value=cur().t;fillKelas();renderRekap()}
  if(v==="mapel"){$("#mT").value=cur().t;mi=0;fillMK();fillMM();renderMapel()}
  if(v==="siswa")renderPaper();
});
function fillKelas(){
  const t=$("#rT").value,old=$("#rK").value;
  const ks=[...new Set(S.students.filter(s=>s.t===t&&!isEmpty(s)).map(s=>s.kelas).filter(Boolean))];
  $("#rK").innerHTML='<option value="">Semua kelas</option>'+ks.map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join("");
  $("#rK").value=ks.includes(old)?old:"";
}
const rekapList=()=>{const t=$("#rT").value,k=$("#rK").value;return S.students.filter(s=>s.t===t&&!isEmpty(s)&&(!k||s.kelas===k))};
const rekapLabel=()=>$("#rK").value||("Kelas "+$("#rT").value);
function renderRekap(){
  const list=rekapList(),t=$("#rT").value,ket=$("#rKet").checked,R=D.rekapData(list,S,t,ket),n=R.m.length,cv=v=>v===null?"":D.fmt(v);
  let h=`<h3>REKAP NILAI UJIAN TENGAH SEMESTER</h3><div style="margin-bottom:10px">KELAS : ${esc(rekapLabel())}<br>SEMESTER : ${esc(S.set.semester)} &nbsp;&nbsp; TP : ${esc(S.set.tp)}</div>`;
  if(!list.length)h+=`<p>Belum ada siswa terisi untuk pilihan ini.</p>`;
  else{
    h+=`<table><tr><th>No</th><th>NAMA SISWA</th>${R.m.map((_,i)=>`<th>${i+1}</th>`).join("")}<th>JUMLAH</th><th>RATA-RATA</th>${ket?"<th>KET</th>":""}</tr>`;
    h+=`<tr><td colspan="2" class="c">KKTP</td>${R.kktp.map(k=>`<td class="c">${cv(k)}</td>`).join("")}<td></td><td></td>${ket?"<td></td>":""}</tr>`;
    R.rows.forEach(r=>{h+=`<tr><td class="c">${r.no}</td><td class="l">${esc(r.nama)}</td>${r.vals.map((v,j)=>`<td class="c${r.flags[j]?" lo":""}">${cv(v)}</td>`).join("")}<td class="c">${cv(r.jumlah)}</td><td class="c">${r.rata===null?"":D.fmt(r.rata)}</td>${ket?`<td class="l">${esc(r.ket)}</td>`:""}</tr>`});
    h+=`</table><div class="leg"><b>Keterangan mata pelajaran:</b><br>${R.m.map((m,i)=>`${i+1}. ${esc(m)}`).join("<br>")}</div>`;
  }
  $("#rTable").innerHTML=h;
}
$("#rT").onchange=()=>{fillKelas();renderRekap()};$("#rK").onchange=renderRekap;$("#rKet").onchange=renderRekap;
document.querySelectorAll("[data-rx]").forEach(b=>b.onclick=async()=>{
  const list=rekapList(),st=$("#rStat");
  if(!list.length){st.textContent="Belum ada siswa terisi untuk pilihan ini.";return}
  const f=b.dataset.rx,t=$("#rT").value,ket=$("#rKet").checked,lb=rekapLabel();
  const ml=missingLibs(f,false);if(ml){st.textContent=ml;return}
  st.textContent="Menyiapkan berkas…";b.disabled=true;
  try{
    const blob=f==="xlsx"?await D.makeRekapXlsx(list,S,t,ket,lb):f==="docx"?await D.makeRekapDocx(list,S,t,ket,lb):D.makeRekapPdf(list,S,t,ket,lb);
    await saveFile(blob,`REKAP NILAI UTS ${lb.replace(/[\\\/:*?"<>|]/g,"-")}.${f}`);
    st.textContent=`Rekap ${list.length} siswa diekspor ke ${f.toUpperCase()}.`;
  }catch(err){st.textContent=err&&err.code==="declined"?"Unduhan dibatalkan.":"Gagal membuat berkas: "+(err&&err.message||err)}
  b.disabled=false;
});

/* ---- impor nama siswa dari Excel / CSV ---- */
const readFile=(f,mode)=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(new Error("berkas tidak terbaca"));mode==="text"?r.readAsText(f):r.readAsArrayBuffer(f)});
function parseCsv(txt){
  txt=txt.replace(/^\uFEFF/,"");
  const first=txt.split(/\r?\n/)[0]||"";
  const dl=[",",";","\t"].map(d=>[d,first.split(d).length]).sort((a,b)=>b[1]-a[1])[0][0];
  const rows=[];let row=[],cell="",q=false;
  for(let i=0;i<txt.length;i++){
    const c=txt[i];
    if(q){if(c==='"'){if(txt[i+1]==='"'){cell+='"';i++}else q=false}else cell+=c}
    else if(c==='"')q=true;
    else if(c===dl){row.push(cell);cell=""}
    else if(c==="\n"||c==="\r"){if(c==="\r"&&txt[i+1]==="\n")i++;row.push(cell);rows.push(row);row=[];cell=""}
    else cell+=c;
  }
  if(cell!==""||row.length){row.push(cell);rows.push(row)}
  return rows;
}
const cellText=v=>{if(v==null)return"";if(typeof v!=="object")return String(v);if(v.richText)return v.richText.map(r=>r.text).join("");if(v.result!=null)return String(v.result);if(v.text!=null)return String(v.text);return""};
async function readXlsx(buf){
  const wb=new ExcelJS.Workbook();await wb.xlsx.load(buf);
  const ws=wb.worksheets.find(w=>w.actualRowCount>0)||wb.worksheets[0];
  if(!ws)throw new Error("tidak ada sheet");
  const rows=[];ws.eachRow({includeEmpty:false},row=>{const a=[];row.eachCell({includeEmpty:true},(c,i)=>{a[i-1]=cellText(c.value)});rows.push(a)});
  return {rows,sheet:ws.name};
}
function extractNames(rows){
  const norm=x=>String(x??"").replace(/\s+/g," ").trim();
  let hr=-1,nc=-1,kc=-1;
  for(let r=0;r<Math.min(rows.length,10)&&hr<0;r++){
    const i=(rows[r]||[]).findIndex(c=>/^nama\b/i.test(norm(c)));
    if(i>=0){hr=r;nc=i;kc=rows[r].findIndex(c=>/^(kelas|rombel)\b/i.test(norm(c)))}
  }
  if(hr<0){
    const w=Math.max(0,...rows.map(r=>(r||[]).length));let best=-1,bc=0;
    for(let c=0;c<w;c++){const k=rows.filter(r=>{const v=norm(r&&r[c]);return v&&!/^[\d.,\s]+$/.test(v)}).length;if(k>bc){bc=k;best=c}}
    nc=best;
  }
  if(nc<0)return {list:[],hasKelas:false};
  const list=[];
  for(let r=hr+1;r<rows.length;r++){
    const nama=norm(rows[r]&&rows[r][nc]).replace(/^\d+\s*[.)]\s*/,"");
    if(!nama||/^[\d.,\s]+$/.test(nama))continue;
    list.push({nama,kelas:kc>=0?norm(rows[r][kc]):""});
  }
  return {list,hasKelas:kc>=0};
}
let impPending=null;
$("#impBtn").onclick=()=>$("#impF").click();
$("#impF").onchange=async e=>{
  const f=e.target.files[0];e.target.value="";if(!f)return;
  const st=$("#impStat");st.textContent="Membaca berkas…";impPending=null;
  try{
    const ext=f.name.split(".").pop().toLowerCase();let rows,sheet="";
    if(ext==="csv"||ext==="txt")rows=parseCsv(await readFile(f,"text"));
    else if(ext==="xlsx"){const x=await readXlsx(await readFile(f,"buf"));rows=x.rows;sheet=x.sheet}
    else throw new Error("gunakan .xlsx atau .csv (untuk .xls lama, simpan ulang sebagai .xlsx)");
    const res=extractNames(rows);
    if(!res.list.length)throw new Error("tidak ada nama yang ditemukan");
    if(res.list.length>2000)throw new Error("terlalu banyak baris (maks 2000)");
    const dk=$("#kNew").value.trim()||S.lastKelas||"",t=$("#tNew").value,seen=new Set(S.students.map(s=>(s.nama.trim()+"|"+s.kelas).toLowerCase())),add=[];let dup=0;
    res.list.forEach(x=>{const kelas=x.kelas||dk,key=(x.nama+"|"+kelas).toLowerCase();if(seen.has(key)){dup++;return}seen.add(key);add.push({nama:x.nama,kelas})});
    if(!add.length)throw new Error("semua nama sudah ada ("+dup+" duplikat)");
    impPending={add,t};
    st.textContent="";
    const info=document.createElement("div");
    info.textContent=`${add.length} nama baru`+(dup?`, ${dup} duplikat dilewati`:"")+(sheet?` (sheet "${sheet}")`:"")+`. Kelas: ${res.hasKelas?"dari berkas":(dk||"(kosong)")}, template Kelas ${t}. Contoh: `+add.slice(0,3).map(x=>x.nama).join(", ")+(add.length>3?", …":"");
    const go=document.createElement("button");go.textContent="Tambahkan";go.className="p";
    const no=document.createElement("button");no.textContent="Batal";
    st.append(info,go,no);
    no.onclick=()=>{impPending=null;st.textContent="Dibatalkan."};
    go.onclick=()=>{
      if(S.students.length===1&&isEmpty(S.students[0]))S.students=[];
      const start=S.students.length;
      impPending.add.forEach(x=>newStudent(x.nama,x.kelas,impPending.t));
      S.cur=start;S.lastT=impPending.t;const n=impPending.add.length;impPending=null;
      save();renderPaper();st.textContent=`${n} siswa ditambahkan dari berkas.`;
    };
  }catch(err){st.textContent="Gagal impor: "+(err&&err.message||err)}
};

/* ---- input per mapel + KKTP per mapel ---- */
let mi=0;
const mList=()=>{const t=$("#mT").value,k=$("#mK").value;return S.students.map((s,i)=>({s,i})).filter(x=>x.s.t===t&&x.s.nama.trim()&&(!k||x.s.kelas===k))};
function fillMK(){
  const t=$("#mT").value,old=$("#mK").value;
  const ks=[...new Set(S.students.filter(s=>s.t===t&&s.nama.trim()).map(s=>s.kelas).filter(Boolean))];
  $("#mK").innerHTML='<option value="">Semua kelas</option>'+ks.map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join("");
  $("#mK").value=ks.includes(old)?old:"";
}
function fillMM(){const t=$("#mT").value;$("#mM").innerHTML=D.MAPEL[t].map((n,i)=>`<option value="${i}">${i+1}. ${esc(n)}</option>`).join("");$("#mM").value=mi}
function renderMapel(){
  const t=$("#mT").value,m=D.MAPEL[t];mi=Math.max(0,Math.min(mi,m.length-1));$("#mM").value=mi;
  $("#mKktp").value=S.kktp[t][mi]??"";$("#mKktp").classList.toggle("bad",bad(S.kktp[t][mi]));
  const L=mList();
  $("#mTable").innerHTML=L.length?`<table class="mt"><tr><th>No</th><th>Nama</th><th>Kelas</th><th>Nilai</th><th>Ket</th></tr>`+L.map((x,n)=>`<tr><td class="c">${n+1}</td><td>${esc(x.s.nama)}</td><td>${esc(x.s.kelas)}</td><td><input data-pm="${x.i}" inputmode="decimal" class="${bad(x.s.nilai[mi])?"bad":""}" value="${esc(x.s.nilai[mi]??"")}"></td><td class="c" data-pk="${x.i}"></td></tr>`).join("")+`</table>`:`<p class="muted">Belum ada siswa bernama untuk pilihan ini. Tambahkan siswa dulu di tab Lembar Siswa.</p>`;
  $("#mKK").innerHTML=m.map((n,i)=>`<label><span>${i+1}. ${esc(n)}</span><input data-kk="${i}" inputmode="decimal" class="${bad(S.kktp[t][i])?"bad":""}" value="${esc(S.kktp[t][i]??"")}"></label>`).join("");
  updMapelKet();
}
function updMapelKet(){
  const t=$("#mT").value;let filled=0;
  document.querySelectorAll("#mTable [data-pk]").forEach(td=>{
    const s=S.students[+td.dataset.pk];if(String(s.nilai[mi]??"").trim())filled++;
    const v=D.ketMapel(s.nilai[mi],S.kktp[t][mi]);td.textContent=v;td.className="c"+(v==="TIDAK TUNTAS"?" neg":"");
  });
  const total=document.querySelectorAll("#mTable [data-pm]").length;
  $("#mProg").textContent=total?`${filled} dari ${total} nilai terisi`+(String(S.kktp[t][mi]??"").trim()?"":" · isi KKTP agar keterangan muncul"):"";
}
$("#mT").onchange=()=>{mi=0;fillMK();fillMM();renderMapel()};
$("#mK").onchange=renderMapel;
$("#mM").onchange=()=>{mi=+$("#mM").value;renderMapel()};
$("#mPrev").onclick=()=>{mi--;renderMapel()};$("#mNext").onclick=()=>{mi++;renderMapel()};
$("#mKktp").oninput=e=>{const t=$("#mT").value;S.kktp[t][mi]=e.target.value;e.target.classList.toggle("bad",bad(e.target.value));const g=$(`#mKK [data-kk="${mi}"]`);if(g)g.value=e.target.value;save();updMapelKet()};
$("#mKktp").onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();const f=$("#mTable [data-pm]");f&&f.focus()}};
$("#mKK").addEventListener("input",e=>{const i=e.target.dataset.kk;if(i===undefined)return;const t=$("#mT").value;S.kktp[t][+i]=e.target.value;e.target.classList.toggle("bad",bad(e.target.value));if(+i===mi){$("#mKktp").value=e.target.value;$("#mKktp").classList.toggle("bad",bad(e.target.value))}save();updMapelKet()});
$("#mTable").addEventListener("input",e=>{
  const d=e.target.dataset;if(d.pm===undefined)return;
  S.students[+d.pm].nilai[mi]=e.target.value;e.target.classList.toggle("bad",bad(e.target.value));save();updMapelKet();
});
$("#mTable").addEventListener("keydown",e=>{
  if(e.key!=="Enter"||e.target.dataset.pm===undefined)return;e.preventDefault();
  const all=[...document.querySelectorAll("#mTable [data-pm]")],i=all.indexOf(e.target);
  if(all[i+1])all[i+1].focus();
});
$("#mTable").addEventListener("focusin",e=>e.target.select&&e.target.select());
renderPaper();
})();
