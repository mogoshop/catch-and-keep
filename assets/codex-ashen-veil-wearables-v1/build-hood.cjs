// 공식 PSD의 edithere 두 레이어만 교체한다. origin/zmap/타입/가이드는 보존한다.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const deps = process.env.ASHEN_ART_NODE_MODULES || '/tmp/codex-avatar-tools/node_modules';
const sharp = require(path.join(deps, 'sharp'));
const { readPsd, writePsdBuffer, initializeCanvas } = require(path.join(deps, 'ag-psd'));
initializeCanvas(() => { throw new Error('Unexpected canvas'); }, (width,height) => ({width,height,data:new Uint8ClampedArray(width*height*4)}));
const root = __dirname;
const template = path.join(root,'native/template/Avatar_Cap_G.psd');
const digest = b => crypto.createHash('sha256').update(b).digest('hex');
const flatten = (layers, prefix='') => layers.flatMap(l => [{path:prefix+'/'+l.name,layer:l},...flatten(l.children||[],prefix+'/'+l.name)]);
function signature(l) { const {imageData,canvas,children,...meta}=l;return {meta,pixelHash:imageData?digest(Buffer.from(imageData.data)):null}; }
async function main() {
 const original=readPsd(fs.readFileSync(template),{useImageData:true,skipThumbnail:true});
 const psd=readPsd(fs.readFileSync(template),{useImageData:true,skipThumbnail:true});
 const edits=[['/case1.front/edithere:cap_cap_34','hood-front.png'],['/case2.back/edithere:cap_backCap_92','hood-back.png']];
 const nodes=flatten(psd.children);
 for(const [name,file] of edits) {
  const layer=nodes.find(n=>n.path===name).layer;
  const width=layer.right-layer.left,height=layer.bottom-layer.top;
  const image=await sharp(path.join(root,'frames',file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if(image.info.width!==width||image.info.height!==height)throw Error('Template rectangle mismatch: '+file);
  layer.imageData={width,height,data:new Uint8ClampedArray(image.data)};delete layer.canvas;
 }
 const overlays=[];
 async function draw(layers, visible=true){for(const l of layers){if(!visible||l.hidden)continue;if(l.children){await draw(l.children,true);continue;}if(l.imageData){const {width,height,data}=l.imageData;const input=await sharp(Buffer.from(data),{raw:{width,height,channels:4}}).png().toBuffer();overlays.push({input,left:l.left,top:l.top});}}}
 await draw(psd.children);
 const merged=await sharp({create:{width:psd.width,height:psd.height,channels:4,background:'#00000000'}}).composite(overlays).raw().toBuffer();
 psd.imageData={width:psd.width,height:psd.height,data:new Uint8ClampedArray(merged)};
 delete psd.canvas;delete psd.thumbnail;delete psd.thumbnailRaw;
 const output=path.join(root,'native/AshenVeil_Hood.psd');fs.writeFileSync(output,writePsdBuffer(psd));
 const saved=readPsd(fs.readFileSync(output),{useImageData:true,skipThumbnail:true});
 const a=flatten(original.children),b=flatten(saved.children),paint=new Set(edits.map(x=>x[0]));
 const all= a.map((n,i)=>{const actual=b[i];if(!actual||actual.path!==n.path)throw Error('Layer order/name changed'); const s=signature(n.layer),t=signature(actual.layer);const equal=JSON.stringify(s)===JSON.stringify(t);if(!paint.has(n.path)&&!equal)throw Error('Protected layer changed: '+n.path);if(paint.has(n.path)&&JSON.stringify(s.meta)!==JSON.stringify(t.meta))throw Error('Paint rectangle/metadata changed');return {path:n.path,protected:!paint.has(n.path),unchanged:equal};});
 if(a.length!==b.length)throw Error('Layer count changed');
 await sharp(merged,{raw:{width:psd.width,height:psd.height,channels:4}}).resize(1200,720,{kernel:'nearest'}).png().toFile(path.join(root,'previews/hood-template-preview.png'));
 const checks={templateGuide:'https://maplestoryworlds-creators.nexon.com/en/docs?postId=682',templateSha256:digest(fs.readFileSync(template)),outputSha256:digest(fs.readFileSync(output)),width:saved.width,height:saved.height,layerCount:b.length,protectedLayersUnchanged:true,editedLayers:edits.map(x=>x[0]),compositeNonempty:saved.imageData.data.some(x=>x!==0),makerImportVerified:false,uploaded:false,ruid:null,layers:all};
 fs.writeFileSync(path.join(root,'native/hood-checks.json'),JSON.stringify(checks,null,2)+'\n');console.log(JSON.stringify({layerCount:b.length,protectedLayersUnchanged:true,compositeNonempty:checks.compositeNonempty,makerImportVerified:false}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
