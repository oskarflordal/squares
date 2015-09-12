function checkLegal(hitgrid, xstart, xstop, ystart, ystop) {

    // find outer border if we scale up as a square
    for (var y = ystart; y < ystop; ++y) {
	for (var x = xstart; x < xstop; ++x) {
	    if (hitgrid[x][y] == true) {
		return false;
	    }
	}
    }

    return true;
}

function generateMapSampler() {
    console.log("gen map");
    var sampler = new PoissonDiskSampler( 800, 600, 32, 20 );

    // add the first point center
    sampler.queueToAll( { x: game.world.centerX, y: game.world.centerY });
    
    sampler.sample();
    sampler.sample();
    sampler.sample();
    sampler.sample();
    sampler.sample();
    sampler.sample();
    sampler.sample();

    var gridRes = 4;

    var hitgrid = [];
    
    for (var x = 0; x < 800/gridRes; ++x) {
	var tmp = [];
	for (var y = 0; y < 600/gridRes; ++y) {
	    tmp.push(false);
	}
	hitgrid.push(tmp);
    }
    
    // grab every second element and 
    for (var i = 0; i < sampler.outputList.length; i+=2) {
	var sizeX   = (Math.random()*7+2)*gridRes/256;
	var sizeY   = (Math.random()*7+2)*gridRes/256;
	var posX = Math.round(sampler.outputList[i].x/gridRes)*gridRes;
	var posY = Math.round(sampler.outputList[i].y/gridRes)*gridRes;
	var sprite = game.add.sprite(posX, posY, 'sq');
	sprite.tint = 0xff00ff;

	// mark every position in the hitgrid
	for (var y = 0; y < sizeY*256/gridRes; ++y) {
	    for (var x = 0; x < sizeX*256/gridRes; ++x) {
		hitgrid[x+posX/gridRes][y+posY/gridRes] = true;
	    }
	}
	
	sprite.scale.set(sizeX, sizeY);

	rects.push(sprite);
    }

    // grab the others and magnify as much as possible
    for (var i = 0; i < sampler.outputList.length; i++) {
	if (i%2 == 0) continue;

	// expand in one direction at a time
	

	var posX = Math.round(sampler.outputList[i].x/gridRes);
	var posY = Math.round(sampler.outputList[i].y/gridRes);
	var xstart = posX;
	var ystart = posY;
	var xstop  = posX;
	var ystop  = posY;

	var xstartHit = false;
	var xstopHit  = false;
	var ystartHit = false;
	var ystopHit  = false;

	var itr = 0;

	while ((xstartHit == false) ||
	       (xstopHit  == false) ||
	       (ystartHit == false) ||
	       (ystopHit  == false)) {
	    if (!xstartHit) {
		if (checkLegal(hitgrid, xstart-1, xstop, ystart, ystop)) {
		    xstart--;
		} else {
		    xstartHit = true;
		}
	    }
	    if (!ystartHit) {
		if (checkLegal(hitgrid, xstart, xstop, ystart-1, ystop)) {
		    ystart--;
		} else {
		    ystartHit = true;
		}
	    }
	    if (!ystopHit) {
		if (checkLegal(hitgrid, xstart, xstop, ystart, ystop+1)) {
		    ystop++;
		} else {
		    ystopHit = true;
		}
	    }
	    if (!xstopHit) {
		if (checkLegal(hitgrid, xstart, xstop+1, ystart, ystop)) {
		    xstop++;
		} else {
		    xstopHit = true;
		}
	    }

	    if (itr++ > 20) break;
	}

	console.log(xstart + " " + xstop);
	
	posX = xstart*gridRes;
	posY = ystart*gridRes;
	
	var sizeX   = (xstop-xstart+1)*gridRes/256;
	var sizeY   = (ystop-ystart+1)*gridRes/256;
	var sprite = game.add.sprite(posX, posY, 'sq');

	for (var y = ystart; y < ystop; ++y) {
	    for (var x = xstart; x < xstop; ++x) {
		hitgrid[x][y] = true;
	    }
	}
	sprite.scale.set(sizeX, sizeY);

	rects.push(sprite);
    }

//    game.physics.p2.enable(rects);
/*    
    for (var i = 0; i < rects.length; ++i) {
	rects[i].body.fixedRotation = true;
	rects[i].body.bounce = 0;
	rects[i].body.damping = 1;
	rects[i].body.maxVelocity = 0.00001;
    }

    // simulate for a long while to make everything fall in place
    for (var i = 0; i < 5000; ++i) {
	game.physics.p2.update();
    }

    // adjust the positions to snap to the fris
    for (var i = 0; i < rects.length; ++i) {
	rects[i].body.sprite.position.x = rects[i].body.sprite.scale.x*gridRes*Math.round(rects[i].body.sprite.position.x/rects[i].body.sprite.scale.x/gridRes);
	rects[i].body.sprite.position.y = rects[i].body.sprite.scale.y*gridRes*Math.round(rects[i].body.sprite.position.y/rects[i].body.sprite.scale.y/gridRes);
    }    

    for (var i = 0; i < rects.length; ++i) {
	rects[i].body.dynamic = false;
    }
*/
}
