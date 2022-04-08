/*

Hi,
welcome to my game project submission. I have decided to add Sound and both stationary and 
moving Platforms as my two extensions. 
To help improve my graphics I have created flames at the bottom of my canyons and a burst of starts to 
celebrate the player winning the game.
My game has three parts, apples for adding to your score, lives can be collected to add more lives and a
flag that can only be captured when the max score is reached. Holding the H key gives instructions. 
The hardest part for me was getting my head around using constructors. The syntax is a bit different 
from what we first implemented. Once they are in place they make using them again much easier. 
By implementing moving platforms and particle cannon it helped me get my head around using constructors. 

*/
let floorPos_y;
let scrollPos;
let gameChar_screen_x;
let gameChar_world_x;
let gameChar_world_y;
let gameOver;
let gameWon;
let isLeft;
let isRight;
let isFalling;
let isPlummeting;
let game_score;
let flagpole;
let lives;
let cameraPos_x;
let cameraPos_y;
const platforms = [];
const damp = 0.65;
//Game Variable adjust these to make the game easier or harder
const gameChar_speed = 5;
const gameChar_jump = 120;
const winning_score = 6;

//particle variable
let emit;


function preload()
{
    soundFormats('mp3','wav','ogg');
    
    //load your sounds here
    jumpSound = loadSound('assets/jump.wav');
    jumpSound.setVolume(0.06);
	backgroundSound = loadSound('assets/background.wav')
	backgroundSound.setVolume(0.03)
	coinSound = loadSound('assets/coin.wav')
	coinSound.setVolume(0.3);
	gameOverSound = loadSound('assets/gameOver.wav');
	gameOverSound.setVolume(0.3);
	beepSound = loadSound('assets/beep.wav')
	beepSound.setVolume(0.15)
	fallSound = loadSound('assets/fall.wav')
	fallSound.setVolume(0.2)
	winningSound = loadSound('assets/winningSound.ogg')
	winningSound.setVolume(0.15)
	helpImg = loadImage('assets/Help.png')
}

function setup()
{
	createCanvas(1024, 576);
	floorPos_y = height * 3/4;
	cameraPos_x = 0;
	cameraPos_y = 0;

	//Lives start counter -- here to stop being reset
	game_score = 0
	lives = 3
	gameOver = 0
	gameWon = 0
	// Start background music
	backgroundSound.loop()
	startGame()

	//Particle setup for victory 

	emit = new Emitter(width/2, floorPos_y - 330, 1, 0, 5, color(255,215,0, 100));
	emit.startEmitter(100, 500)

	//Add  platforms to the array
	platformArray()
}

