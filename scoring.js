'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm');
var testId=process.argv[2];
var gradingDir=process.argv[3]||__dirname;
var projectRoot=path.resolve(gradingDir,'..');
var htmlFile=path.join(projectRoot,'index.html');
var pass=function(m){process.stdout.write('[PASS] '+m+'\n');process.exit(0);};    
var fail=function(m){process.stdout.write('[FAIL] '+m+'\n');process.exit(1);};    
if(testId==='file_exists'){
  if(fs.existsSync(htmlFile))pass('index.html found');
  else fail('index.html not found');
}
if(!fs.existsSync(htmlFile))fail('index.html not found');
var html=fs.readFileSync(htmlFile,'utf8');
if(testId==='basic_structure'){
  if(!/<!DOCTYPE\s+html/i.test(html))fail('Missing DOCTYPE html');
  if(!/<html[\s>]/i.test(html))fail('Missing <html> tag');
  if(!/<head[\s>]/i.test(html))fail('Missing <head> tag');
  if(!/<body[\s>]/i.test(html))fail('Missing <body> tag');
  if(!/<title[\s>]/i.test(html))fail('Missing <title> tag');
  pass('basic_structure OK');
}
if(testId==='ui_elements'){
  var ids=['product-table','input-name','input-price','input-quantity','btn-add'];
  for(var _i=0;_i<ids.length;_i++){
    var re=new RegExp('id\\s*=\\s*["\']'+ids[_i]+'["\']');
    if(!re.test(html))fail('Missing element with id="'+ids[_i]+'"');
  }
  pass('ui_elements OK');
}
var byId={};
function mkEl(tag){
  var el={
    _tag:(tag||'div').toUpperCase(),_children:[],_attrs:{},_listeners:{},
    id:'',className:'',value:'',style:{},dataset:{},_rawText:'',
    get tagName(){return this._tag;},
    get textContent(){var parts=[];(function c(n){if(!n)return;if(n._tag==='#T'){parts.push(n._rawText||'');return;}if(n._children&&n._children.length)n._children.forEach(c);else if(n._rawText)parts.push(n._rawText);})(this);return parts.join('');},
    set textContent(v){this._children=[{_tag:'#T',_rawText:String(v),_children:[]}];},
    get innerHTML(){return this._children.map(function(c){if(!c||!c._tag)return String(c||'');if(c._tag==='#T')return c._rawText||'';var a=Object.keys(c._attrs||{}).map(function(k){return' '+k+'="'+c._attrs[k]+'"';}).join('');return'<'+c._tag.toLowerCase()+a+'>'+c.innerHTML+'</'+c._tag.toLowerCase()+'>';}).join('');},
    set innerHTML(v){
      this._children=[];
      var s=String(v||'');if(!s.trim())return;
      if(/<tr[\s>]/i.test(s)){
        var trRe=/<tr([^>]*)>([\s\S]*?)<\/tr>/gi,trM;
        while((trM=trRe.exec(s))!==null){
          var tr=mkEl('tr');parseAttrs(tr,trM[1]);
          var cellRe=/<t[dh]([^>]*)>([\s\S]*?)<\/t[dh]>/gi,cM;
          while((cM=cellRe.exec(trM[2]))!==null){var td=mkEl('td');td._rawText=cM[2].replace(/<[^>]+>/g,'').trim();td._children=[{_tag:'#T',_rawText:td._rawText,_children:[]}];parseAttrs(td,cM[1]);tr._children.push(td);}
          this._children.push(tr);}
        return;}
      if(/<t[dh][\s>]/i.test(s)){
        var cellRe2=/<t[dh]([^>]*)>([\s\S]*?)<\/t[dh]>/gi,cM2;
        while((cM2=cellRe2.exec(s))!==null){var td2=mkEl('td');td2._rawText=cM2[2].replace(/<[^>]+>/g,'').trim();td2._children=[{_tag:'#T',_rawText:td2._rawText,_children:[]}];parseAttrs(td2,cM2[1]);this._children.push(td2);}
        return;}
      this._rawText=s.replace(/<[^>]+>/g,'').trim();
      if(this._rawText)this._children=[{_tag:'#T',_rawText:this._rawText,_children:[]}];},
    appendChild:function(child){if(child){this._children.push(child);regId(child);}return child;},   
    removeChild:function(child){var i=this._children.indexOf(child);if(i>=0)this._children.splice(i,1);return child;},
    insertBefore:function(n,ref){var i=this._children.indexOf(ref);if(i>=0)this._children.splice(i,0,n);else this._children.push(n);return n;},
    setAttribute:function(k,v){this._attrs[k]=String(v);if(k==='id'){this.id=String(v);byId[v]=this;}if(k==='class')this.className=String(v);if(k.indexOf('data-')===0)this.dataset[k.slice(5)]=String(v);},
    getAttribute:function(k){return this._attrs[k]!==undefined?this._attrs[k]:null;},
    hasAttribute:function(k){return k in this._attrs;},
    removeAttribute:function(k){delete this._attrs[k];},
    addEventListener:function(type,fn){if(!this._listeners[type])this._listeners[type]=[];this._listeners[type].push(fn);},
    removeEventListener:function(type,fn){if(this._listeners[type])this._listeners[type]=this._listeners[type].filter(function(f){return f!==fn;});},
    click:function(){var e={type:'click',target:this,currentTarget:this,preventDefault:function(){},stopPropagation:function(){},bubbles:true};(this._listeners['click']||[]).forEach(function(fn){fn(e);});},
    dispatchEvent:function(e){var type=(e&&e.type)?e.type:String(e);var ev=(e&&typeof e==='object')?e:{type:type,target:this,preventDefault:function(){},stopPropagation:function(){}};(this._listeners[type]||[]).forEach(function(fn){fn(ev);});return true;},
    querySelectorAll:function(sel){return qsAll(this,sel);},
    querySelector:function(sel){return qsAll(this,sel)[0]||null;},
    getElementsByTagName:function(tag){return getByTag(this,tag.toUpperCase());},
    contains:function(){return false;},
    matches:function(sel){return matchEl(this,sel.trim());}
  };
  return el;
}
function regId(n){if(!n||!n._tag)return;if(n.id)byId[n.id]=n;if(n._children)n._children.forEach(regId);}
function parseAttrs(el,str){if(!str)return;var re=/([\w-]+)\s*=\s*(?:"([^"]*)"||'([^']*)'|(\S+))/g,m;while((m=re.exec(str))!==null)el.setAttribute(m[1],m[2]!==undefined?m[2]:(m[3]!==undefined?m[3]:(m[4]||'')));}
function matchEl(el,sel){
  if(!el||!el._tag||el._tag==='#T')return false;
  if(sel==='*')return true;
  if(/^#[\w-]+$/.test(sel))return el.id===sel.slice(1);
  if(/^\.[\w-]+$/.test(sel))return(' '+el.className+' ').indexOf(' '+sel.slice(1)+' ')>=0;
  if(/^[\w-]+$/.test(sel))return el._tag===sel.toUpperCase();
  var tm=sel.match(/^([\w-]+)#([\w-]+)$/);if(tm)return el._tag===tm[1].toUpperCase()&&el.id===tm[2]; 
  var dm=sel.match(/^\[data-([\w-]+)\]$/);if(dm)return dm[1] in el.dataset;
  return false;}
function qsAll(root,sel){
  if(!root)return[];
  var parts=sel.trim().split(/\s+/);
  if(parts.length===1){
    var s=parts[0];
    if(/^#[\w-]+$/.test(s)){var f=byId[s.slice(1)];return f?[f]:[];}
    var res=[];(function walk(n){if(!n||!n._children)return;for(var i=0;i<n._children.length;i++){var c=n._children[i];if(c&&c._tag&&c._tag!=='#T'){if(matchEl(c,s))res.push(c);walk(c);}}})(root);return 
res;}
  var parents=qsAll(root,parts.slice(0,-1).join(' '));
  var last=parts[parts.length-1],result=[];
  for(var pi=0;pi<parents.length;pi++){var kids=qsAll(parents[pi],last);for(var ki=0;ki<kids.length;ki++)result.push(kids[ki]);}
  return result;}
function getByTag(root,tag){var res=[];(function walk(n){if(!n||!n._children)return;for(var i=0;i<n._children.length;i++){var c=n._children[i];if(c&&c._tag===tag)res.push(c);if(c&&c._children)walk(c);}})(root);return res;}
function buildDOM(productsData){
  byId={};
  var tableEl=mkEl('table');tableEl.id='product-table';byId['product-table']=tableEl;
  var thead=mkEl('thead'),theadTr=mkEl('tr');
  var thRe=/<th([^>]*)>([\s\S]*?)<\/th>/gi,thM;
  while((thM=thRe.exec(html))!==null){var th=mkEl('th');parseAttrs(th,thM[1]);var txt=thM[2].replace(/<[^>]+>/g,'').trim();th._rawText=txt;th._children=[{_tag:'#T',_rawText:txt,_children:[]}];theadTr._children.push(th);}
  thead._children.push(theadTr);
  var tbody=mkEl('tbody');tableEl._children=[thead,tbody];
  var ni=mkEl('input');ni.id='input-name';byId['input-name']=ni;
  var ci=mkEl('input');ci.id='input-category';byId['input-category']=ci;
  var pi=mkEl('input');pi.id='input-price';byId['input-price']=pi;
  var qi=mkEl('input');qi.id='input-quantity';byId['input-quantity']=qi;
  var btn=mkEl('button');btn.id='btn-add';byId['btn-add']=btn;
  var form=mkEl('form');form.id='product-form';byId['product-form']=form;form._children=[ni,ci,pi,qi,btn];
  var idRe=/id\s*=\s*["']([\w-]+)["']/g,idM;
  while((idM=idRe.exec(html))!==null){if(!byId[idM[1]]){var el=mkEl('div');el.id=idM[1];byId[idM[1]]=el;}}
  var body=mkEl('body');body._children=[form,tableEl];
  function MockXHR(){}
  MockXHR.prototype.open=function(m,u){this._url=u;};
  MockXHR.prototype.send=function(){var self=this;setImmediate(function(){self.readyState=4;self.status=200;self.responseText=JSON.stringify(productsData);if(self.onreadystatechange)self.onreadystatechange();});};
  var document={_body:body,createElement:function(tag){return mkEl(tag);},createTextNode:function(t){return{_tag:'#T',_rawText:String(t),_children:[]};},getElementById:function(id){return byId[id]||null;},querySelector:function(sel){return qsAll(body,sel)[0]||null;},querySelectorAll:function(sel){return qsAll(body,sel);},getElementsByTagName:function(tag){return getByTag(body,tag.toUpperCase());},get 
body(){return body;},addEventListener:function(){},readyState:'complete'};
  var window={document:document,XMLHttpRequest:MockXHR,setTimeout:global.setTimeout,setInterval:global.setInterval,clearTimeout:global.clearTimeout,clearInterval:global.clearInterval,setImmediate:global.setImmediate,JSON:JSON,parseInt:parseInt,parseFloat:parseFloat,isNaN:isNaN,isFinite:isFinite,Number:Number,String:String,Array:Array,Object:Object,Boolean:Boolean,Math:Math,console:console,Event:function(type,init){this.type=type;this.bubbles=false;this.cancelable=false;if(init){this.bubbles=!!init.bubbles;this.cancelable=!!init.cancelable;}this.preventDefault=function(){};this.stopPropagation=function(){};}};
  window.window=window;
  return{document:document,window:window};}
function getScript(){var scripts=[],re=/<script(?:[^>]*)>([\s\S]*?)<\/script>/gi,m;while((m=re.exec(html))!==null)if(!m[0].match(/src\s*=/i))scripts.push(m[1]);return scripts.join('\n');}
function runPage(productsData,callback){
  var dom=buildDOM(productsData);
  var ctx=vm.createContext(Object.assign({},dom.window,{document:dom.document}));
  try{vm.runInContext(getScript(),ctx,{timeout:2000});}catch(e){}
  setImmediate(function(){setImmediate(function(){callback(dom.document,dom.window);});});}
var PRODUCTS=[
  {id:1,name:'May giat',     category:'Dien gia dung',price:8500000, quantity:5 },
  {id:2,name:'Dieu hoa',     category:'Dien gia dung',price:12000000,quantity:3 },
  {id:3,name:'Tu lanh',      category:'Dien gia dung',price:9000000, quantity:7 },
  {id:4,name:'Laptop',       category:'Dien tu',      price:15000000,quantity:10},
  {id:5,name:'Dien thoai',   category:'Dien tu',      price:7500000, quantity:15},
  {id:6,name:'May tinh bang',category:'Dien tu',      price:6000000, quantity:8 }
];
if(testId==='data_loaded'){
  runPage(PRODUCTS,function(doc){
    var table=doc.getElementById('product-table');
    if(!table)fail('Element id="product-table" not found');
    var rows=table.querySelectorAll('tbody tr');
    if(rows.length<6)fail('Expected >= 6 rows in tbody, found '+rows.length);
    var txt=table.textContent;
    if(txt.indexOf('Laptop')<0)fail('"Laptop" not found in table');
    if(txt.indexOf('15000000')<0&&txt.indexOf('15,000,000')<0&&txt.indexOf('15.000.000')<0)
      fail('Price 15000000 not found in table');
    pass('data_loaded OK');
  });
}else if(testId==='table_sort'){
  runPage(PRODUCTS,function(doc){
    var table=doc.getElementById('product-table');
    if(!table)fail('Element id="product-table" not found');
    var rows0=table.querySelectorAll('tbody tr');
    if(rows0.length<6)fail('Table not populated ('+rows0.length+' rows)');
    /* record order before click */
    var namesBefore=[];
    for(var j=0;j<rows0.length;j++){
      var cells0=rows0[j].querySelectorAll('td');
      for(var k=0;k<cells0.length;k++){
        var ct0=(cells0[k].textContent||'').trim();
        for(var p0=0;p0<PRODUCTS.length;p0++){if(PRODUCTS[p0].name===ct0){namesBefore.push(ct0);break;}}
        if(namesBefore.length>j)break;}}
    /* find name header */
    var ths=table.querySelectorAll('th'),nameHeader=null;
    for(var i=0;i<ths.length;i++){
      var t=(ths[i].textContent||'').trim().toLowerCase();
      if(t.indexOf('t\xean')>=0||t.indexOf('ten')>=0||t.indexOf('name')>=0||(ths[i].dataset&&ths[i].dataset.sort==='name')){nameHeader=ths[i];break;}}
    if(!nameHeader)fail('Name column header not found (must contain "ten", "name")');
    nameHeader.click();
    setImmediate(function(){
      var rows1=table.querySelectorAll('tbody tr');
      if(rows1.length<2)fail('Rows disappeared after sort');
      var namesAfter=[];
      for(var j2=0;j2<rows1.length;j2++){
        var cells=rows1[j2].querySelectorAll('td');
        for(var k2=0;k2<cells.length;k2++){
          var ct=(cells[k2].textContent||'').trim();
          for(var p=0;p<PRODUCTS.length;p++){if(PRODUCTS[p].name===ct){namesAfter.push(ct);break;}}  
          if(namesAfter.length>j2)break;}}
      if(namesAfter.length<2)fail('Could not read product names after sort ('+rows1.length+' rows)');      var asc=namesAfter.slice().sort(function(a,b){return a.localeCompare(b);});
      var desc=namesAfter.slice().sort(function(a,b){return b.localeCompare(a);});
      var isAsc=namesAfter.join('|')===asc.join('|');
      var isDesc=namesAfter.join('|')===desc.join('|');
      /* also verify order changed (not same as before) or is sorted */
      if(!isAsc&&!isDesc)fail('Data not sorted after click (got: '+namesAfter.join(', ')+')');       
      /* click again — order should reverse */
      nameHeader.click();
      setImmediate(function(){
        var rows2=table.querySelectorAll('tbody tr');
        var namesAfter2=[];
        for(var j3=0;j3<rows2.length;j3++){
          var cells3=rows2[j3].querySelectorAll('td');
          for(var k3=0;k3<cells3.length;k3++){
            var ct3=(cells3[k3].textContent||'').trim();
            for(var p3=0;p3<PRODUCTS.length;p3++){if(PRODUCTS[p3].name===ct3){namesAfter2.push(ct3);break;}}
            if(namesAfter2.length>j3)break;}}
        if(namesAfter2.length>=2){
          var sameOrder=namesAfter2.join('|')===namesAfter.join('|');
          if(sameOrder)fail('Order did not change on second click (toggle not working)');
        }
        pass('table_sort OK');
      });
    });
  });
}else if(testId==='form_add'){
  runPage(PRODUCTS,function(doc){
    var table=doc.getElementById('product-table');
    if(!table)fail('Element id="product-table" not found');
    var before=table.querySelectorAll('tbody tr').length;
    var ni=doc.getElementById('input-name'),pi=doc.getElementById('input-price'),qi=doc.getElementById('input-quantity'),btn=doc.getElementById('btn-add');
    if(!ni)fail('Missing id="input-name"');
    if(!pi)fail('Missing id="input-price"');
    if(!qi)fail('Missing id="input-quantity"');
    if(!btn)fail('Missing id="btn-add"');
    ni.value='Lo vi song';pi.value='2500000';qi.value='4';
    var ci2=doc.getElementById('input-category');if(ci2)ci2.value='Dien gia dung';
    btn.click();
    var frm=doc.querySelector('form');
    if(frm){try{frm.dispatchEvent({type:'submit',preventDefault:function(){},target:frm});}catch(e){}}
    setImmediate(function(){
      var after=table.querySelectorAll('tbody tr').length;
      if(after<=before)fail('Row count did not increase (before:'+before+' after:'+after+')');       
      if((table.textContent||'').indexOf('Lo vi song')<0)fail('"Lo vi song" not found in table after 
add');
      pass('form_add OK');
    });
  });
}else{
  fail('Unknown test id: '+testId);
}