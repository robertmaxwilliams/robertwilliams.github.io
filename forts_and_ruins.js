/*
forts and ruins is a game I came up with some time ago.
v1 was in python and worked great, v2 made some compromises
v3 should be cleaner and maybe easier to play and understand

"_" repesents an empty square, colored with dirt using pre-generated colors
"F" is a fort which is a grey background and purple diamond
"D" is a dead fort
"d" is a dead field
a number is a field, drawn using colors from array
"-" is used as a temporary while trying to build fields
field colors are accessed by having fields repesented by number in the grid
dirt colors are drawn using a seeded random number generator


not that i, j are game grid coordinates, and x, y are graphic coordinates
*/

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds) {
      break;
    }
  }
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

function isNumeric(obj) {
    return !isNaN(obj - parseFloat(obj));
}

var dirtColors = ['#966341', '#9c6744', '#915d3a']

var fieldColors = ['#496645', '#5d7046', '#7d7046', '#d6b458', '#ed572d', '#9b76b8']
var selectedFieldNum = 0
var lastKilledNum = -1 //default to -1 so it doesn't do anything first turn. board.reset also does this

var skullImage = new Image();   // Create new img element
skullImage.src = 'skull.png'; // Set source path


function ColorPicker() {
  this.numColors = fieldColors.length
  this.calculateSize()
  this.draw()
}
ColorPicker.prototype = {
  constructor: ColorPicker,
  //calculates width of color choose blocks
  calculateSize: function() {
    this.canvas = document.getElementById("colorPicker");
    this.ctx = this.canvas.getContext("2d")
    this.w = this.canvas.width / this.numColors
    this.h = this.canvas.height
    var listener = this.getPosition.bind(this) //needed bc JS is bad
    this.canvas.addEventListener("mousedown", listener, false);
  },
  //draw a single button tile
  drawButtonTile: function(n) {
    this.ctx.fillStyle = fieldColors[n];
    this.ctx.fillRect(this.w * n, 0, this.w, this.h)
    this.ctx.stroke()
    if (n != selectedFieldNum) {
      this.ctx.fillStyle = '#966341'
      this.ctx.fillRect(this.w * n, this.h * 0.8, this.w, this.h * 0.2)
      this.ctx.stroke()
      this.ctx.fillRect(this.w * n, this.h * 0, this.w, this.h * 0.2)
      this.ctx.stroke()
    }
    if (n == lastKilledNum){
      this.ctx.drawImage(skullImage, this.w*n, this.h/2)
    }
  },
  //draw the color picker
  draw: function() {
    for (n in fieldColors) {
      this.drawButtonTile(n)
    }
  },
  //click listener
  getPosition: function(event) {
    var rect = this.canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    selectedFieldNum = mod(Math.floor(x / this.w), fieldColors.length)
    this.draw()
  }
}