function draw()
{
	background(100, 155, 255); 				// fill the sky blue
	
	//Camera translation
	const targetPos_x = gameChar_world_x - gameChar_screen_x
	const targetPos_y = gameChar_world_y - gameChar_screen_y
	//Movement dampening 
	cameraPos_x = cameraPos_x * damp + targetPos_x * (1 - damp);
	cameraPos_y = cameraPos_y * damp + targetPos_y * (1 - damp);

	push();									//Push for scrolling
	translate(-cameraPos_x, -cameraPos_y);

	// draw some green ground 
	noStroke();
	fill(0,155,0);
	rect(cameraPos_x, floorPos_y, width, height/2); 
	// Draw clouds.
	drawCloud();
	// Draw mountains.
	drawMountain();
	// Draw trees.
	drawTrees();
	// Draw canyons.
	for(const p of canyon)
	{
		drawCanyon(p)
		checkCanyon(p)
	};
	// Draw collectable items and check if found..
	for(const p of collectable)
	{
		if(p.isFound == false)
		{
		drawCollectable(p)
		checkCollectable(p)
		}
	};
	//Check if lives collectables are found and draw 
	for(const p of tokens)
	{
		if(p.isFound == false)
		{
		drawTokens(p)
		checkTokens(p)
		}
	};
	// Draw flagpole
	renderFlagpole();

	//Raise Flag when found
	if(flagpole.isReached == false)
	{
		checkFlagpole()
	};

	//Draw Platforms last to be ontop of scenery
	drawPlatforms();

	//Checking if the player has fallen off the screen
	checkPlayerDie();

	//Resume for scrolling 
	pop();

	// Draw game character.
	drawGameChar();

	//Player direction warning trigger
	checkWrongWay();

	//Score counter
	fill(255);
	noStroke();
	textSize(30);
	text("Score: "+ game_score, 15,25);

	//Draw Health remaining
	livesRemaining();

	//Draw game instructions
	gameInstructions();

	//Play game over music and stop bakground music
	if(gameOver == 1)
	{	
		gameOverSound.play()
	};
	//Play the winning horns on loop
	if(gameWon == 1)
	{
		winningSound.loop()
	};
	//Run out of lives 
	if(lives <= 0)
		{	
			fill(250,100,100)
			textSize(50)
			text("Game Over Press space to continue", 50, height/2)
			//loosing sound variable. Stopped when spacebar is pressed below
			gameOver += 1;
			backgroundSound.stop();
			if(key == " ")		//Reset game
			{
				startGame();
				game_score = 0
				lives = 3;
				gameOver = 0;
				backgroundSound.loop();
			}
			return
		};
	// Flag reached 
	if(flagpole.isReached)
		{	
			fill(255)
			textSize(50)
			text("Level complete Press Enter to continue", 50, height/2);
			backgroundSound.stop()
			emit.updateParticles()
			//winning sound variable 
			gameWon += 1
			if(key == "Enter")		//Reset game
			{
				startGame();
				game_score = 0;
				lives = 3;
				gameWon = 0;
				winningSound.stop();
				backgroundSound.loop()
			}
			return;
		};
	
	// Logic to make the game character move or the background scroll.
	if(isLeft)
	{
		gameChar_world_x -= gameChar_speed;
	};

	if(isRight)
	{
		gameChar_world_x  += gameChar_speed;
	};
	// Logic to make the game character rise and fall. with platforms //
	isFalling = false;
	if (gameChar_world_y < floorPos_y) {
		let isContact = false;
		for (const p of platforms) {
		  if (p.checkContact(gameChar_world_x, gameChar_world_y)) {
			isContact = true;
			gameChar_world_y = p.y
			if(p instanceof MovingPlatform)
			{
				gameChar_world_x += p.direction
			}
			break;
		  }
		}
		if(!isContact){
		  isFalling = true;
		  gameChar_world_y += 3;
		}
	  };
	//Plummeting code
	if(isPlummeting == true)
	{
		gameChar_world_y += 3 // speed of the fall 
	};
};


// ---------------------
// Key control functions
// ---------------------

function keyPressed(){

	// if statements to control the animation of the character when
	// keys are pressed.

	if(keyCode == 37 || key == "a")
	{
		isLeft = true
	}
	else if (keyCode == 39 || key == "d")
	{
		isRight = true
	}

	if(!isFalling && !isPlummeting)
	{
		if(keyCode == 32 || key == "w")
		{	
			jumpSound.play();
			gameChar_world_y -= gameChar_jump
		}
	}
};

function keyReleased()
{

	// if statements to control the animation of the character when
	// keys are released.

	if(keyCode == 37 || key == "a")
	{
		isLeft = false
	}
	else if (keyCode == 39 || key == "d")
	{
		isRight = false
	}

};


// ------------------------------
// Game character render function
// ------------------------------

// Function to draw the game character.

