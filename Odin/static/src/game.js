$(document).ready(function() {
    /*

    SOCKET STUFF


     */
    // SocketIO
    socket = io.connect(document.domain, {
        'reconnection': true,
        'reconnectionDelay': 500,
        'maxReconnectionAttempts': Infinity
    });

    socket.on('connect', function () {
        socket.emit("initial game connection", GAME_ID);
    });

    socket.on('message for player', function (message) {
        $("#message-from-server").html(message);
        $('.modal').modal("show");

    });

    socket.on('card update', cardUpdate);
    socket.on('player update', playerUpdate);

    //Canvas load
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    //Click listener
    canvas.addEventListener('mousedown', (event) => {
        if(event.button==0) {
            click(event.offsetX,event.offsetY);
        }
    },false);
    canvas.addEventListener('touchstart', (event) => {
        click(event.touches[0].clientX,event.touches[0].clientY);
    },false);

    canvas.addEventListener('mouseup', (event) => {
        if(event.button==0) {
            release();
        }
    },false);
    canvas.addEventListener('touchend', () => {
        release();
    },false);

    canvas.addEventListener('mouseleave', () => {
        if(mousePressed) release();
    },false);
    //Mouse wheel listener
    canvas.addEventListener('wheel',(event) => {
        scrollSpeed = -100*Math.sign(event.deltaY);
    },false);
    //update mouse pos
    canvas.addEventListener('mousemove',(event) => {
        mouseMove.x = event.offsetX-mousePosition.x;
        mouseMove.y = event.offsetY-mousePosition.y;
        mousePosition.x = event.offsetX;
        mousePosition.y = event.offsetY;
        if(mousePressed) drag();
    },false);
    canvas.addEventListener('touchmove',(event) => {
        mouseMove.x = event.touches[0].clientX-mousePosition.x;
        mouseMove.y = event.touches[0].clientY-mousePosition.y;
        mousePosition.x = event.touches[0].clientX;
        mousePosition.y = event.touches[0].clientY;
        if(mousePressed) drag();

    },false);
    //update size
    window.addEventListener('resize',() => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    },false);

    //some assets
    backImage = new Image;
    backImage.src = '/static/cards/back.png';
    transparentImage = new Image;
    transparentImage.src = '/static/transparent.png';

    //load all card images
    for(let url of ALL_URLS) {
        let image = new Image;
        image.src = '/static/' + url;
        cardImages['/static/' + url] = image;
    }


    gameLoop(0);
});



/*




        VARIABLES



 */
const CARD_WIDTH = 134;
const CARD_HEIGHT = 209;


let mousePosition = {//mouse position
    x:0,y:0
}
let mouseMove = {//change in mouse position
    x:0,y:0
}
let mousePressed = false;//if the mouse is pressed

//DRAGGING - 0 = none, 1 = "click" or undetermined, 2 = scroll, 3 = move card
let dragType = 0;
let clickPosition = {
    x:0,y:0
}
let selectOffset = {
    x:0,y:0
}

//scrolling
let scrollOffset = -CARD_WIDTH/2;
let scrollSpeed = 0;

//time keeping
let lastTime = 0;


//canvas objects
let canvas, ctx, backImage, transparentImage;
let cardImages = {};

//gameplay (from server)
let yourCards = [];
let selectedCards = [];
let topCards = [];
let draggedCard = -1;

/**
 * Player represents each of your opponents and how many cards they have
 */
class Player {
    constructor(name, nCards) {
        this.name = name;
        this.nCards = nCards;
    }
}

class Card {
    constructor(id, url, allowedToPlay) {
        this.id = id;
        this.allowedToPlay = allowedToPlay;
        this.image = cardImages[url];
    }
}

/**
 * Function for updating your scroll speed through the list of cards
 */
function scroll(dt) {
    //accelerate based on your dragging speed
    if(scrollSpeed > 0) {
        scrollSpeed-=dt;
        if(scrollSpeed<0) scrollSpeed = 0;
    }
    else if(scrollSpeed < 0) {
        scrollSpeed+=dt;
        if(scrollSpeed>0) scrollSpeed = 0;
    }

    scrollOffset+=scrollSpeed;
    if(scrollOffset < -yourCards.length*(CARD_WIDTH+20)-canvas.width/4) {
        scrollOffset = -yourCards.length*(CARD_WIDTH+20)-canvas.width/4;
    }
    else if(scrollOffset > canvas.width/4+20) {
        scrollOffset = canvas.width/4+20;
    }

}

