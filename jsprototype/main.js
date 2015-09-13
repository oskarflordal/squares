
// game state object
var game;

// map

var color = ["#111111", "#333333", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#00ffff", "#ff00ff", "#77777777", "#ffffff"]

var gridRes = 8;
var MINSIZE = 3;
var MAXSIZE = 8;

var rects = [];
var edges = [];

var score = [];
var scoreText = [];
var statusText;

var activePlayer = 0;

function intersects(ra, rb) {
    
    return !(rb.x          >= (ra.x + ra.w) || 
             (rb.x + rb.w) <= ra.x || 
             (rb.y       ) >= (ra.y+ra.h) ||
             (rb.y+rb.h  ) <= (ra.y));
}

function between(alo, ahi, blo, bhi) {
    return ((alo <= bhi) && (alo >= blo)) || ((ahi <= bhi) && (ahi >= blo)) || ((blo <= ahi) && (blo >= alo));
}

// return n, s, e, w, or no depending on which side we share a border, no for none
function shareEdge(a, b) {
    console.log(a.x +" "+ a.w+" " + " " + b.x + " " + b.w);
    if ((a.x == (b.x+b.w)) && (between(b.y, b.y+b.h, a.y, a.y+a.h))) {
	return 'edge';
    }
    if (((a.x+a.w) == b.x) && (between(b.y, b.y+b.h, a.y, a.y+a.h))) {
	return 'edge';
    }
    if ((a.y == (b.y+b.h)) && (between(b.x, b.x+b.w, a.x, a.x+a.w))) {
	return 'edge';
    }
    if (((a.y+a.h) == b.y) && (between(b.x, b.x+b.w, a.x, a.x+a.w))) {
	return 'edge';
    }
    return 'none';
}

// find all rectangles that share an edge
// does the full loop adding an edge from each side
// (could do half the comparissons among other thingsif speed mattered)
function buildGraph(list) {
    for (var i = 0; i < list.length; ++i) {
	list[i].edge = [];
	for (var j = 0; j < list.length; ++j) {
	    if (i == j) continue;
	    var share = shareEdge(list[i], list[j]); 
	    if (share != 'none') {
		list[i].edge.push(list[j]);
	    }
	}	
    }
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

// remove the neighbours edges to this rect
function removeEdges(rect) {
    for(var i = 0; i < rect.edge.length; ++i) {
	var idx = rect.edge[i].edge.indexOf(rect);
	rect.edge[i].edge.splice(idx, 1);
    }
}

function expandGraph(a) {
    var graph = [];
    var toVisit = [a];

    console.log("lets investigate " + a.x + " " + a.y);
    
    while (toVisit.length > 0) {
	for (var i = 0; i < toVisit[0].edge.length; ++i) {
	    // for each neighbour add it to toVisit unless we already have it
	    if ((graph.indexOf(toVisit[0].edge[i]) == -1) &&
		(toVisit.indexOf(toVisit[0].edge[i]) == -1)) {
		toVisit.push(toVisit[0].edge[i]);
	    }
	}

	// add this one to the graph
	graph.push(toVisit[0]);
	// remove the one we were working on
	toVisit.splice(0,1);
    }

    console.log("this graph had " + graph.length + " nodes");
    
    return graph
}

function touch(sprite, pointer) {
    sprite.kill();

    console.log("size " +  rects[sprite.rectid].w + " " + rects[sprite.rectid].h);
    var rect = rects[sprite.rectid];
    // this rect will be removed, first remove all the edges associated with his and its neigbours
    removeEdges(rect);

    console.log(rect.edge.length);

    // now we may have gotten a set of separate islands in out graph, lets find out
    // build the graph for each island (most will likely be the same but this
    // is sufficiently fast)
    var islandCandidates = rect.edge.map(expandGraph);

    var islands = [islandCandidates[0]];

    // any element in one of the islands will not be available in any other island that is connected,
    // lets check if element 0 in each island is available in a neighbour
    for (var i = 1; i < islandCandidates.length; ++i) {
	var found = false;
	for (var j = 0; j < islands.length; ++j) {
	    if (islands[j].indexOf(islandCandidates[i][0]) != -1) {
		found = true;
		break;
	    }
	}
	if (!found) {
	    islands.push(islandCandidates[i]);
	}
    }

    // Now, every island but the largest should be removed. First calculate the areas of the islands
    islandAreas = islands.map(function(list) {
	var area = 0;
	for (var j = 0; j < list.length; ++j) {
	    area += list[j].w*list[j].h/gridRes/gridRes;
	}
	return area;
    })
    var totArea = islandAreas.reduce(function(pv, cv) { return pv + cv; }, 0);
    var maxArea = islandAreas.reduce(function(pv, cv) { return pv > cv ? pv : cv; }, 0);
    var maxIdx = islandAreas.indexOf(maxArea);

    // for each island elimate if it is not the max area
    // give penalty if the removed area was more than 25%
    for (var i = 0; i < islandAreas.length; ++i) {
	if (i == maxIdx) continue; // make sure we don't leave multiple equally sized areas

	if (maxArea >= totArea*0.75) {
	    score[activePlayer] += islandAreas[i];
	} else {
	    score[activePlayer] -= islandAreas[i]/2;
	}
	for (var j = 0; j < islands[i].length; ++j) {
//	    var tween = game.add.tween(islands[i][j].sprite).to( { alpha: 0 }, 500, Phaser.Easing.Linear.None, true, 0, 1, true);
	    
	    islands[i][j].sprite.inputEnabled = false;
	    islands[i][j].sprite.kill();
	    
	}
    }

    statusText.text = "" + Math.round(maxArea/totArea* 100) + "%";
    
    // penalty for the size of the one we touched
    score[activePlayer] -= rects[sprite.rectid].w * rects[sprite.rectid].h/gridRes/gridRes;

    updateScore(activePlayer);
    
    activePlayer = 1 - activePlayer;
}

function generateMap() {

    
    var sampler = new PoissonDiskSampler( 2048, 2048, 80, 20 );

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

	path = bresenham(rects[i].x/gridRes, rects[i].y/gridRes, game.world.centerX/gridRes, game.world.centerY/gridRes)

	var finalP = 0;
	
	var hit = false;

	for (var p = 1; p <  path.length; ++p) {

//	    console.log ("check: " + path[p].x*gridRes + " " + path[p].y*gridRes + " " + rects[i].w + " " + rects[i].h)

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

    // generate a graph based on the rects
    buildGraph(rects);
    
    // Generate the actual sprites
    for (var i = 0; i < rects.length; i++) {
	var scaleX = (rects[i].w)/256;
	var scaleY = (rects[i].h)/256;
	var sprite = game.add.sprite(rects[i].x, rects[i].y, 'sq');
	sprite.scale.set(scaleX,scaleY);
	sprite.inputEnabled = true;
	sprite.rectid = i;
	sprite.events.onInputDown.add(touch, i);
	rects[i].sprite = sprite;
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

    var style = { font: "bold 32px Arial", fill: "#fff", boundsAlignH: "left", boundsAlignV: "up" };
    var styleC = { font: "bold 32px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "up" };
    scoreText.push(game.add.text(0, 0, "Player 1: 0", style));
    scoreText.push(game.add.text(512, 0, "Player 2: 0", style));
    statusText = game.add.text(0, 100, "WWWWWWWWW", styleC);
    statusText.setTextBounds(0, 0, 1024, 1024)

    
    score.push(0);
    score.push(0);
}

function updateScore(id) {
    scoreText[id].text = "Player " + (id+1) +": " + score[id];
}

function render () {
}

function start() {
    game = new Phaser.Game(1024, 1024, Phaser.CANVAS, 'phaser-example', { preload: preload, create: create, render: render });
}



window.onload = function() {
    start();

}

