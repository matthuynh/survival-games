let stage = null;
let interval = null;
let gamePaused = null;

// Receive updates from the server's model, update the client's model accordingly
function updateStageModel(playerActors, bulletActors, environmentActors, numAlive, hasEnded) {
	if (stage) {
		stage.applyServerUpdates(playerActors, bulletActors, environmentActors, numAlive, hasEnded);
	} else {
		console.log("[CLIENT CONTROLLER WARNING] Could not update Stage on client side -- it doesn't exist");
	}
}

// All setup is implemented here, called when the body from index.html loads
function setupStageModel(
	canvas,
	stageWidth,
	stageHeight,
	playerActors,
	bulletActors,
	crateActors,
	environmentActors,
	startTime,
	numAlive,
	numPlayers,
	playerId,
	gameType
) {
	// Instantiate a new Stage with the canvas element from index.html
	stage = new Stage(
		canvas,
		stageWidth,
		stageHeight,
		playerActors,
		bulletActors,
		crateActors,
		environmentActors,
		startTime,
		numAlive,
		numPlayers,
		playerId,
		gameType
	);
}

// Starts looping the setInterval() function
function startStageModel() {
	clearInterval(interval);
	interval = null;
	// console.log("[CLIENT CONTROLLER] Starting interval for Stage on client side")
	if (!(stage == null)) {
		// Every 20 milliseconds, takes a "step" for animation and also redraws the canvas
		interval = setInterval(function () {
			stage.draw();
		}, 20);
	}
}

// Quit a stage game
function stopStageGame() {
	// console.log("[CLIENT CONTROLLER] Stopping Stage on client side");
	clearInterval(interval); // clearInterval is a library function
	interval = null;
	stage = null;
}

// Called by LobbiesPage.js (React) for sound
function getCurrentPlayerWeapon() {
	// console.log(stage);
	// console.log(stage.player);
	if (stage.player && stage.player.currentWeapon) {
		if (stage.player.currentAmmo > 1) { return stage.player.currentWeapon };
		return -1;
	} 
}

// Toggles the user's GUI -- called by LobbiesPage.js
function toggleGUI() {
	if (stage.player) {
		stage.toggleGUI();
	}
}

// Temporarily pause the looping setInterval() function called in startStageModel() -- game will not redraw
function pauseStageGame() {
	clearInterval(interval);
	interval = null;
	gamePaused = true;
}

// Unpause the game -- game will resume redrawing updates from the server
function unpauseStageGame() {
	if (gamePaused) {
		interval = setInterval(function () {
			stage.draw();
		}, 20);
		gamePaused = false;
	}
}