/**
 * Draws the cards in your hand
 */
function drawCards() {
    //draw deck
    ctx.drawImage(backImage,canvas.width/2-CARD_WIDTH-10,canvas.height/2-CARD_HEIGHT/2,CARD_WIDTH,CARD_HEIGHT);

    //draw discard pile
    if(topCards.length>0) {
        let x = canvas.width / 2 + 10;
        let y = canvas.height / 2 - CARD_HEIGHT / 2;
        ctx.drawImage(topCards[topCards.length - 1], x, y, CARD_WIDTH, CARD_HEIGHT);
        for(let id of selectedCards) {
            y-=40;
            ctx.drawImage(yourCards[id].image, x, y, CARD_WIDTH, CARD_HEIGHT);
        }
    }


    //draw your hand
    let offset = CARD_WIDTH + 20;
    for(let i = 0; i<yourCards.length;i++) {
        if(i==draggedCard || selectedCards.includes(i)) continue;
        ctx.drawImage(yourCards[i].image,canvas.width/2+scrollOffset+i*offset,canvas.height-50-CARD_HEIGHT,CARD_WIDTH,CARD_HEIGHT);
        if(!yourCards[i].allowedToPlay) {
            ctx.drawImage(transparentImage,canvas.width/2+scrollOffset+i*offset,canvas.height-50-CARD_HEIGHT,CARD_WIDTH,CARD_HEIGHT)
        }
    }

    //draw card you are dragging
    if(draggedCard>=0) {
        ctx.drawImage(yourCards[draggedCard].image,mousePosition.x+selectOffset.x,mousePosition.y+selectOffset.y,CARD_WIDTH,CARD_HEIGHT);
        if(!yourCards[draggedCard].allowedToPlay) {
            ctx.drawImage(transparentImage,mousePosition.x+selectOffset.x,mousePosition.y+selectOffset.y,CARD_WIDTH,CARD_HEIGHT);
        }
    }

}

/**
 * Main game loop, updates the screen constantly.
 * @param timestamp current timestamp to calculate how much time has passed
 */
function gameLoop(timestamp) {
    let dt = timestamp-lastTime;
    lastTime = timestamp;

    ctx.clearRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle = "#222";
    ctx.globalAlpha = 0.6;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.globalAlpha = 1;

    scroll(dt);

    drawCards();


    requestAnimationFrame(gameLoop);
}

/**
 * Determines if you clicked a card and sets draggedCard to the index of the card you picked.
 */
function getClickedCard() {
    let x = clickPosition.x-canvas.width/2;
    let r = x % (CARD_WIDTH+20);

    if(r<=CARD_WIDTH) {
        let i = Math.floor(x/(CARD_WIDTH+20));

        if(i>=0 && i<yourCards.length) {
            //i is the card id you selected
            draggedCard = i;
            selectOffset.x = -r;
            selectOffset.y = (canvas.height-50-CARD_HEIGHT)-clickPosition.y;
            return;
        }
    }

    draggedCard = -1;
}

/**
 * Function for clicking at a designated position on the screen
 */
function click(x,y) {
    mousePressed = true;
    mousePosition.x = x;
    mousePosition.y = y;
    if(mousePosition.y > canvas.height-100-CARD_HEIGHT) {
        //Clicked in hand area
        clickPosition.x = mousePosition.x-scrollOffset;
        clickPosition.y = mousePosition.y;
        dragType = 1;
    }
}

/**
 * Function for releasing the mouse
 */
function release() {

    //selected a card
    if(draggedCard>=0) {
        if(selectedCards.length==0) {//TODO allow multiple cards
            let card = yourCards[draggedCard];
            if(card.allowedToPlay) {
                selectedCards.push(draggedCard);
                playCard(card.id,0,0);
            }
        }
    }
    draggedCard = -1;
    mousePressed = false;
    dragType = 0;
    /*if(dragType == 2) {
        scrollSpeed = mouseMove.x*10;
    }*/
}

