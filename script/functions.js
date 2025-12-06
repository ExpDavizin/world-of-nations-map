/*generics*/
Element.prototype.attrs = function (){
  if(arguments.length % 2 != 0){
    console.error(`Missig argument/value in .attrs()`);
  }
  for(let i = 0; i < arguments.length; i += 2){
    this.setAttribute(arguments[i], arguments[i+1]);
  }
};

Element.prototype.newElement = function (type){
  let el = document.createElement(type);
  this.appendChild(el);
  
  return el;
};

SVGGElement.prototype.newElement = function (type){
  let el = document.createElementNS("http://www.w3.org/2000/svg", type);
  this.appendChild(el);
  
  return el;
};

SVGGElement.prototype.newText = function (label){
  let txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
  txt.textContent = label;
  this.appendChild(txt);
  
  return txt;
};

Element.prototype.hasPointer = function (e, margin = 0){
  const box = this.getBoundingClientRect();
  
  if(e.clientX >= box.left - margin && e.clientX <= box.right + margin && e.clientY >= box.top - margin && e.clientY <= box.bottom + margin){
    return true;
  }
  else{
    return false;
  }
};

SVGPathElement.prototype.parsePath = function (){
  let parse = this.getAttribute("d").split(" ");
  let result = [];
  
  parse.forEach(point => {
    if(point != "Z"){
      let split = point.substring(1).split(",");
      result.push({"x": parseFloat(split[0]), "y": parseFloat(split[1])});
    }
  });
  
  return result;
};

Array.prototype.deparsePath = function (){
  let result = [];
  this.forEach((point, i) => {
    if(i === 0){
      result.push(`M${point.x},${point.y}`);
    }
    else{
      result.push(`L${point.x},${point.y}`);
    }
  });
  
  return result.join(" ");
};

Array.prototype.min = function() {
  return Math.min.apply(null, this);
};

function $(id){
  return document.getElementById(id);
}

