// A Stage stores a canvas, actors, and the player
class Stage {
	constructor(
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
		playerID
	) {
		console.log("Instantiating Stage on client side");
		this.canvas = canvas; // canvas.width and canvas.height correspond to the user's own browser dimensions
		this.graphicsContext = canvas.getContext("2d");

		this.numPlayers = numPlayers;
		this.numAlive = numAlive;
		this.hasEnded = false; // true if the game has ended on the server side
		this.isSpectating = false;
		this.startTime = startTime;

		this.stageWidth = stageWidth; // the stageWidth and stageHeight are the logical width and height of the stage. They are set from the server side.
		this.stageHeight = stageHeight;
		this.centerX = null; // stores the last known spot of the player (used for drawing and spectating)
		this.centerY = null;
		this.displayGUI = true;
		this.displayMinimapLarge = false; // toggles between small and large view

		this.playerActors = playerActors; // includes all Players
		this.bulletActors = bulletActors; // stores Bullets
		this.crateActors = crateActors; // Crates and Bushes
		this.environmentActors = environmentActors; // these actors cannot collide. Includes Lines, buffs (HP, ammo, speed boost, RDS)

		// Each client's stage should know which player belongs to that client
		this.player = null;
		this.playerID = playerID;
		for (let i = 0; i < this.playerActors.length; i++) {
			if (this.playerActors[i].playerID == this.playerID) {
				this.player = {
					x: this.playerActors[i].playerPositionX,
					y: this.playerActors[i].playerPositionY,
					currentHP: this.playerActors[i].playerHP,
					maxHP: this.playerActors[i].playerMaxHP,
					currentAmmo: this.playerActors[i].gunBullets,
					ammoCapacity: this.playerActors[i].gunCapacity,
				};
				this.centerX = this.player.x;
				this.centerY = this.player.y;
				break;
			}
		}
	}

	// Apply updates from the server model to the client model state
	applyServerUpdates(
		playerActors,
		bulletActors,
		environmentActors,
		numAlive,
		hasEnded
	) {
		this.playerActors = playerActors;
		this.bulletActors = bulletActors;
		this.environmentActors = environmentActors;
		this.numAlive = numAlive;
		this.hasEnded = hasEnded; // TODO: Not using this right now

		// Each client's stage should know which player belongs to that client
		let playerStillAlive = false;
		for (let i = 0; i < this.playerActors.length; i++) {
			if (this.playerActors[i].playerID == this.playerID) {
				this.player = {
					x: this.playerActors[i].playerPositionX,
					y: this.playerActors[i].playerPositionY,
					currentHP: this.playerActors[i].playerHP,
					maxHP: this.playerActors[i].playerMaxHP,
					currentWeapon: this.playerActors[i].currentWeapon,
					currentAmmo: this.playerActors[i].gunBullets,
					ammoCapacity: this.playerActors[i].gunCapacity,
				};
				this.centerX = this.player.x;
				this.centerY = this.player.y;
				playerStillAlive = true;
				break;
			}
		}

		if (!playerStillAlive) {
			this.isSpectating = true;
		}
	}

