var socket = io();
var canvas = document.getElementById('canv');
var frame = canvas.getContext('2d');

var segment = [];

$(document).ready(function() {

  $('#line').click(function(){
    socket.emit('draw', {
      points: segment,
      close: false
    });
    segment.length = 0;
    return false;
  });

  $('#poly').click(function(){
    socket.emit('draw', {
      points: segment,
      close: true
    });
    segment.length = 0;
    return false;
  });

  socket.on('chat message', function(msg){
    $('#messages').append($('<li>').text(msg));
  });

  socket.on('doStroke', function(stk){
    frame.beginPath();
    frame.moveTo(stk[0].x,stk[0].y);
    frame.lineTo(stk[1].x,stk[1].y);
    frame.stroke();
  });

  socket.on('draw', function(draw){
    frame.beginPath();
    var last = draw.points.length - 1;
    frame.moveTo(draw.points[last].x, draw.points[last].y);
    for (var i = last - 1; i >= 0; i--) {
      frame.lineTo(draw.points[i].x, draw.points[i].y);
    };
    if(draw.close)
      frame.closePath();
    frame.stroke();
  });

  canvas.addEventListener('mouseup', function(evt){
    var mouse = getMouse(canvas, evt);
    
    segment.push(mouse);

    var circle = new Path2D();
    circle.arc(mouse.x, mouse.y, 1, 0, 2*Math.PI, true);
    frame.stroke(circle);

  }, true);

});

function getMouse(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
}