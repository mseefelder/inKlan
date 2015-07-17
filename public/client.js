var socket = io();
var canvas;
var canvasSize;
var stage;
var current;

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

  //-----------------------------------(DRAW)-----------------------------------
  //Listening for mouseup on canvas because mouse precision on stage
  //is much higher, resulting in huge floats.
  canvas.addEventListener("mouseup", function(evt){

    var mouse = getMouse(canvas, evt);
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

  //---------------------------------(RECEIVE)----------------------------------
  //receiving whole canvas (triggered by socket.send(...) on server)
  socket.on('message', function(msg){
    for (var i = 0; i < msg.length; i++)
      stage.addChildAt(buildShape(msg[i]), stage.numChildren-1);
    stage.update();
  });

  //receiving new drawing
  socket.on('draw', function(drawing){
    stage.addChildAt(buildShape(drawing), stage.numChildren-1);
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

      return toShape;
    } catch (e) {
      console.log(e);
    } finally {

    }

  }

  //---------------------------(SHORTCUTS & CONTROLS)---------------------------
  //handles keyboard, for shortcuts
  $(document).keydown(function(event){
    if ( event.which == 13 ) {
      event.preventDefault();
    }

    console.log(event.key);

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
        break;
      default:

    }

  });

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