	// Draw the canvas. This function is run every interval defined in ClientController.startStageModel()
	draw() {
		let context = this.graphicsContext;

		// Camera movement code -- keep user's player centered on screen
		context.save();
		context.resetTransform();
		context.translate(
			this.canvas.width / 2 - this.player.x,
			this.canvas.height / 2 - this.player.y
		);
		// this.canvas.style.width = this.canvas.clientWidth;
		// this.canvas.style.height = this.canvas.clientHeight;

		context.clearRect(
			-1000,
			-1000,
			this.stageWidth * 4,
			this.stageHeight * 4
		); // Note that this must match with the size of the world border
		context.globalCompositionOperation = "destination-over";

		// Generates the "world border" (a blue rectangle behind the green rectangle)
		context.fillStyle = "rgb(30,144,255)";
		context.fillRect(
			-1000,
			-1000,
			this.stageWidth * 4,
			this.stageHeight * 4
		);

		// Generate the playing field for the world (a green rectangle), along with gridlines
		context.fillStyle = "rgba(34,139,34,1)";
		context.fillRect(0, 0, this.stageWidth, this.stageHeight);
		context.lineWidth = 1;
		this.drawGridlines(context, this.stageWidth, this.stageHeight);

		// Draw all actors on the canvas
		for (let i = 0; i < this.playerActors.length; i++) {
			// TODO: Test this feature to see if its feasible in multiplayer
			// if (this.playerActors[i].isHidden && this.playerActors[i].playerID !== this.playerID) {
			// 	continue;
			// }
			this.drawPlayer(context, this.playerActors[i]);
		}
		for (let i = 0; i < this.bulletActors.length; i++) {
			this.drawBullet(context, this.bulletActors[i]);
		}
		for (let i = 0; i < this.crateActors.length; i++) {
			this.drawCrate(context, this.crateActors[i]);
		}
		for (let i = 0; i < this.environmentActors.length; i++) {
			this.drawEnvironmentObject(context, this.environmentActors[i]);
		}

		// Draw the game GUI (health bar, ammo, etc.)
		this.displayGUI && this.drawGUI(context);

		context.restore();
	}

