const input=document.getElementById("fileInput");
const chooseBtn=document.getElementById("chooseBtn");
const fileList=document.getElementById("fileList");
const runBtn=document.getElementById("runBtn");
const status=document.getElementById("status");
const tool=document.body.dataset.tool;
let files=[];let busy=false;
function showStatus(message){status.textContent=message}
function sizeLabel(bytes){return bytes<1024*1024?(bytes/1024).toFixed(1)+" KB":(bytes/(1024*1024)).toFixed(2)+" MB"}
chooseBtn.addEventListener("click",()=>input.click());
input.addEventListener("change",()=>{
 const selected=Array.from(input.files||[]),isImage=tool==="image";
 const valid=selected.filter(file=>isImage?["image/jpeg","image/png"].includes(file.type):(file.type==="application/pdf"||file.name.toLowerCase().endsWith(".pdf")));
 if(valid.length!==selected.length)showStatus(isImage?"Please select JPG or PNG images.":"Please select valid PDF files.");else showStatus("");
 if(valid.some(file=>file.size>50*1024*1024)){showStatus("A file is larger than 50 MB. Please select smaller files.");input.value="";return}
 files=(tool==="merge"||tool==="image")?[...files,...valid].slice(0,30):valid.slice(0,1);
 input.value="";renderFiles();
});
function renderFiles(){
 fileList.replaceChildren();
 files.forEach((file,index)=>{
  const row=document.createElement("div");row.className="file-row";
  const icon=document.createElement("span");icon.className="pdf-icon";icon.textContent=tool==="image"?"IMG":"PDF";
  const info=document.createElement("div");info.className="file-info";
  const name=document.createElement("span");name.className="file-name";name.textContent=file.name;
  const size=document.createElement("p");size.className="file-size";size.textContent=sizeLabel(file.size);info.append(name,size);row.append(icon,info);
  if(tool==="merge"||tool==="image"){
   const actions=document.createElement("div");actions.className="file-actions";
   const remove=document.createElement("button");remove.type="button";remove.textContent="×";remove.setAttribute("aria-label","Remove "+file.name);remove.disabled=busy;remove.addEventListener("click",()=>{files.splice(index,1);renderFiles()});actions.append(remove);
   if(tool==="merge")for(const [symbol,delta] of [["↑",-1],["↓",1]]){const b=document.createElement("button");b.type="button";b.textContent=symbol;b.disabled=busy||index+delta<0||index+delta>=files.length;b.addEventListener("click",()=>{[files[index],files[index+delta]]=[files[index+delta],files[index]];renderFiles()});actions.append(b)}
   row.append(actions)
  }fileList.append(row)
 });
 runBtn.disabled=busy||files.length<1||(tool==="merge"&&files.length<2);
 runBtn.textContent=busy?"Processing…":({merge:`Merge ${files.length} PDF files →`,compress:"Optimize PDF →",image:"Create PDF →",split:"Extract pages →"}[tool]);
}
function downloadPdf(bytes,filename){const blob=new Blob([bytes],{type:"application/pdf"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);return blob.size}
async function mergePdfs(){const output=await PDFLib.PDFDocument.create();for(const file of files){const pdf=await PDFLib.PDFDocument.load(await file.arrayBuffer());const pages=await output.copyPages(pdf,pdf.getPageIndices());pages.forEach(p=>output.addPage(p))}downloadPdf(await output.save(),"lust-to-pdf-merged.pdf");showStatus("Success! Your merged PDF has been downloaded.")}
async function optimizePdf(){const file=files[0],pdf=await PDFLib.PDFDocument.load(await file.arrayBuffer()),bytes=await pdf.save({useObjectStreams:true}),size=downloadPdf(bytes,"lust-to-pdf-optimized.pdf");showStatus(`Original: ${sizeLabel(file.size)}. Output: ${sizeLabel(size)}. `+(size<file.size?`Saved ${Math.round((1-size/file.size)*100)}%.`:"This basic optimizer may not reduce the file size."))}
async function imagesToPdf(){const pdf=await PDFLib.PDFDocument.create();for(const file of files){const bytes=await file.arrayBuffer(),image=file.type==="image/png"?await pdf.embedPng(bytes):await pdf.embedJpg(bytes),page=pdf.addPage([image.width,image.height]);page.drawImage(image,{x:0,y:0,width:image.width,height:image.height})}downloadPdf(await pdf.save(),"lust-to-pdf-images.pdf");showStatus("Success! Your images have been converted to PDF.")}
async function splitPdf(){const file=files[0],source=await PDFLib.PDFDocument.load(await file.arrayBuffer()),total=source.getPageCount(),range=document.getElementById("pageRange").value.trim();if(!range)throw Error("Enter page numbers, e.g. 1, 3-5, 8.");const selected=new Set();for(const part of range.split(",")){const m=part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);if(!m)throw Error("Use page numbers like 1, 3-5, 8.");const start=Number(m[1]),end=Number(m[2]||m[1]);if(start<1||end<start||end>total)throw Error(`Pages must be between 1 and ${total}.`);for(let p=start;p<=end;p++)selected.add(p-1)}const output=await PDFLib.PDFDocument.create(),pages=await output.copyPages(source,[...selected]);pages.forEach(p=>output.addPage(p));downloadPdf(await output.save(),"lust-to-pdf-split.pdf");showStatus(`Success! Extracted ${pages.length} page(s).`)}
runBtn.addEventListener("click",async()=>{if(busy||!files.length)return;if(!window.PDFLib){showStatus("PDF library unavailable. Check your internet connection.");return}busy=true;renderFiles();showStatus("Processing files locally in your browser…");try{if(tool==="merge")await mergePdfs();if(tool==="compress")await optimizePdf();if(tool==="image")await imagesToPdf();if(tool==="split")await splitPdf()}catch(error){console.error(error);showStatus(error.message||"Something went wrong. Try another file.")}finally{busy=false;renderFiles()}});
renderFiles();
