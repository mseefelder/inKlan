var socket = io();
var canvas = document.getElementById('canv');
var frame = canvas.getContext('2d');

//drawing currently being drawn
var segment = [];
//all drawing received
var drawings = [];

var colorFill;
var colorStroke;

$(document).ready(function() {

  //Sending drawings
  function sendDrawing(closed){
    socket.emit('draw', {
      points: segment,
      close: closed,
      fillColor: ((colorFill) ? colorFill : "rgb(0,0,0)") ,
      strokeColor: ((colorStroke) ? colorStroke : "rgb(0,0,0)"),
      fill: $('#fillBox').is(':checked')
    });
    segment.length = 0;
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

  //receiving whole canvas (triggered by socket.send(...) on server)
  socket.on('message', function(msg){
    console.log("!");
    console.log("Message!: "+msg);
    for (var i = 0; i < msg.length; i++)
      drawings.push(msg[i]);
    redraw();
  });

  //receiving new drawing
  socket.on('draw', function(drawing){
    drawings.push(drawing);
    redraw();
  });

  //draw drawing
  function drawDrawing(draw){
    try {
      //Begin drawing
      frame.beginPath();
      //Draws from last point to first
      var last = draw.points.length - 1;
      //Move "brush" to last point
      frame.moveTo(draw.points[last].x, draw.points[last].y);
      //Line to all other points
      for (var i = last - 1; i >= 0; i--) {
        frame.lineTo(draw.points[i].x, draw.points[i].y);
      };

      //If it's a polygon, close drawing
      if(draw.close) {
        frame.closePath();
      }

      //Stroke or fill
      if (draw.fill) {
        frame.strokeStyle = draw.strokeColor;
        frame.fillStyle = draw.fillColor;
        frame.stroke();
        frame.fill();
      }
      else {
        frame.strokeStyle = draw.strokeColor;
        frame.stroke();
      }
    }
    catch (err) {};
  }

  //draw clicked point
  function drawPoint(point){
    var circle = new Path2D();
    circle.arc(point.x, point.y, 1, 0, 2*Math.PI, true);
    frame.stroke(circle);
  }

  //clear canvas and redraw all drawings on drawings array
  function redraw(){
    frame.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < drawings.length; i++) {
      drawDrawing(drawings[i]);
    }
    for (var i = 0; i < segment.length; i++) {
      drawPoint(segment[i]);
    }
  }

  //handles mouseup on canvas area
  canvas.addEventListener('mouseup', function(evt){
    var mouse = getMouse(canvas, evt);
    segment.push(mouse);
    drawPoint(mouse);
  }, true);

  //handles keyboard, for shortcuts
  $(document).keydown(function(event){
    if ( event.which == 13 ) {
      event.preventDefault();
    }

    console.log(event.key);

    switch (event.key) {
      case "F": case "f":
          $('#fillBox').prop('checked', !($('#fillBox').is(":checked")));
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