function drawGameChar()
{
	//the game character
	if(isLeft && isFalling)
	{
		// add your jumping-left code
		//torso
		fill(0)
		ellipse(gameChar_screen_x, gameChar_screen_y-30, 15, 40)
		//head
		fill(255,235,205)
		ellipse(gameChar_screen_x, gameChar_screen_y -60, 28, 30)
		//Left Arm
		ellipse(gameChar_screen_x - 8, gameChar_screen_y -40, 15, 5)
		//Left Leg
		ellipse(gameChar_screen_x - 6 , gameChar_screen_y - 10, 15, 5)	//bent leg option right
		ellipse(gameChar_screen_x , gameChar_screen_y -7, 5, 15) 		//Straight leg option
		// //Ninja mask
		fill(50,50,50)
		ellipse(gameChar_screen_x - 7, gameChar_screen_y - 62, 13, 7)

	}
	else if(isRight && isFalling)
	{
		// add your jumping-right code
		//torso
		fill(0)
		ellipse(gameChar_screen_x, gameChar_screen_y-30, 15, 40)
		//head
		fill(255,235,205)
		ellipse(gameChar_screen_x, gameChar_screen_y -60, 28, 30)
		//Right Arm
		ellipse(gameChar_screen_x + 8 , gameChar_screen_y -40, 15, 5)
		//Right Leg
		ellipse(gameChar_screen_x , gameChar_screen_y -7, 5, 15) 			//straight leg option
		ellipse(gameChar_screen_x + 6, gameChar_screen_y -10, 15, 5)	// bent leg option 
		// //Ninja mask
		fill(50,50,50)
		ellipse(gameChar_screen_x + 7, gameChar_screen_y - 62, 13, 7)

	}
	else if(isLeft)
	{
		// add your walking left code
		//torso
		fill(0)
		ellipse(gameChar_screen_x, gameChar_screen_y-30, 15, 40)
		//head
		fill(255,235,205)
		ellipse(gameChar_screen_x, gameChar_screen_y -60, 28, 30)
		//Left Arm
		ellipse(gameChar_screen_x , gameChar_screen_y -37, 5, 15)
		//Left Leg
		ellipse(gameChar_screen_x , gameChar_screen_y -7, 5, 15)
		//Right leg
		ellipse(gameChar_screen_x + 7, gameChar_screen_y -13, 15, 5)
		// //Ninja mask
		fill(50,50,50)
		ellipse(gameChar_screen_x - 7, gameChar_screen_y - 62, 13, 7)
	}
	else if(isRight)
	{
		// add your walking right code
		//torso
		fill(0)
		ellipse(gameChar_screen_x, gameChar_screen_y-30, 15, 40)
		//head
		fill(255,235,205)
		ellipse(gameChar_screen_x, gameChar_screen_y -60, 28, 30)
		//Right Arm
		ellipse(gameChar_screen_x , gameChar_screen_y -37, 5, 15)
		//Right Leg
		ellipse(gameChar_screen_x , gameChar_screen_y -7, 5, 15)
		//Left leg
		ellipse(gameChar_screen_x - 7, gameChar_screen_y -13, 15, 5)
		// //Ninja mask
		fill(50,50,50)
		ellipse(gameChar_screen_x + 7, gameChar_screen_y - 62, 13, 7)
	}
	else if(isFalling || isPlummeting)
	{
		// add your jumping facing forwards code
		//torso
		fill(0)
		ellipse(gameChar_screen_x, gameChar_screen_y-30, 20, 40)
		//head
		fill(255,235,205)
		ellipse(gameChar_screen_x, gameChar_screen_y -60, 25, 30)
		//Left Arm
		ellipse(gameChar_screen_x - 15, gameChar_screen_y -42, 15, 5)
		//Right Arm
		ellipse(gameChar_screen_x + 15, gameChar_screen_y -42, 15, 5)
		//Left Leg
		ellipse(gameChar_screen_x - 5, gameChar_screen_y -7, 5, 15)
		//Right leg 		-- can move legs if jump doesnt work --- 
		ellipse(gameChar_screen_x + 5, gameChar_screen_y -7, 5, 15)
		//Ninja mask
		fill(50,50,50)
		ellipse(gameChar_screen_x, gameChar_screen_y - 62, 24, 7)
	}
	else
	{
		// add your standing front facing code
		//torso
		fill(0)
		ellipse(gameChar_screen_x, gameChar_screen_y-30, 20, 40)
		//head
		fill(255,235,205)
		ellipse(gameChar_screen_x, gameChar_screen_y -60, 25, 30)
		//Left Arm
		ellipse(gameChar_screen_x - 9, gameChar_screen_y -37, 5, 15)
		//Right Arm
		ellipse(gameChar_screen_x + 9, gameChar_screen_y -37, 5, 15)
		//Left Leg
		ellipse(gameChar_screen_x - 5, gameChar_screen_y -7, 5, 15)
		//Right leg
		ellipse(gameChar_screen_x + 5, gameChar_screen_y -7, 5, 15)
		//Ninja mask
		fill(50,50,50)
		ellipse(gameChar_screen_x, gameChar_screen_y - 62, 24, 7)

	}
};

// ---------------------------
// Background render functions
// ---------------------------

