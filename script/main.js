const world = new World(12288,{x:-64, y:-64}, -7053382911604101310);
const view = new MapView(world.center.x - world.size/2, world.center.y - world.size/2, world.size, world.size);
const menu = new Menu();
const editorMenu = new EditorMenu();
const layers = updateLayers();
let configs = {"nationsBorders":1, "nationNames":1}
let save = [];
const editorMode = true;

const mobileMove = throttle((e) => {
  if(view.isMoving){
    switch(save["touches"]){
      case 1:
        view.x = save["touchCoords"].x - screenPerc(e.touches[0]).x*view.vbx;
        view.y = save["touchCoords"].y - screenPerc(e.touches[0]).y*view.vby;
      break;
      case 2:
        if(e.touches[1] != undefined){
          save["centerPercs"] = middle(screenPerc(e.touches[0]), screenPerc(e.touches[1]));
          view.vbx = clamp(view.minvb, save["vbx"]/dist(screenPerc(e.touches[0]), screenPerc(e.touches[1]))*save["distPerc"], view.maxvb);
          view.vby = clamp(view.minvb, save["vby"]/dist(screenPerc(e.touches[0]), screenPerc(e.touches[1]))*save["distPerc"], view.maxvb);
          view.x = save["centerCoords"].x - save["centerPercs"].x*view.vbx;
          view.y = save["centerCoords"].y - save["centerPercs"].y*view.vby;
          rt("--zoom", Math.max(view.vby, view.vbx)/world.size);
        }
      break;
    }
    view.updateVB();
  }
}, 25);

const viewZoom = throttle((e) => {
  save["wheelCoords"] = view.coord(e);
      
  if(view.aspectRatio < 1){
    view.vby = clamp(view.minvb, view.vby + e.deltaY/window.innerHeight*view.vby, view.maxvb);
    view.vbx = view.vby*view.aspectRatio;
    // console.log(view.vby/world.size);
    rt("--zoom", view.vby/world.size);
  }
  else{
    view.vbx = clamp(view.minvb, view.vbx + e.deltaY/window.innerWidth*view.vbx, view.maxvb);
    view.vby = view.vbx/view.aspectRatio;
    // console.log(view.vbx/world.size);
    rt("--zoom", view.vbx/world.size);
  }
  
  view.x = save["wheelCoords"].x - screenPerc(e).x*view.vbx;
  view.y = save["wheelCoords"].y - screenPerc(e).y*view.vby;
  
  layers.update();
  view.updateVB();
}, 50);

const viewMove = throttle((e) => {
  view.x = save["mouseCoords"].x - screenPerc(e).x*view.vbx;
  view.y = save["mouseCoords"].y - screenPerc(e).y*view.vby;
  view.updateVB();
}, 25);

const mobileMark = (e) => {
  [...$("map_lines").querySelectorAll('[marked="true"]')].forEach(line => {
    line.setAttribute("marked", "false");
  });
    
  if(e.target.getAttribute("marked") === "true"){
    e.target.setAttribute("marked", "false");
  }
  else{
    [...$("map_lines").querySelectorAll("path")].forEach(line => {
      if(line.getAttribute("nations").includes(e.target.getAttribute("abrev"))){
        line.setAttribute("marked", "true")
      }
    });
    e.target.setAttribute("marked", "true");
  }
};

const pointSeletor = throttle((e) => {
  const range = 100;
  
  let linesInRange = [];
  children($("map_lines")).forEach(line => {
    if(line.hasPointer(e, 50)){
      linesInRange.push(line);
    }
  });
  
  let dists = [];
  let pointsInRange = [];
  linesInRange.forEach(line => {
    let point = line.parsePath();
    point.forEach((p, i) => {
      let d = dist(view.coord(e), p);
      if(d <= range){
        dists.push(d);
        let v = new Vertice(p.x, p.y, line, i);
        v.dist = d;
        pointsInRange.push(v);
      }
    });
  });
  // console.log(dists);
  // console.log(pointsInRange);
  let minDist = dists.min();
  let closestPoints = [];
  pointsInRange.forEach(point => {
    if(point.dist === minDist){
      closestPoints.push(point);
    }
  });
  
  save["closestPoints"] = closestPoints;
  
  if(closestPoints.length != 0){
    //console.log(closestPoints);
    if(!$("selector")){
      let s = $("editor").newElement("circle");
      s.attrs("cx", closestPoints[0].x, "cy", closestPoints[0].y, "id", "selector");
    }
    else{
      $("selector").attrs("cx", closestPoints[0].x, "cy", closestPoints[0].y);
    }
  }
  else if($("selector")){
    $("selector").remove();
  }
}, 150);

if(editorMode === true){
  $("map").addEventListener("mousemove", e => {
    e.preventDefault();
    
    pointSeletor(e);
  });
  
  $("map").addEventListener("click", e => {
    if(save["closestPoints"].length != 0){
      editorMenu.open("vertice", e, save["closestPoints"]);
    }
  });
}

document.addEventListener("click", (e) => {
  if(e.target.matches("#menu_button") || e.target.matches(".return")){
    menu.toggle();
  }
});

window.addEventListener("resize", () => {
  view.resize();
  view.updateVB();
});

window.addEventListener("load", () => {
  plotLines();
  plotMaps("maps.json", world);
  plotNations("nations.json");
  
  view.startVals(world);
  view.updateVB();
});

if(navigator.userAgentData.mobile){
  $("map_nations").addEventListener("touchstart", (e) => {
    mobileMark(e);
  });
  
  $("map").addEventListener("touchstart", e => {
    e.preventDefault();
    
    view.isMoving = true;
    save["touches"] = e.touches.length;
    
    switch(save["touches"]){
      case 1:
        save["touchCoords"] = view.coord(e.touches[0]);
      break;
      case 2:
        save["centerCoords"] = middle(view.coord(e.touches[0]), view.coord(e.touches[1]));
        save["distPerc"] = dist(screenPerc(e.touches[0]), screenPerc(e.touches[1]));
        save["vbx"] = view.vbx;
        save["vby"] = view.vby;
      break;
    }
  });
  
  document.addEventListener("touchend", e => {
    if(save["touches"] <= 1){
      view.isMoving = false;
    }
  });
  
  document.addEventListener("touchmove", e => {
    mobileMove(e);
  });
}
else{
  $("map_nations").addEventListener("mouseover", (e) => {
    [...$("map_lines").querySelectorAll("path")].forEach(line => {
      if(line.getAttribute("nations").includes(e.target.getAttribute("abrev"))){
        line.setAttribute("marked", "true");
      }
    });
  });
  
  $("map_nations").addEventListener("mouseleave", (e) => {
    [...$("map_lines").querySelectorAll('[marked="true"]')].forEach(line => {
      line.setAttribute("marked", "false");
    });
  });
  
  $("map").addEventListener("mousedown", e => {
    e.preventDefault();
    
    view.isMoving = true;
    save["mouseCoords"] = view.coord(e);
  });
  
  $("map").addEventListener("mouseup", e => {
    view.isMoving = false;
  });
  
  document.addEventListener("mousemove", e => {
    e.preventDefault();
    
    if(view.isMoving){
      viewMove(e);
    }
  });
  
  $("map").addEventListener("wheel", e => {
    e.preventDefault();
    
    viewZoom(e);
  });
}