	/**
	 * Notes for scaling and positioning relative to canvas size:
	 * - Note that the y-axis is positive in the down direction
	 * - Shapes are drawn with positive y going down
	 * - x-axis is still the same as normal
	 * - origin (0,0) is top-left
	 * - For this reason, you may need to subtract from the coords a bit to see the actual shape, depending on the size of the shape
	 *
	 * Center:
	 * this.centerX
	 * this.centerY
	 *
	 * Bottom left:
	 * this.centerX - (this.canvas.width / 2),
	 * this.centerY + (this.canvas.height / 2)
	 *
	 * Bottom right:
	 * this.centerX + (this.canvas.width / 2),
	 * this.centerY + (this.canvas.height / 2)
	 *
	 * Top left:
	 * this.centerX - (this.canvas.width / 2),
	 * this.centerY - (this.canvas.height / 2)
	 *
	 *
	 * Top right:
	 * this.centerX + (this.canvas.width / 2),
	 * this.centerY - (this.canvas.height / 2)
	 *
	 */
	drawGUI(context) {
		let topLeftX = this.centerX - this.canvas.width / 2,
			topLeftY = this.centerY - this.canvas.height / 2,
			topRightX = this.centerX + this.canvas.width / 2,
			topRightY = this.centerY - this.canvas.height / 2;

		let bottomLeftX = this.centerX - this.canvas.width / 2,
			bottomLeftY = this.centerY + this.canvas.height / 2,
			bottomRightX = this.centerX + this.canvas.width / 2,
			bottomRightY = this.centerY + this.canvas.height / 2;

		// console.log(`Canvas dimensions -- width: ${this.canvas.width}, height: ${this.canvas.height}`);

		// Draw a death message if the player died
		// TODO: Move this out of drawGUI, since user can toggle this to turn off. Could be confusing
		if (this.isSpectating) {
			context.font = "40px verdana";
			context.fillStyle = "rgba(255,0,0,1)";
			context.fillText("YOU DIED", this.centerX - 100, this.centerY - 10);
		}

		// Draw the logged in user's username
		context.fillStyle = "rgba(0,0,0,1)";
		// context.font = "40px Impact";
		// context.fillText(this.playerID, bottomLeftX + 10, bottomLeftY - 10);

		// Draw the number of remaining enemies
		context.font = "30px impact";
		context.fillText(
			`Alive: ${this.numAlive}/${this.numPlayers}`,
			topLeftX + 10,
			topLeftY + 35
		);

		// Draw the elapsed time since the game started
		context.font = "30px impact";
		let currentTime = Math.round(new Date().getTime() / 1000);
		let elapsedTime = Math.round(currentTime) - this.startTime;
		context.fillText(`${elapsedTime} s`, topLeftX + 10, topLeftY + 70);

		// TODO: Store some relative positions in variables (eg. this.canvas.width / 4) instead of having JS calculate each time
		// Draw the HP bar
		let playerHPPercent = this.isSpectating
			? 0
			: this.player.currentHP / this.player.maxHP;
		context.lineWidth = 1;
		context.fillStyle = "rgba(0,0,0,1)"; // black rectangle
		context.fillRect(
			this.centerX - this.canvas.width / 4,
			this.centerY + this.canvas.height / 2 - 45,
			this.canvas.width / 2 + 9,
			40
		);
		context.fillStyle = "rgba(169,169,169,1)"; // light grey rectangle
		context.fillRect(
			this.centerX - this.canvas.width / 4 + 5,
			this.centerY + this.canvas.height / 2 - 40,
			this.canvas.width / 2,
			30
		);
		context.fillStyle = "rgba(181,9,0,1)"; // red rectangle
		context.fillRect(
			this.centerX - this.canvas.width / 4 + 5,
			this.centerY + this.canvas.height / 2 - 40,
			playerHPPercent * (this.canvas.width / 2),
			30
		);

		// Draw the HP percentage
		context.font = "20px verdana";
		context.fillStyle = "rgba(255,255,255,1)";
		context.fillText(
			`${Math.round(playerHPPercent * 100)}%`,
			this.centerX - this.canvas.width / 4 + 8,
			this.centerY + this.canvas.height / 2 - 18
		);

		// Draw the health status message
		context.fillStyle = "rgba(0,0,0,1)";
		context.font = "14px Impact";
		let healthMessage = "Full Health 😎";
		if (playerHPPercent > 0.8 && playerHPPercent < 1) {
			healthMessage = "Optimal Health 🤗";
		} else if (playerHPPercent > 0.5 && playerHPPercent <= 0.8) {
			healthMessage = "Good 🤔";
		} else if (playerHPPercent > 0.25 && playerHPPercent <= 0.5) {
			healthMessage = "Caution 🙄";
		} else if (playerHPPercent > 0.08 && playerHPPercent <= 0.25) {
			healthMessage = "Danger! Find shelter or HP pots 😨";
		} else if (playerHPPercent > 0 && playerHPPercent <= 0.08) {
			healthMessage = "YOU GOOFED. GOOD LUCK NOW lmao 😰";
		} else if (playerHPPercent <= 0) {
			healthMessage = "you dedded 😵";
		}
		context.fillText(
			healthMessage,
			this.centerX - this.canvas.width / 4,
			this.centerY + this.canvas.height / 2 - 50
		);

		// Draw the weapons bar (the "highlighted" bar represents the user's current weapon)
		const numWeapons = 3; // this value needs to be hardcoded depending on how many possible weapons there are 
		context.fillStyle = "rgba(160,160,160,0.5)";
		let offsetY = 10;
		for (let i = 0; i < numWeapons; i++) {
			if (numWeapons - 1 - i == this.player.currentWeapon) {
				context.fillStyle = "rgba(255,255,255,0.5)";
			}
			context.fillRect(
				bottomRightX - this.canvas.width / 6,
				bottomRightY - offsetY,
				this.canvas.width / 7,
				-40
			);
			offsetY += 50;
			context.fillStyle = "rgba(140,140,140,0.5)";
		}
		
		// Draw the weapon border, weapon name, and weapon number
		const weaponNames = ["Rifle", "Revolver", "Fists"];
		const weaponNumbers = ["3", "2", "1"];
		context.fillStyle = "rgba(0,0,0,1)";
		context.font = "20px Impact";
		offsetY = 10;
		for (let i = 0; i < 3; i++) {
			context.fillText(
				weaponNames[i],
				bottomRightX - this.canvas.width / 6,
				bottomRightY - offsetY
			);
			context.textAlign = "right"
			context.fillText(
				weaponNumbers[i],
				bottomRightX - (this.canvas.width / 6) + (this.canvas.width / 7 - 10),
				bottomRightY - offsetY
			)
			context.textAlign = "start"
			context.strokeRect(
				bottomRightX - this.canvas.width / 6,
				bottomRightY - offsetY,
				this.canvas.width / 7,
				-40
			);
			offsetY += 50;
		}

		// Draw the ammo count
		if (this.player.currentWeapon >= 1) {
			context.textAlign = "center"
			context.fillStyle = "rgba(0,0,0,1)";
			context.font = "50px Impact";
			context.fillText(
				this.player.currentAmmo,
				this.centerX,
				this.centerY + this.canvas.height / 2 - 50
			)
			context.font = "20px Impact";
			context.fillText(
				`/${this.player.ammoCapacity}`,
				this.centerX + 70,
				this.centerY + this.canvas.height / 2 - 50
			)
		}
		context.textAlign = "start"

		// this.drawMinimap(context, bottomLeftX, bottomLeftY); // this is here so that it can be toggled to display with toggle GUI
	}