// Function to draw cloud objects.
function drawCloud()
{
	for(const p of clouds)
	{
		fill(230,230,230,250)
		ellipse(
		p.x_pos + 40 * p.size, 
		p.y_pos, 
		80 * p.size, 
		80 * p.size)
		fill(225,225,225,250)
		ellipse(
		p.x_pos, 
		p.y_pos + 8, 
		80 * p.size, 
		60 * p.size)
		fill(223,222,222,245)
		ellipse(
		p.x_pos + 80 * p.size, 
		p.y_pos, 
		80 * p.size, 
		70 * p.size)
	}
}
// Function to draw mountains objects.
function drawMountain()
{
	for(const p of mountains)
	{
		fill(119,136,153)
		triangle(
			p.x_pos + 110 * p.size,
			p.y_pos ,
			p.x_pos + 330 * p.size, 
			p.y_pos, 
			p.x_pos + 235 * p.size, 
			p.y_pos - 130 * p.size);
		triangle(
			p.x_pos,
			p.y_pos,
			p.x_pos + 260 * p.size,
			p.y_pos,
			p.x_pos+ 100 * p.size,
			p.y_pos- 150 * p.size);
		//second mountain colour
		fill(112,128,144)
		triangle(
			p.x_pos + 80 * p.size, 
			p.y_pos, 
			p.x_pos + 280 * p.size, 
			p.y_pos, 
			p.x_pos + 180 * p.size, 
			p.y_pos - 180 * p.size);
		//Snow cap on tall mountain
		fill(250,250,250,180)
		triangle(
			p.x_pos + 155 * p.size, 
			p.y_pos - 140 * p.size, 
			p.x_pos + 210 * p.size, 
			p.y_pos - 130 * p.size, 
			p.x_pos + 180 * p.size, 
			p.y_pos - 180 * p.size
		)
	}
};
// Function to draw trees objects.
function drawTrees()
{
	for(const p of trees)
	{
		fill(210, 180, 140)
		rect(p.x_pos, treePos_y, 30, 80)
		fill(0, 180, 0)
		triangle(
			p.x_pos - 35,
			treePos_y + 3,
			p.x_pos + 65, 
			treePos_y + 3, 
			p.x_pos + 15,
			treePos_y - 103)
		triangle(p.x_pos - 35,
			treePos_y - 40 ,
			p.x_pos + 65, 
			treePos_y - 40 , 
			p.x_pos + 15,
			treePos_y - 133)
	}	
};
// Class for platforms
class Platform{
	constructor(x, y, length)
	{
		this.x = x;
		this.y = y;
		this.length = length;
	}
	draw()
	{
		noStroke();
		fill(47, 79, 79);
		rect(this.x, this.y, this.length, 15, 20);
	}

	update()
	{
	}

	checkContact(gc_x, gc_y)
	{
		if(gc_x > this.x && gc_x < this.x + this.length)
		{
			const d = this.y - gc_y;
			if(d < 5 && d >= 0)
			{
				return true;
			}
		}
			return false;
		}
};
// Draw Platforms function from array
function drawPlatforms()
{
	for(const p of platforms)
	{
		p.update()
		p.draw()
	}
};
//Moving platform class
class MovingPlatform extends Platform
{
	constructor(x, y, length, range, direction)	// direction + for right or - for left start and number for speed
	{
		super(x, y, length);
		this.range = range;
		this.anchor = x;
		this.direction = direction;
	}
	update()
	{
		this.x += this.direction;
		if(abs(this.anchor - this.x) > this.range)
		{
			this.direction *= -1 
		}
	}
};


//Adding particles for game victory 
// 
//Delete below 
function Particle(x, y, xSpeed, ySpeed, size, colour)
{
	this.x = x;
	this.y = y;
	this.xSpeed = xSpeed;
	this.ySpeed = ySpeed;
	this.size = size;
	this.colour = colour;
	this.age = 0

	this.drawParticle = function()
	{	
		fill(this.colour);
		beginShape()
		vertex(this.x -1 * this.size, this.y +1 * this.size);
		vertex(this.x, this.y+ 3.5 * this.size);
		vertex(this.x + 1 * this.size, this.y + 1 * this.size);
		vertex(this.x + 3.5 * this.size, this.y);
		vertex(this.x + 1 * this.size, this.y -0.8 * this.size);
		vertex(this.x, this.y -3.5 * this.size);
		vertex(this.x -1 * this.size,this.y -0.8 * this.size);
		vertex(this.x -3.5 * this.size, this.y);
		endShape();	
	}
	this.updateParticle = function()
	{
		this.x += xSpeed;
		this.y += ySpeed;
		this.age ++;
	}
};