/**
 * Function for when you move the mouse while pressing down left click
 */
function drag() {
    if(dragType==2) {
        scrollOffset = mousePosition.x-clickPosition.x;
        if(mousePosition.y<canvas.height-100-CARD_HEIGHT) {
            dragType = 3;
            getClickedCard();
        }
    }
    //determine if you are dragging the mouse horizontally or vertically
    else if(dragType==1){
        if(Math.abs(mousePosition.x-scrollOffset-clickPosition.x)>20) {

            dragType = 2;
        }
        else if(Math.abs(mousePosition.y-clickPosition.y)>20) {
            dragType = 3;
            getClickedCard();
        }
    }
}

/*



            SOCKET FUNCTIONS



 */

/**
 * Is called when the server sends you a list of cards
 * @param cards
 */
function cardUpdate(cards) {
    console.log(cards);
    yourCards.length = 0;
    for(let card of cards['your cards']) {
        yourCards.push(new Card(card['card id'],card['card image url'],card['can be played']));
    }
    //update cards at the top
    topCards.length = 0;
    for(let card of cards['cards on deck']) {
        let image = new Image;
        image.src = card['card image url'];
        topCards.push(image);
    }
}

/**
 * Is called to update the player on how many cards each person now has
 * @param players
 */
function playerUpdate(players) {
    console.log("player update");
    console.log(players);
    // not currently working!
    // players example:
    // {
    //   "Players":
    //     [
    //       {
    //         "current turn": false,
    //         "number of cards": 15,
    //         "name": "Jeff"
    //       },
    //       {
    //         "current turn": true,
    //         "number of cards": 5,
    //         "name": "Bob"
    //       }
    //     ],
    //   "direction": "Left"
    // }
}


function playCard(cardId, picked_option){
    // leave picked_option as null unless needed
    socket.emit("game message", GAME_ID, "play card", [cardId, picked_option]);
}

function sayUno(){
    socket.emit("game message", GAME_ID, "uno", null);
}

function finishTurn(){
    // not currently working!
    socket.emit("game message", GAME_ID, "finished turn", null);
}

/*




        MAIN FUNCTION




 */
$(document).ready(function() {
    //Canvas load
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    //Click listener
    canvas.addEventListener('mousedown', (event) => {
        if(event.button==0) {
            click(event.offsetX,event.offsetY);
        }
    },false);
    canvas.addEventListener('touchstart', (event) => {
        click(event.touches[0].clientX,event.touches[0].clientY);
    },false);

    canvas.addEventListener('mouseup', (event) => {
        if(event.button==0) {
            release();
        }
    },false);
    canvas.addEventListener('touchend', () => {
        release();
    },false);

    canvas.addEventListener('mouseleave', () => {
        if(mousePressed) release();
    },false);
    //Mouse wheel listener
    canvas.addEventListener('wheel',(event) => {
        scrollSpeed = -100*Math.sign(event.deltaY);
    },false);
    //update mouse pos
    canvas.addEventListener('mousemove',(event) => {
        mouseMove.x = event.offsetX-mousePosition.x;
        mouseMove.y = event.offsetY-mousePosition.y;
        mousePosition.x = event.offsetX;
        mousePosition.y = event.offsetY;
        if(mousePressed) drag();
    },false);
    canvas.addEventListener('touchmove',(event) => {
        mouseMove.x = event.touches[0].clientX-mousePosition.x;
        mouseMove.y = event.touches[0].clientY-mousePosition.y;
        mousePosition.x = event.touches[0].clientX;
        mousePosition.y = event.touches[0].clientY;
        if(mousePressed) drag();

    },false);
    //update size
    window.addEventListener('resize',() => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    },false);

    backImage = new Image;
    backImage.src = '/static/cards/back.png';
    transparentImage = new Image;
    transparentImage.src = '/static/transparent.png';

    gameLoop(0);
});
>>>>>>> c4fbe6c3cfbf85bfedfe2e45c8c964880b7e6a72