	// Given a context for a canvas, draw gridlines on the canvas
	drawGridlines(context, width, height) {
		// Vertical gridlines
		for (let x = 0; x <= width; x += 250) {
			context.moveTo(0.5 + x, 0);
			context.lineTo(0.5 + x, height);
		}

		// Horizontal gridlines
		for (let y = 0; y <= height; y += 250) {
			context.moveTo(0, 0.5 + y);
			context.lineTo(width, 0.5 + y);
		}
		context.strokeStyle = "black";
		context.stroke();
	}

	// Draw a Player
	drawPlayer(context, p) {
		// Draw a Player
		context.fillStyle = p.playerColour;
		context.beginPath();
		context.arc(
			p.playerPositionX,
			p.playerPositionY,
			p.playerRadius,
			0,
			2 * Math.PI,
			false
		);
		context.fill();

		// Draw a Player's hands
		context.beginPath();
		context.fillStyle = "rgba(0,0,0,1)";
		let playerHandX =
			p.playerPositionX + p.cursorDirectionX * p.playerRadius;
		let playerHandY =
			p.playerPositionY + p.cursorDirectionY * p.playerRadius;
		context.arc(playerHandX, playerHandY, 10, 0, 2 * Math.PI, false);
		context.fill();

		// Draw the player's name
		if (this.displayGUI) {
			context.font = "20px Lucida Console";
			context.textAlign = "center"
			context.fillText(
				p.playerID,
				p.playerPositionX,
				p.playerPositionY - 35
			)
			context.textAlign = "start"; // all the other text in the GUI uses this
		}
	}

	// Draw a Bullet
	drawBullet(context, b) {
		context.fillStyle = b.colour;
		context.beginPath();
		context.arc(
			b.bulletX + b.bulletCursorDirectionX * b.bulletRadius,
			b.bulletY + b.bulletCursorDirectionY * b.bulletRadius,
			b.bulletRadius,
			0,
			2 * Math.PI,
			false
		);
		context.fill();
	}

	// Draw a Crate
	drawCrate(context, c) {
		context.fillStyle = c.crateColour;
		context.fillRect(c.crateX, c.crateY, c.crateWidth, c.crateHeight);

		// Draw the crate's border
		context.strokeStyle = "rgba(0,0,0,1)";
		context.lineWidth = 1;
		context.strokeRect(c.crateX, c.crateY, c.crateWidth, c.crateHeight);
	}

	// Given a reference o to a Line, draw it (direction line / scope sight)
	drawLine(context, o) {
		context.moveTo(o.lineStartingX, o.lineStartingY);
		context.lineTo(o.lineEndingX, o.lineEndingY);
		context.strokeStyle = o.lineColour;
		context.lineWidth = o.lineWidth;
		context.stroke();
	}

	// Given a reference o to a Bush, draw it
	drawBush(context, o) {
		context.fillStyle = o.bushColour;
		context.beginPath();
		context.arc(o.bushX, o.bushY, o.bushRadius, 0, 2 * Math.PI, false);
		context.fill();
	}

