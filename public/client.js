var socket = io();
var canvas;
var canvasSize;
var stage;
var current;

var selected = null;
var selectedPos = null;

var mode = 0;
var modeNames = ["Draw Mode", "Grab Mode", "Select Mode"];
var modeColors = ['rgb(28, 184, 65)','rgb(184, 65, 28)','rgb(65, 28, 184)'];

var segment = [];
var colorFill = "rgb(0,0,0)";
var colorStroke = "rgb(0,0,0)";

$(document).ready(function() {
  //--------------------------------(INITIALIZE)--------------------------------
  canvas = document.getElementById('canv');
  canvasSize = {
    x: canvas.getBoundingClientRect().width,
    y: canvas.getBoundingClientRect().height
  };

  stage = new createjs.Stage('canv');

  current = new createjs.Shape();
  stage.addChild(current);

  //start stage caching
  //stage.cache(0,0,canvasSize.x,canvasSize.y);

  //--------------------------------(HTML SETUP)--------------------------------
  addMode(0);

  //-----------------------------------(TEST)-----------------------------------


  //-------------------------------(DRAW / GRAB)--------------------------------
  //Listening for mouseup on canvas because mouse precision on stage
  //is much higher, resulting in huge floats.
  canvas.addEventListener("mouseup", function(evt){
    var mouse = getMouse(canvas, evt);
    if(mode === 0){
      segment.push(mouse);

      if(current.graphics.isEmpty()){
        current.graphics.beginStroke("rgb(0,0,0)");
        current.graphics.moveTo(mouse.x,mouse.y);
      }
      else{
        current.graphics.lineTo(mouse.x, mouse.y);
      }

      //stage.updateCache(0,0,canvasSize.x,canvasSize.y);
      stage.update();
    }
    if(mode === 1) {
      var newPos = {
        x: selected.x+mouse.x-selectedPos.x,
        y: selected.y+mouse.y-selectedPos.y
      };
      moveSelected(newPos);
    }
    if(mode === 2){
      selectedPos = getMouse(canvas, evt);
      selected = stage.getObjectUnderPoint(selectedPos.x, selectedPos.y, 0);
      console.log("Selected "+selected.id);
    }

  }, true);

  canvas.addEventListener("mousedown", function(evt){
    if(mode === 1) {
      selectedPos = getMouse(canvas, evt);
      selected = stage.getObjectUnderPoint(selectedPos.x, selectedPos.y, 0);
      console.log("Selected "+selected.id);
    }
  }, true);

  //-----------------------------------(PREVIEW)-----------------------------------
  var preview;
  canvas.addEventListener("mousemove", function(evt){
    try{
      if ($('#previewBox').is(':checked') && (segment.length>1)){
        stage.removeChild(preview);
        preview = new createjs.Shape()
        stage.addChild(preview);

        var mouse = getMouse(canvas, evt);
        var last = segment[segment.length-1];

        preview.graphics.beginStroke("rgb(0,0,0)");
        preview.graphics.moveTo(last.x, last.y);
        preview.graphics.lineTo(mouse.x, mouse.y);
      
        stage.update();
        }
      else {
        stage.removeChild(preview);
      }
    } catch (e){ console.log(e);}

  }, true);

  //-----------------------------------(SEND)-----------------------------------
  //Sending drawings
  function sendDrawing(closed){
    socket.emit('draw', {
      points: segment,
      close: closed,
      fillColor: ((colorFill) ? colorFill : "rgb(0,0,0)") ,
      strokeColor: ((colorStroke) ? colorStroke : "rgb(0,0,0)"),
      fill: $('#fillBox').is(':checked'),
      stroke: $('#strokeBox').is(':checked')
    });
    segment.length = 0;
    current.graphics.clear();
    return false;
  }

  //Sending drawings through buttons
  function sendDrawingHandler(event){
    return sendDrawing(event.data.closed);
  }

  //line button
  $('#line').click({closed:false}, sendDrawingHandler);

  //polygon button
  $('#poly').click({closed:true}, sendDrawingHandler);

  //move selected Shape
  function moveSelected(newPos) {
    socket.emit('move', {
      name: selected.name,
      p: newPos
    });
    selected = null;
    selectedPos = null;
  }

  function deleteSelected() {
    socket.emit('delete', selected.name);
    selected = null;
    selectedPos = null;
  }

  //---------------------------------(RECEIVE)----------------------------------
  //receiving whole canvas (triggered by socket.send(...) on server)
  socket.on('message', function(msg){
    for (var i = 0; i < msg.c.length; i++) {
      stage.addChildAt(buildShape(msg.c[i]), stage.numChildren-1);
    }
    for (var i = 0; i < msg.m.length; i++) {
      moveShape(msg.m[i]);
    }
    for (var i = 0; i < msg.d.length; i++) {
      deleteShape(msg.d[i]);
    }
    stage.update();
  });

  //receiving new drawing
  socket.on('draw', function(drawing){
    stage.addChildAt(buildShape(drawing), stage.numChildren-1);
    stage.update();
    for (var i = 0; i < stage.children.length; i++) {
      console.log(stage.children[i].name);
    }
  });

  socket.on('move', function(motion){
    moveShape(motion);
    stage.update();
  });

  socket.on('delete', function(deletedName){
    deleteShape(deletedName);
    stage.update();
  });

  //build Shape
  function buildShape(draw){
    try {
      var toShape = new createjs.Shape();
      //Stroke or fill
      if (draw.fill) {
        toShape.graphics.beginFill(draw.fillColor);
      }
      if (draw.stroke) {
        toShape.graphics.beginStroke(draw.strokeColor);
      }

      //Draws from last point to first
      var last = draw.points.length - 1;
      //Move "brush" to last point
      toShape.graphics.moveTo(draw.points[last].x, draw.points[last].y);
      //Line to all other points
      for (var i = last - 1; i >= 0; i--) {
        toShape.graphics.lineTo(draw.points[i].x, draw.points[i].y);
      };

      //If it's a polygon, close drawing
      if(draw.close) {
        toShape.graphics.closePath();
      }

      toShape.name = draw.name;
      return toShape;
    } catch (e) {
      console.log(e);
    } finally {

    }

  }

  //move Shape
  function moveShape(shapeMove){
    var child = stage.getChildByName(shapeMove.name);
    child.x = shapeMove.p.x;
    child.y = shapeMove.p.y;
  }

  function deleteShape(deletedName) {
    stage.removeChild(stage.getChildByName(deletedName));
  }

  //---------------------------(SHORTCUTS & CONTROLS)---------------------------
  //handles keyboard, for shortcuts
  $(document).keydown(function(event){
    if ( event.which == 13 ) {
      event.preventDefault();
    }

    switch (event.key) {
      case "F": case "f":
          $('#fillBox').prop('checked', !($('#fillBox').is(":checked")));
          (!($('#fillBox').is(":checked"))) ? $('#strokeBox').prop('checked', true) : false;
        break;
      case "S": case "s":
          $('#strokeBox').prop('checked', !($('#strokeBox').is(":checked")));
        break;
      case "L": case "l":
        sendDrawing(false);
        break;
      case "P": case "p":
        sendDrawing(true);
      case "M": case "m":
          addMode(1);
          break;
      case "X": case "x": case "Delete":
        deleteSelected();
        break;
      case "P": case "p":
          $('#previewBox').prop('checked', !($('#previewBox').is(":checked")));
        break;
      default:

    }

  });

  //change mode
  function addMode(v){
    mode = (mode+v)%3;
    segment.length = 0;
    current.graphics.clear();
    $('#mode').html(modeNames[mode]);
    $('#mode').css('background', modeColors[mode]);
  }

  //check strokeBox when fillBox is unchecked
  $('#fillBox').click(function(){
    (!($('#fillBox').is(":checked"))) ? $('#strokeBox').prop('checked', true) : false;
  });

});

function getMouse(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
}

function changeLineColor() {
  colorStroke = document.getElementById("linecolorpicker").value;
  console.log(typeof colorStroke);
}

function changeFillingColor() {
  colorFill = document.getElementById("fillingcolorpicker").value;
  console.log(typeof colorFill);
}

function getColorCode(isClosed) {
  if (isClosed){
    return document.getElementById("fillingcolorpicker").value;
  }
  return document.getElementById("linecolorpicker").value;
}

function exportPNG(){
  window.open(stage.canvas.toDataURL("image/png", '_blank'));
}