function throttle(cb, delay = 1000) {
  
  let shouldWait = false
  let waitingArgs
  const timeoutFunc = () => {
    if (waitingArgs == null) {
      shouldWait = false
    } else {
      cb(...waitingArgs)
      waitingArgs = null
      setTimeout(timeoutFunc, delay)
    }
  }

  return (...args) => {
    if (shouldWait) {
      waitingArgs = args
      return
    }
    
    cb(...args)
    shouldWait = true
    
    setTimeout(timeoutFunc, delay)
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function rt(){
  if(arguments.length % 2 != 0){
    console.error(`Missig cssVar/value in rt()`);
  }
  for(let i = 0; i < arguments.length; i += 2){
    document.documentElement.style.setProperty(arguments[i], arguments[i+1]);
  }
}

function children(group){
  return [...group.children];
}

/*structure dependents*/
class Vertice{
  constructor(x, y, line, index){
    this.x = x;
    this.y = y;
    this.line = line;
    this.index = index;
  }
}

class Range{
  constructor(min, max){
    this.min = min;
    this.max = max;
  }
  
  contains(val){
    if(clamp(this.min, val, this.max) === val){
      return true;
    }
    else{
      return false;
    }
  }
}

class Interval{
  constructor(format, min, max){
    this.format = format;
    this.range = new Range(min, max);
  }
  
  getFormat(val){
    if(this.range.contains(val)){
      return this.format;
    }
  }
}

function dist(p1, p2){
  return Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2);
}

function middle(p1, p2){
  return {x: (p1.x + p2.x)/2, y: (p1.y + p2.y)/2};
}

function screenPerc(obj){
  return {x: obj.clientX/window.innerWidth, y: obj.clientY/window.innerHeight};
}

/*specifics*/
class World{
  constructor(size, center, seed){
    this.size = size;
    this.center = center;
    this.seed = seed;
  }
}

class MapView{
  constructor(x, y, vbx, vby){
    this.x = x;
    this.y = y;
    this.vbx = vbx;
    this.vby = vby;
    this.aspectRatio = window.innerWidth/window.innerHeight;
    this.isMoving = false;
    this.minvb = 16;
    this.maxvb = 2 * 12288;
  }
  
  center(){
    return {x:this.x + this.vbx/2, y:this.y + this.vby/2};
  }
  
  resize(){
    let c = this.center();
    
    this.updtAR();
    
    this.vbx = this.vby * this.aspectRatio;
    this.x = c.x - this.vbx/2;
    this.y = c.y - this.vby/2;
  }
  
  startVals(world){
    if(this.aspectRatio > 1){
      this.vbx = world.size;
      this.vby = world.size/this.aspectRatio;
      this.x = world.center.x - world.size/2;
      this.y = world.center.y - this.vby/2;
    }
    else{
      this.vby = world.size;
      this.vbx = world.size*this.aspectRatio;
      this.x = world.center.x - this.vbx/2;
      this.y = world.center.y - world.size/2;
    }
    rt("--zoom",Math.min(this.vbx, this.vby)/world.size);
  }
  
  updtAR(){
    this.aspectRatio = window.innerWidth/window.innerHeight;
  }
  
  updateVB(){
   $("map").setAttribute("viewBox",`${this.x} ${this.y} ${this.vbx} ${this.vby}`);
  }
  
  coord(e){
    return {x: this.x + screenPerc(e).x * this.vbx, y: this.y + screenPerc(e).y * this.vby};
  }
}

class Menu{
  constructor(){
    this.show = false;
  }
  
  toggle(){
    if(this.show === false){
      this.show = true;
    }
    else{
      this.show = false;
    }
    $("menu").dataset.show = this.show;
  }
}

class EditorMenu{
  constructor(){
    this.menu = null;
  }
  
  open(mode, e, data){
    if(mode === "vertice"){
      // data === closePtsArray
      if(!$("editorMenu")){
        this.menu = $("map_container").newElement("div").setAttribute("id", "editorMenu");
        ["cancelar", "novo ponto", "mover"].forEach(c => $("editorMenu").newElement("editorConfig").innerText = c);
      }
      $("editorMenu").style.left = e.layerX+"px";
      $("editorMenu").style.top = e.layerY+"px";
    }
  }
  
  close(){
    if($("editorMenu")){
      remove($("editorMenu"));
    }
  }
}

function updateLayers(){
  let form = null;
  
  async function data(){
    const response = await fetch("formatting.json");
    form = await response.json();
    //console.log(form);
  }
  
  if(form === null){
    data();
  }
  
  function update(){
    Promise.resolve(form).then((f) => {
      let vb = Math.max(view.vbx, view.vby);
      // nations
      // for each nation:
      children($("map_nations")).forEach(n => {
        // search interval:
        for(let i = 0; i < form.nations.length; i++){
          let v = new Interval(form.nations[i].format, form.nations[i].min, form.nations[i].max * n.getAttribute("emphasis"));
          if(v.range.contains(vb)){
            //n.setAttribute("data-format", v.format);
            console.log(n.getAttribute("abrev"), v.format);
            break;
          }
        } 
      });
    });
  }
  
  return {update};
}

async function plotLines(){
  const response = await fetch("data/lines.json");
  const lines = await response.json();
  //console.log(lines);
  lines.borders.forEach(line => {
    let l = $("map_lines").newElement("path");
    l.attrs("nations", line.nations, "data-type", line.type, "d", line.path);
  });
}

async function plotMaps(world){
  const response = await fetch("data/maps.json");
  const maps = await response.json();
  //console.log(maps);
  Object.keys(maps).forEach(lvl => {
    maps[lvl].content.forEach(map => {
        let m = $(`map_${lvl}`).newElement("image");
        m.attrs("x", map.x * maps[lvl].size + world.center.x, "y", map.y * maps[lvl].size + world.center.y, "width", maps[lvl].size, "height", maps[lvl].size,"href", map.link);
    });
  });
}

async function plotNations(){
  const response = await fetch("data/nations.json");
  const nations = await response.json();
  //console.log(nations);
  nations.forEach(nation => {
    let n = $("map_nations").newText(nation.name.label);
    n.attrs("x", nation.name.x, "y", nation.name.y, "emphasis", nation.name.emphasis, "leader", nation.leader, "area", nation.area, "wealth", nation.wealth, "pop", nation.pop, "abrev", nation.abrev, "flag", nation.flag, "start", nation.start, "end", nation.end);
  });
}
