//The socket establishes connection with the server
var socket = io();
//Canvas DOM element
var canvas;
var canvasSize;
//EaselJS stage, to manage the canvas and it's children
var stage;

//Shape currently being drawn
var current;
//Line real-time preview
var preview;

//Selected shape and position in which it was hit
var selected = null;
var selectedPos = null;

//Application mode, arrays with three mode names and color for the mode button
var mode = 0;
var modeNames = ["Draw Mode (M)", "Grab Mode (M)", "Select Mode (M)"];
var modeColors = ['rgb(28, 184, 65)','rgb(184, 65, 28)','rgb(65, 28, 184)'];

//Contains the consecutive points of the current shape
//For more information on why this exists, check comments on: 
//function sendDrawing(closed)
var segment = [];

//Fill color
var colorFill = "rgb(0,0,0)";
//Stroke color
var colorStroke = "rgb(0,0,0)";

$(document).ready(function() {
  //--------------------------------(INITIALIZE)--------------------------------
  canvas = document.getElementById('canv');
  canvasSize = {
    x: canvas.getBoundingClientRect().width,
    y: canvas.getBoundingClientRect().height
  };

  stage = new createjs.Stage('canv');

  //This shape will be always drawn and overwritten, it's a permanent child
  current = new createjs.Shape();
  stage.addChild(current);

  //--------------------------------(HTML SETUP)--------------------------------
  //Set up Mode button
  addMode(0);
  //Update colors on color selectors
  changeLineColor();
  changeFillingColor();


  //-------------------------------(DRAW / GRAB)--------------------------------
  //Listening for mouseup on canvas because mouse precision on stage
  //is much higher, resulting in huge floats.
  canvas.addEventListener("mouseup", function(evt){
    var mouse = getMouse(canvas, evt);
    //when drawing
    if(mode === 0){
      segment.push(mouse);

      if(current.graphics.isEmpty()){
        current.graphics.beginStroke("rgb(0,255,0)");
        current.graphics.moveTo(mouse.x,mouse.y);
      }
      else{
        current.graphics.lineTo(mouse.x, mouse.y);
      }
      stage.update();
    }
    //when grabbing
    if(mode === 1) {
      var newPos = {
        x: selected.x+mouse.x-selectedPos.x,
        y: selected.y+mouse.y-selectedPos.y
      };
      moveSelected(newPos);
    }
    //when selecting
    if(mode === 2){
      try{
        selectedPos = getMouse(canvas, evt);
        selected = stage.getObjectUnderPoint(selectedPos.x, selectedPos.y, 0);
        $('#mode').css('background', "rgb(60, 0, 255)");
      } catch (e){
        $('#mode').css('background', modeColors[mode]);
      }
    }

  }, true);

  canvas.addEventListener("mousedown", function(evt){
    //when grabbing: start grab
    if(mode === 1) {
      try{
        selectedPos = getMouse(canvas, evt);
        selected = stage.getObjectUnderPoint(selectedPos.x, selectedPos.y, 0);
        $('#mode').css('background', "rgb(60, 0, 255)");
      } catch (e){
        $('#mode').css('background', modeColors[mode]);
      }
    }
  }, true);

  //---------------------------------(PREVIEW)----------------------------------
  //preview stroke. keeps updating stage: VERY COSTLY!
  canvas.addEventListener("mousemove", function(evt){
    try{
      if ($('#previewBox').is(':checked') && (segment.length>0) && (mode === 0)){
        stage.removeChild(preview);
        preview = new createjs.Shape()
        stage.addChild(preview);

        var mouse = getMouse(canvas, evt);
        var last = segment[segment.length-1];

        preview.graphics.beginStroke("rgb(255,0,0)");
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
  //Instead of sending the current shape, we send the segment array with some
  //additional parameters on how to reproduce the shape on the other cients.
  //Why?
  //Because EaseJS's Shape class stores a huge amount of data, far more than we
  //need to share the shapes.
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
    //Clear current shape, to start new shape
    current.graphics.clear();
    //End this preview
    stage.removeChild(preview);
    //Update stage
    stage.update();
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

  //Delete selected shape
  function deleteSelected() {
    socket.emit('delete', selected.name);
    selected = null;
    selectedPos = null;
  }

  //---------------------------------(RECEIVE)----------------------------------
  //receiving whole canvas (triggered by socket.send(...) on server)
  //Received when connects to a server with some elements on its canvas
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
  });

  //receiving a motion command
  socket.on('move', function(motion){
    moveShape(motion);
    stage.update();
  });

  //receiving a deletion command
  socket.on('delete', function(deletedName){
    deleteShape(deletedName);
    stage.update();
  });

  //build Shape that has been received
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
      if (last < 0)
        return;
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

      //Same name on all clients, given by server, unique
      toShape.name = draw.name;
      return toShape;
    } catch (e) {
      console.log(e);
    } finally {

    }

  }

  //move Shape as commanded by received 'move'
  function moveShape(shapeMove){
    var child = stage.getChildByName(shapeMove.name);
    child.x = shapeMove.p.x;
    child.y = shapeMove.p.y;
  }

  //delete shape specified on 'delete'
  function deleteShape(deletedName) {
    stage.removeChild(stage.getChildByName(deletedName));
  }

  //---------------------------(SHORTCUTS & CONTROLS)---------------------------
  //handles keyboard, for shortcuts
  $(document).keydown(function(event){
    if ( event.which == 13 ) {
      event.preventDefault();
    }

    switch (event.which) {
      case 70://case "F": case "f":
          $('#fillBox').prop('checked', !($('#fillBox').is(":checked")));
          (!($('#fillBox').is(":checked"))) ? $('#strokeBox').prop('checked', true) : false;
        break;
      case 83://case "S": case "s":
          $('#strokeBox').prop('checked', !($('#strokeBox').is(":checked")));
        break;
      case 76:case "L": case "l":
        sendDrawing(false);
        break;
      case 80://case "P": case "p":
        sendDrawing(true);
        break;
      case 77://case "M": case "m":
        addMode(1);
        break;
      case 88: case 46://case "X": case "x": case "Delete":
        deleteSelected();
        break;
      case 86://case "V": case "v":
          $('#previewBox').prop('checked', !($('#previewBox').is(":checked")));
        break;
      default:

    }

  });

  //change mode if v > 1
  //keep mode if v = 0
  //in both cases, update the mode button and rest of interface
  function addMode(v){
    mode = (mode+v)%3;
    segment.length = 0;
    current.graphics.clear();
    $('#mode').html(modeNames[mode]);
    $('#mode').css('background', modeColors[mode]);
    stage.removeChild(preview);
    stage.update();
    //["Draw Mode (M)", "Grab Mode (M)", "Select Mode (M)"];
    if (mode === 0){
      document.getElementById("line").disabled = false;
      document.getElementById("poly").disabled = false;
      document.getElementById("fillBox").disabled = false;
      document.getElementById("strokeBox").disabled = false;
      document.getElementById("previewBox").disabled = false;
      document.getElementById('delete').style.display = "none";
      document.getElementById('linediv').style.display = "inline";
    }
    else {
      document.getElementById("line").disabled = true;
      document.getElementById("poly").disabled = true;
      document.getElementById("fillBox").disabled = true;
      document.getElementById("strokeBox").disabled = true;
      document.getElementById("previewBox").disabled = true;
      if (mode==2){
        document.getElementById('delete').style.display = "inline";
        document.getElementById('linediv').style.display = "none";
      }
    }
  }

  //Change mode on button
  $('#mode').click(function(){
    addMode(1);
  });

  //Delete shape with button
  $('#delete').click(function(){
    deleteSelected();
  });

  //check strokeBox when fillBox is unchecked (avoid invisible objects)
  $('#fillBox').click(function(){
    (!($('#fillBox').is(":checked"))) ? $('#strokeBox').prop('checked', true) : false;
  });

});

//get mouse coordinates inside canvas, returns a {x:..., y:...} object
function getMouse(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
}

//Manage color selections
function changeLineColor() {
  colorStroke = document.getElementById("linecolorpicker").value;
}

function changeFillingColor() {
  colorFill = document.getElementById("fillingcolorpicker").value;
}

function getColorCode(isClosed) {
  if (isClosed){
    return document.getElementById("fillingcolorpicker").value;
  }
  return document.getElementById("linecolorpicker").value;
}

//Save image of canvas
function exportPNG(){
  window.open(stage.canvas.toDataURL("image/png", '_blank'));
}