//board is an object
function Board(width, height, colorPicker) {
  this.colorPicker = colorPicker
  this.width = width
  this.height = height
  this.turnNumber = 0
  this.gameOver = false
  this.grid = Array(height).fill(0).map(x => Array(width).fill('_'))
  this.canvas = document.getElementById("myCanvas");
  this.ctx = this.canvas.getContext("2d")
  this.calculateSize()
  var listener = this.getPosition.bind(this) //needed bc JS is bad
  this.canvas.addEventListener("mousedown", listener, false);
	this.reset(width, height)
}
Board.prototype = {
  constructor: Board,
  //look around the 4 adjeacent squares, search for dead ends with no edge touching
  tryBuildForts: function(i, j) {
    var sides = this.adjacentDirtSquares(i, j)
      //is we are by an edge or surrounded to start
    if (sides.length == 0)
      return

    for (n in sides) {
      if (this.lookForForts([sides[n]])) {
        var sym = "F" //place forts
      } else {
        var sym = "_" //put back to dirt
      }
      for (i in this.grid) {
        for (j in this.grid[i]) {
          if (this.getTile(i, j) == "-") {
            this.setTile(i, j, sym)
          }
        }
      }
    }
  },
  reset: function(width, height){
	this.width = width
	this.height = height
    this.grid = Array(this.height).fill(0).map(x => Array(this.width).fill('_'))
	this.gameOver = false
    this.calculateSize()
    this.turnNumber = 0
    this.setTile(2, 3, '1')
    this.setTile(2, 2, 'F')
    this.setTile(2, 1, '3')
    //draw background in case pixels leak through
    this.drawSquare(0, 0, this.canvas.width, this.canvas.height, "#966341")
    this.draw()
    lastKilledNum = -1
  },
  //returns true for good to build, false for no good. fills potential space with "-" as it works
  lookForForts: function(options) {
    //if we are done looking, this branch dead-ends
    if (options.length == 0)
      return true

    //go on to recursively check adjacent branches
    var result = true;
    for (n in options) {
      var i = options[n][0]
      var j = options[n][1]
      if (this.isNearWall(i, j))
        return false
      if (this.adjacentTo(i, j, function(x){return x[0]=='d'||x=='f'}).length > 0)
      	return false
      if (this.getTile(i, j) == '_')
        this.setTile(i, j, '-')
      result = result && this.lookForForts(this.adjacentDirtSquares(i, j))
    }
    return result
  },
  //returns dirt nearby
  adjacentDirtSquares: function(i, j) {
		return this.adjacentTo(i, j, function(x){return x=='_'})
  },
  adjacentTo: function(i, j, checkFunction) {
    var options = []
    if (i + 1 < this.grid.length && checkFunction(this.getTile(i + 1, j)))
      options.push([i + 1, j])
    if (j + 1 < this.grid[0].length && checkFunction(this.getTile(i, j + 1)))
      options.push([i, j + 1])
    if (i - 1 >= 0 && checkFunction(this.getTile(i - 1, j)))
      options.push([i - 1, j])
    if (j - 1 >= 0 && checkFunction(this.getTile(i, j - 1)))
      options.push([i, j - 1])
    return options
  },
  isNearWall: function(i, j) {
    return (i + 1 >= this.grid.length || j + 1 >= this.grid[0].length || i - 1 < 0 || j - 1 < 0)
  },
  setTile: function(i, j, letter) {
    this.grid[i][j] = letter
  },
  getTile: function(i, j) {
    return this.grid[i][j]
  },
  toString: function() {
    var buffer = "Game Board:\n"
    for (i in this.grid) {
      for (j in this.grid[i]) {
        buffer = buffer.concat(this.getTile(i, j))
      }
      buffer = buffer.concat('\n')
    }
    return buffer
  },
  //draw a single square
  drawSquare: function(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h)
  },
  drawDiamond: function(i, j, color) {
      this.ctx.strokeStyle = color
      this.ctx.fillStyle = color
      this.ctx.beginPath()
      this.ctx.moveTo(i * this.w + this.w * 0.5, j * this.h + 2)
      this.ctx.lineTo(i * this.w + this.w - 2, j * this.h + this.h * 0.5)
      this.ctx.lineTo(i * this.w + this.w * 0.5, j * this.h + this.h - 2)
      this.ctx.lineTo(i * this.w + 2, j * this.h + this.h * 0.5)
      this.ctx.closePath()
      this.ctx.stroke()
      this.ctx.fill()
    },
    drawGameOver: function() {
    var forts = 0
   	for (i in this.grid) {
      for (j in this.grid[i]) {
      	if (this.getTile(i, j) == 'f'){
          	forts += 1
        }
      }
    }
    this.drawSquare(0, 0, this.canvas.width, this.canvas.height, "rgba(0, 0, 0, 0.8)")
      this.ctx.font = "30px Arial";
      this.ctx.textAlign="center"; 
      this.ctx.fillStyle = "#ffffff"
			this.ctx.fillText("GAME OVER",this.canvas.width/2, this.canvas.height*.3);
      this.ctx.font = "20px Arial";
      
      this.ctx.fillText("Forts built: "+forts,this.canvas.width/2, this.canvas.height*.3+50);
      this.ctx.fillText("Turns survived: "+this.turnNumber,this.canvas.width/2, this.canvas.height*.3+100);

    },
    //draw the whole board
  draw: function() {
  	if (this.gameOver){
    	this.drawGameOver()
      return
    }
    for (i in this.grid) {
      for (j in this.grid[i]) {
        if (this.getTile(i, j) == 'F') { //draw fort
          this.drawSquare(i * this.w, j * this.h, this.w, this.h, "#82355B")
          this.drawDiamond(i, j, "#A9A9A9")
        } else if (this.getTile(i, j) == 'f') { //draw dead fort
          this.drawSquare(i * this.w, j * this.h, this.w, this.h, "#691C42")
          this.drawDiamond(i, j, "#0A0A0A")
        } else if (this.getTile(i, j)[0] == 'd') { //draw dead field
          var colorNum = parseInt(this.getTile(i, j).slice(1))
          this.drawSquare(i * this.w, j * this.h, this.w, this.h, fieldColors[colorNum])
          this.drawSquare(i * this.w, j * this.h, this.w, this.h, "rgba(0, 0, 0, 0.5)")
        } else if (this.getTile(i, j) == '_') { //draw dirt
          this.drawSquare(i * this.w, j * this.h, this.w, this.h, this.dirtColor(i, j))

        } else if (this.getTile(i, j) == '-') { //draw potential fort
          this.drawSquare(i * this.w, j * this.h, this.w, this.h, "#FFFFFF")
        } else if (isNumeric(this.getTile(i, j))) { //draw field
        	var colorNum = parseInt(this.getTile(i, j))
          this.drawSquare(i * this.w, j * this.h, this.w, this.h, fieldColors[colorNum])
        } else {
          console.log("There has been a problem with the grid.")
        }
      }
    }
  },
  //find the color of dirt in a repeatable but randomish way
  dirtColor: function(i, j) {
    return dirtColors[(((i + this.width * j + 517) * 2147483647) % 16807) % dirtColors.length]
  },
  //click listener
  getPosition: function(event) {
  	if (this.gameOver){
    	console.log("restart")
    	this.reset(this.width, this.height)
      return
    }
    var rect = this.canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    if (this.tryPlaceField(x, y)) {
      this.draw()
      console.log(this.toString())
    }
  },
  //take a click coordinate and try to place a field
  tryPlaceField: function(x, y) {

    var i = Math.floor(x / this.w)
    var j = Math.floor(y / this.h)
    if (i >= this.grid.length || j >= this.grid[0].length) {
      return false
    }
    if (this.grid[i][j] == "_") {
      this.turnNumber += 1
      this.setTile(i, j, ''+selectedFieldNum)
      this.killAllFields(Math.floor(Math.random() * fieldColors.length))
      this.tryBuildForts(i, j)
      return true
    }
    return false
  },
  //kill all fields of a certain color
  killAllFields(colorNum) {
    lastKilledNum = colorNum
  	console.log("killed", colorNum)
    for (i in this.grid) {
      for (j in this.grid[i]) {
        if (this.getTile(i, j) == ''+colorNum) {
          this.setTile(i, j, 'd' + colorNum)
        }
      }
    }
    var numForts = 0
    for (i in this.grid) {
      for (j in this.grid[i]) {
      	if (this.getTile(i, j) == 'F'){
        	var nearbyFields = this.adjacentTo(i, j , isNumeric)
        	if (nearbyFields.length == 0)
          	this.setTile(i, j, 'f')
          else
          	numForts += 1
      	}
      }
    }
    this.draw()
    this.colorPicker.draw()
    if (numForts == 0)
    	this.gameOver = true
       
  },
  //find the size of each square to make board fill properly
  calculateSize: function() {
    var squareWidth = this.canvas.width / this.width
    var squareHeight = this.canvas.height / this.height
    this.w = Math.min(squareWidth, squareHeight)
    this.h = Math.min(squareWidth, squareHeight)
  }
}


var colorPicker = new ColorPicker()
var board = new Board(20, 20, colorPicker)
function newGame(width, height){
	board.reset(width, height)
	console.log(board.toString())
	board.draw()
	colorPicker.draw()
}