function Emitter(x, y, xSpeed, ySpeed, size, colour)
{
	this.x = x;
	this.y = y;
	this.xSpeed = xSpeed;
	this.ySpeed = ySpeed;
	this.size = size;
	this.colour = colour;
	this.particles = [];

	this.addParticle = function()
	{
		let p = new Particle(
			random(this.x -10, this.x +10), 
			random(this.y - 10, this.y + 10), 
			random(this.xSpeed * -1, this.xSpeed + 1), 
			random(this.ySpeed -1, this.ySpeed + 1),
			random(this.size -1, this.size +4),this.colour);
		return p;
	};

	this.startParticles = 0
	this.lifetime = 0

	this.startEmitter = function(startParticles, lifetime)
	{
		this.startParticles = startParticles;
		this.lifetime = lifetime
		//Start emitter with inital particels
		for(i = 0; i < startParticles; i ++)
		{	
			this.particles.push(this.addParticle());
		}
	};

	this.updateParticles = function()
	{
		//iterate through particles and draw to the screen
		let deadParticles = 0 
		for( let i = this.particles.length - 1; i >= 0; i--)
		{
			this.particles[i].drawParticle();
			this.particles[i].updateParticle();
			if(this.particles[i].age > random(50, this.lifetime))
			{
				this.particles.splice(i, 1);
				deadParticles++
			}
		}
		if(deadParticles > 0)
		{
			for(let i = 0; i < deadParticles; i ++)
			{
				this.particles.push(this.addParticle());
			}
		}
	};
};
// ---------------------------------
// Canyon render and check functions
// ---------------------------------

// Function to draw canyon objects.

function drawCanyon(t_canyon)
{
		fill(100, 155, 255,);
		rect(t_canyon.x_pos, floorPos_y - 4, t_canyon.width, 140);
		fill(178,34,34, 240);
		noStroke();
		beginShape();
		vertex(t_canyon.x_pos, height)
		vertex(t_canyon.x_pos + t_canyon.width/20 *1, height - random(45,55))
		vertex(t_canyon.x_pos + t_canyon.width/20 *2, height - random(25,55))
		vertex(t_canyon.x_pos + t_canyon.width/20 *4, height - random(55,65))
		vertex(t_canyon.x_pos + t_canyon.width/20 *5, height - random(25,35))
		vertex(t_canyon.x_pos + t_canyon.width/20 *8, height - random(45,55))
		vertex(t_canyon.x_pos + t_canyon.width/20 *10, height - random(15,25))
		vertex(t_canyon.x_pos + t_canyon.width/20 *11, height - random(55,65))
		vertex(t_canyon.x_pos + t_canyon.width/20 *13, height - random(25,55))
		vertex(t_canyon.x_pos + t_canyon.width/20 *15, height - random(45,55))
		vertex(t_canyon.x_pos + t_canyon.width/20 *17, height - random(25,55))
		vertex(t_canyon.x_pos + t_canyon.width/20 *19, height - random(55,65))
		vertex(t_canyon.x_pos + t_canyon.width, height)
		endShape();
		noStroke();
		fill(255,140,0,120)
		beginShape();
		vertex(t_canyon.x_pos, height)
		vertex(t_canyon.x_pos + t_canyon.width/20 *1, height - random(35,45))
		vertex(t_canyon.x_pos + t_canyon.width/20 *2, height - random(25,35))
		vertex(t_canyon.x_pos + t_canyon.width/20 *4, height - random(45,55))
		vertex(t_canyon.x_pos + t_canyon.width/20 *5, height - random(5,10))
		vertex(t_canyon.x_pos + t_canyon.width/20 *8, height - random(35,45))
		vertex(t_canyon.x_pos + t_canyon.width/20 *10, height - random(15,20))
		vertex(t_canyon.x_pos + t_canyon.width/20 *11, height - random(45,55))
		vertex(t_canyon.x_pos + t_canyon.width/20 *13, height - random(25,35))
		vertex(t_canyon.x_pos + t_canyon.width/20 *15, height - random(35,45))
		vertex(t_canyon.x_pos + t_canyon.width/20 *17, height - random(15,25))
		vertex(t_canyon.x_pos + t_canyon.width/20 *19, height - random(45,55))
		vertex(t_canyon.x_pos + t_canyon.width, height)
		endShape();
}

// Function to check character is over a canyon.

function checkCanyon(t_canyon)
{
	if(gameChar_world_x > t_canyon.x_pos &&
		gameChar_world_x < t_canyon.x_pos + t_canyon.width && 
		gameChar_world_y >= floorPos_y && 
		gameChar_world_y < height)
	{
		isPlummeting = true
	}
};

