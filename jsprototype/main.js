
// game state object
var game;

// map

var color = ["#111111", "#333333", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#00ffff", "#ff00ff", "#77777777", "#ffffff"]

var sprites = [];


function intersects(ra, rb) {
    
    return !(rb.x          >= (ra.x + ra.w) || 
             (rb.x + rb.w) <= ra.x || 
             (rb.y       ) >= (ra.y+ra.h) ||
             (rb.y+rb.h  ) <= (ra.y));
}

function bresenham(x1, y1, x2, y2) {
    var coordinatesArray = new Array();
    // Translate coordinates
    // Define differences and error check
    var dx = Math.abs(x2 - x1);
    var dy = Math.abs(y2 - y1);
    var sx = (x1 < x2) ? 1 : -1;
    var sy = (y1 < y2) ? 1 : -1;
    var err = dx - dy;
    // Set first coordinates
    coordinatesArray.push({y:y1, x:x1});
    // Main loop
    while (!((x1 == x2) && (y1 == y2))) {
	var e2 = err << 1;
	if (e2 > -dy) {
            err -= dy;
            x1 += sx;
	}
	if (e2 < dx) {
            err += dx;
            y1 += sy;
	}
	// Set coordinates
	coordinatesArray.push({y:y1, x:x1});
    }
    // Return the result
    return coordinatesArray;
}

function generateMap() {
    var rects = [];

    var gridRes = 8;
    var MINSIZE = 3;
    var MAXSIZE = 8;
    
    var sampler = new PoissonDiskSampler( 1024, 1024, 80, 20 );

    // add the first point center
    sampler.queueToAll( { x: game.world.centerX, y: game.world.centerY });
    
    sampler.sample();
    sampler.sample();
    sampler.sample();
    sampler.sample();
    sampler.sample();
    sampler.sample();
    sampler.sample();
    sampler.sample();
    sampler.sample();
    sampler.sample();
    sampler.sample();
    
    // convert all the coordinates into rectangle
    // {x, y, widht, height}
    for (var i = 0; i < sampler.outputList.length; i++) {
	var w   = Math.round(Math.random()*(MAXSIZE-MINSIZE+1)+MINSIZE)*gridRes;
	var h   = Math.round(Math.random()*(MAXSIZE-MINSIZE+1)+MINSIZE)*gridRes;
	var x = Math.round(sampler.outputList[i].x/gridRes)*gridRes;
	var y = Math.round(sampler.outputList[i].y/gridRes)*gridRes;
	var cx = x+w/2;
	var cy = y+h/2;

	rects.push({w, h, x, y});
    }

    // gravitate them all to the middle, first by sorting the array by the distance to the center of the map
    rects.sort(function(x, y) {
	// distance to the middle without the sqrt
	var xdist = Math.pow(x.x+x.w/2-game.world.centerX, 2)+Math.pow(x.y+x.h/2-game.world.centerY,2);
	var ydist = Math.pow(y.x+y.w/2-game.world.centerX, 2)+Math.pow(y.y+y.h/2-game.world.centerY,2);

	if (xdist < ydist) return -1;
	if (xdist > ydist) return 1;
	return 0;
    });

    var attempts = 2000;

    console.log("first " + rects[0].x + " " + rects[0].y + " " + rects[0].w + " " + rects[0].h);
    console.log("second " + rects[1].x + " " + rects[1].y + " " + rects[1].w + " " + rects[1].h);
    
    // gravitate each rect in order inwards until it intersects with something
    for (var i = 1; i < rects.length; ++i) {
	// relies on the game.world being gridres dividable
	// we should really try to reach another point than center here since the sprite pos is the upper left corner

	attempts = 100;

	var hitX = false;
	var hitY = false;

	console.log("i: " + i);

	path = bresenham(rects[i].x/gridRes, rects[i].y/gridRes, game.world.centerX/gridRes, game.world.centerY/gridRes)

	var finalP = 0;
	
	var hit = false;

	for (var p = 1; p <  path.length; ++p) {

	    console.log ("check: " + path[p].x*gridRes + " " + path[p].y*gridRes + " " + rects[i].w + " " + rects[i].h)

	    // test against all other rects
	    for (var j = 0; j < i; ++j) {
		if (intersects({x:path[p].x*gridRes,y:path[p].y*gridRes,w:rects[i].w, h:rects[i].h}, rects[j])) {
		    finalP = p-1;
		    hit = true;
		    break;
		}
	    }
	    if (hit) break;
	    
	    if (attempts-- == 0) {console.log("assert attempts hit"); break;}
	}
	rects[i].x = path[finalP].x*gridRes;
	rects[i].y = path[finalP].y*gridRes;
    }


    
    // Generate the actual sprites
    for (var i = 0; i < rects.length; i++) {
	var scaleX = (rects[i].w)/256;
	var scaleY = (rects[i].h)/256;
	console.log("p " + rects[i].x + " " + rects[i].y);
	var sprite = game.add.sprite(rects[i].x, rects[i].y, 'sq');
	console.log("scaleX " + scaleX);
	sprite.scale.set(scaleX,scaleY);
    }

/*
    sprite = game.add.sprite(100, 100, 'sq');
    sprite.scale.set(1,1);
    sprite = game.add.sprite(228, 228, 'sq');
    sprite.scale.set(0.5,0.5);
    sprite = game.add.sprite(164, 164, 'sq');
    sprite.scale.set(0.25,0.25);
*/
    
//    game.physics.p2.enable(rects);


    
}

function preload() {
    game.load.image('sq', 'sqb.png');
}

function create() {
    game.physics.startSystem(Phaser.Physics.P2JS);
    generateMap();
}
    
function render () {
    // this is proibably not very fast

    // move them apart
}

function start() {
    game = new Phaser.Game(1024, 1024, Phaser.CANVAS, 'phaser-example', { preload: preload, create: create, render: render });
}



window.onload = function() {
    start();

}