	// Given an environment object, determine its specific object, then draw it
	drawEnvironmentObject(context, e) {
		let textX, textY;
		switch (e.type) {
			case "LineEnv":
				this.drawLine(context, e);
				break;
			case "AmmoEnv":
				textX = e.x - e.radius / 2 - 3;
				textY = e.y + 1;
				this.drawObject(
					context,
					e,
					"12px Courier",
					"AMMO",
					textX,
					textY
				);
				break;
			case "HealthPotEnv":
				textX = e.x - e.radius / 2 + 2;
				textY = e.y + 2;
				this.drawObject(context, e, "14px Courier", "HP", textX, textY);
				break;
			case "BushEnv":
				this.drawBush(context, e);
				break;
			case "ScopeEnv":
				textX = e.x - e.radius / 2 - 3;
				textY = e.y + 1;
				this.drawObject(
					context,
					e,
					"12px Courier",
					"RDS",
					textX,
					textY
				);
				break;
			case "SpeedBoostEnv":
				textX = e.x - e.radius / 2 - 9;
				textY = e.y + 2;
				this.drawObject(
					context,
					e,
					"12px Courier",
					"SPEED",
					textX,
					textY
				);
				break;
			case "PistolEnv":
				textX = e.x - e.radius / 2 - 8;
				textY = e.y + 1;
				this.drawObject(
					context,
					e,
					"12px Courier",
					"PISTOL",
					textX,
					textY
				);
				break;
			case "BurstRifleEnv":
				textX = e.x - e.radius / 2 - 7;
				textY = e.y + 2;
				this.drawObject(
					context,
					e,
					"12px Courier",
					"RIFLE",
					textX,
					textY
				);
				break;
			default:
				break;
		}
	}

	// Given a reference o to an environmental object, draw it
	// These include: RDS, Speed Boosts, Small Guns, Big Guns, Ammo, Health Pots
	drawObject(context, o, font, fontText, fontX, fontY) {
		context.fillStyle = o.colour;
		context.beginPath();
		context.arc(o.x, o.y, o.radius, 0, 2 * Math.PI, false);
		context.stroke();
		context.font = font;
		context.fillText(fontText, fontX, fontY);
	}

	// Alternate approach: make a separate canvas, and draw all crates and bushes on it, and ONLY
	// draw the current player
	drawMinimap(context, bottomLeftX, bottomLeftY) {
		// Draw "border" around minimap
		context.lineWidth = 5;
		context.fillStyle = "rgba(0,0,0,1)"; // black rectangle
		context.strokeRect(
			bottomLeftX + 10,
			bottomLeftY - this.canvas.width / 7 - 5,
			this.canvas.width / 7 - 5,
			this.canvas.width / 7 - 5,
		);
		context.lineWidth = 1;
		
		// NOTE: Seems like this won't work, since it is just copying the original canvas,
		// which has varying width and length (as it resizes to the user's browser)
		// It also doesn't show the entire map, since it just copies what the user can
		// already see, but makes it smaller.
		let minimap = document.createElement('canvas');
		let minimapContext = minimap.getContext('2d');

		// minimapContext.width = this.stageWidth;
		// minimapContext.height = this.stageHeight;
		minimapContext.scale(0.2, 0.2);
		// Try using this.graphicsContext
		// Difference between this.graphicsContext and this.canvas?
		minimapContext.drawImage(this.canvas, 0, 0);
		
		context.drawImage(minimap, bottomLeftX + 10, bottomLeftY - this.canvas.width / 7 - 5, this.canvas.width / 7 - 5, this.canvas.width / 7 - 5);
	}

	// Toggles the GUI display
	toggleGUI() {
		this.displayGUI = !this.displayGUI;
	}

	toggleMinimapSize() {
		this.displayMinimapLarge = !this.displayMinimapLarge;
	}
}