// ----------------------------------
// Collectable items render and check functions
// ----------------------------------

// Function to draw collectable objects.

function drawCollectable(t_collectable)
{
	for(const p of collectable)
	{	
		//apple
		fill(255, 69, 0);
		ellipse(
			t_collectable.x_pos,
			t_collectable.y_pos, 
			35 * t_collectable.size);
		//Leaf
		fill(50, 205,50)
		triangle(
			t_collectable.x_pos - 5 * t_collectable.size, 
			t_collectable.y_pos - 10 * t_collectable.size, 
			t_collectable.x_pos + 10 * t_collectable.size, 
			t_collectable.y_pos - 20 * t_collectable.size,
			t_collectable.x_pos - 5 * t_collectable.size, 
			t_collectable.y_pos - 30 * t_collectable.size);
	}
};
// Function to check character has collected an item
function checkCollectable(t_collectable)
{
	if(dist(gameChar_world_x, gameChar_world_y, t_collectable.x_pos, t_collectable.y_pos) < 40)
	{	
		beepSound.play()
		t_collectable.isFound = true
		game_score += 1
	}
};
//Lives tokens 
function drawTokens(l_collectable)
{
	for(const p of tokens)
	{
	//cross 1
	fill(255, 0, 0);
	rect(
		l_collectable.x_pos,
		l_collectable.y_pos, 
		l_collectable.width,
		l_collectable.height);
	//cross 2
	rect(
		l_collectable.x_pos + 15,
		l_collectable.y_pos - 16, 
		l_collectable.height,
		l_collectable.width);
	}
};
//Check if l_collectable is reached and a life is added
function checkTokens(l_collectable)
{	
	if(dist(gameChar_world_x, gameChar_world_y, l_collectable.x_pos, l_collectable.y_pos) < 70)
	{
		l_collectable.isFound = true
		lives += 1
	}
};
// Flagpole render function
function renderFlagpole()
{	
	push();
	stroke(100);
	strokeWeight(5);
	line(flagpole.x_pos, floorPos_y, flagpole.x_pos, floorPos_y - 200)
	noStroke()
	fill(255,0,0)
	if(flagpole.isReached)
	{
	triangle(
		flagpole.x_pos, floorPos_y - 200, 
		flagpole.x_pos, floorPos_y - 160, 
		flagpole.x_pos + 40, floorPos_y - 180)
	}
	else
	{
		triangle(
			flagpole.x_pos, 
			floorPos_y, 
			flagpole.x_pos, floorPos_y - 40, 
			flagpole.x_pos + 40, 
			floorPos_y - 20)
	}
	pop();
};
//Function to check if character is near the flagpole

function checkFlagpole()
{
	let d = abs(gameChar_world_x - flagpole.x_pos);
	if(d < 10 && game_score >= winning_score)
	{
		flagpole.isReached = true
	}
	if(d < 100 && game_score < winning_score)
	{
		fill(255)
		textSize(50)
		text("Collect more Apples!", cameraPos_x + 100, cameraPos_y + 100);
	}
};
//Function Check if the player has fallen off the screen and has run out of lives
function checkPlayerDie()
{
	if(gameChar_world_y > height && lives > 0)
	{
		lives -= 1;
		if(lives > 0)
		{
			fallSound.play()
			startGame()
		}
	}
};
//Function to check if player is going the wrong way
function checkWrongWay()
{
	if(gameChar_world_x < -1300)
	{
		fill(255)
		textSize(50)
		text("Wrong way! Turn Around!", 50, height/2);
	}
};
//Draw lives remaining icons
function livesRemaining()
{	
	const d = {
	x_pos: width - 75,
	y_pos: 30, 
	width:50, 
	height:20, 
	size: 1,}

	for(let i = 0; i < lives; i++)
		{
		//cross 1
		fill(255, 50, 0, 240);
		rect(
			d.x_pos - i * 75,
			d.y_pos, 
			d.width,
			d.height);
		//cross 2
		rect(
			d.x_pos + 15 - i * 75,
			d.y_pos - 16, 
			d.height,
			d.width);
		}
};
//Game instructions
function gameInstructions()
{
	fill(255);
	noStroke();
	textSize(20)
	text("Hold H for help!", 15,55)

	if(keyIsDown(72))
	{
		image(helpImg, 0, 0);
	const t = "Move around to collect apples to increase your score and find the flag, you need at least " + winning_score + 
				" score before you can capture the flag."
	fill(0)
	textSize(20)
	text(t, 210, 450, 700);
	}
};
//Platform creation list ---- Add new platforms here 
function platformArray()
{
	platforms.push(new MovingPlatform(2140, floorPos_y - 40, 80, 100, 1.5));
	platforms.push(new MovingPlatform(2220, floorPos_y - 110, 60, 80, -1));
	platforms.push(new MovingPlatform(2120, floorPos_y - 180, 60, 80, 1));
	platforms.push(new Platform(-1200, floorPos_y -60, 60 ));
	platforms.push(new Platform(-1150, floorPos_y -140, 60 ));
	platforms.push(new Platform(-1100, floorPos_y -220, 60 ));
};

