let stage = null;
let interval = null;

// Receive updates from the server's model, update the client's model accordingly
function updateStageModel(playerActors, bulletActors, environmentActors, numAlive, hasEnded) {
	if (stage) {
		stage.applyServerUpdates(playerActors, bulletActors, environmentActors, numAlive, hasEnded);
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
	playerId
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
		playerId
	);
}

// Starts looping the setInterval() function
function startStageModel() {
	if (!(stage == null)) {
		// Every 20 milliseconds, takes a "step" for animation and also redraws the canvas
		interval = setInterval(function () {
			stage.draw();
		}, 20);
	}
}

// Quit a stage game
function stopStageGame() {
	clearInterval(interval);
	interval = null;
	stage = null;
}