//Reset the game after the player falls off the screen
function startGame()
{	
	gameChar_screen_x = width/2;
	gameChar_screen_y = floorPos_y;
	gameChar_world_x = gameChar_screen_x;
	gameChar_world_y = gameChar_screen_y;
	treePos_y = floorPos_y - 80;

	// Boolean variables to control the movement of the game character.
	isLeft = false;
	isRight = false;
	isFalling = false;
	isPlummeting = false;
	//Flag pole inisialiation to false and position 
	flagpole = {isReached: false, x_pos: 3000};

	// Initialise arrays of scenery objects.
	trees = [
		{x_pos: -1000, size: 1}, 
		{x_pos: 30, size: 1}, 
		{x_pos: 600, size: 1}, 
		{x_pos: 1200, size: 1}, 
		{x_pos: 1750, size: 1}
	];
	clouds = [
		{x_pos: -1650,y_pos: 150, size: 1},
		{x_pos: -1250,y_pos: 130, size: 0.8},
		{x_pos: -800,y_pos: 120, size: 0.9},
		{x_pos: -500,y_pos: 150, size: 1},
		{x_pos: -250,y_pos: 120, size: 0.9},
		{x_pos: 100,y_pos: 150, size: 1},
		{x_pos: 350 ,y_pos: 150, size: 1.4},
		{x_pos: 800, y_pos: 200, size: 0.8},
		{x_pos: 1100, y_pos: 180, size: 0.9},
		{x_pos: 1400, y_pos: 150, size: 1.1},
		{x_pos: 1780, y_pos: 280, size: 0.5},
		{x_pos: 1950, y_pos: 110, size: 0.8},
		{x_pos: 2150, y_pos: 210, size: 0.8},
		{x_pos: 2400, y_pos: 180, size: 0.9},
		{x_pos: 2750, y_pos: 220, size: 1.1},
		{x_pos: 3370, y_pos: 190, size: 0.8}
	];
	mountains = [
		{x_pos: 3100, y_pos:floorPos_y, size: 1.1},
		{x_pos: 2500, y_pos:floorPos_y, size: 0.9},
		{x_pos: 1800, y_pos:floorPos_y, size: 0.75},
		{x_pos:1140, y_pos:floorPos_y, size: 1},
		{x_pos: 640, y_pos:floorPos_y, size: 0.85},
		{x_pos: 240, y_pos:floorPos_y, size: 1},
		{x_pos: -400, y_pos:floorPos_y, size: 1},
		{x_pos: -950, y_pos:floorPos_y, size: 1},
		{x_pos: -1350, y_pos:floorPos_y, size: 0.8}
		
	];
	canyon = [
		{x_pos: -520,width: 100},
 		{x_pos: 100,width: 100},
		{x_pos: 1000,width: 120},
		{x_pos: 1500,width: 140},
		{x_pos: 2090,width: 220}
	];
	collectable = [
		{x_pos: -1000, y_pos:floorPos_y - 300, isFound:false, size: 1},
		{x_pos: 10, y_pos:floorPos_y - 32, isFound:false, size: 1},
		{x_pos: 750, y_pos:floorPos_y - 32, isFound:false, size: 1},
		{x_pos: 1230, y_pos:floorPos_y - 32, isFound:false, size: 1},
		{x_pos: 1530, y_pos:floorPos_y - 112, isFound:false, size: 1},
		{x_pos: 2200, y_pos:floorPos_y - 300, isFound:false, size: 1}
	];
	tokens = [
		{x_pos: 120, y_pos: floorPos_y - 155, width:50, height:20, isFound:false, size: 1}

	];
	healths = [
		{x_pos: width - 20, y_pos: 50, width:50, height:20, size: 1}
	];

}



