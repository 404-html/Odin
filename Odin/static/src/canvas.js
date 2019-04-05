//constants
const CARD_WIDTH = 134;
const CARD_HEIGHT = 209;
const GAP_SIZE = 20;

class Button {
    constructor(x,y,width,height,text) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.text = text;
        this.hover = false;
    }
    setHover(hover) {
        this.hover = hover;
    }

    canPress() {
        return GAME.yourTurn;
    }
    
    updateLocation(x,y) {
        this.x = x;
        this.y = y;
    }

    draw(ctx) {
        //draw the next turn button
        ctx.fillStyle = this.canPress() ? "#376" : "#999";
        ctx.strokeStyle = this.canPress() ? (this.hover ? "#ffa" : "#fff") : "#fff";
        ctx.fillRect(this.x,this.y,this.width,this.height);
        ctx.strokeRect(this.x,this.y,this.width,this.height);
        ctx.fillStyle = this.canPress() ? (this.hover ? "#ffa" : "#fff") : "#bbb";
        ctx.textAlign = "center";
        ctx.font = "bold 16px Courier New";
        ctx.fillText(this.text,this.x+this.width/2,this.y+this.height/2+5);
    }

    isClicked(x,y) {
       return x>this.x && x<this.x+this.width && y>this.y && y<this.y+this.height;
    }
}

class GameCanvas {
    /**
     * Creates a game canvas
     */
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = canvas.getContext('2d');
    
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        //some assets
        this.backImage = new Image;
        this.backImage.src = '/static/cards/back.png';
        this.transparentImage = new Image;
        this.transparentImage.src = '/static/transparent.png';

        //load all events
        this.canvas.addEventListener('mousedown',mouseDown);
        this.canvas.addEventListener('touchstart',touchStart);
        this.canvas.addEventListener('mouseup',mouseUp);
        this.canvas.addEventListener('touchend',touchEnd);
        this.canvas.addEventListener('mouseleave',mouseLeave);
        this.canvas.addEventListener('wheel',mouseWheel);
        this.canvas.addEventListener('mousemove',mouseMove);
        this.canvas.addEventListener('touchmove',touchMove);
        window.addEventListener('resize',resize);

        this.cardImages = [];
        //load all card images
        for(let url of ALL_URLS) {
            let image = new Image;
            image.src = '/static/' + url;
            this.cardImages['/static/' + url] = image;
        }

        //work out some "constants"
        this.CARD_WIDTH = 134;
        this.CARD_HEIGHT = 209;
        this.GAP_SIZE = 20;
        this.CARD_WIDTH_GAP = this.CARD_WIDTH + this.GAP_SIZE;
        this.CARD_MAX_SCROLL = this.canvas.width/4;
        this.HAND_AREA_BORDER = this.canvas.height-100-this.CARD_HEIGHT;

        //initialize some variables
        this.mousePosition = {x:0,y:0};
        this.selectOffset = {x:0,y:0};
        this.clickPosition = {x:0,y:0};
        this.mouseMove = {x:0,y:0};
        this.draggedCard = -1;
        this.scrollOffset = -this.CARD_WIDTH/2;
        this.scrollSpeed = 0;
        this.dragType = 0;
        this.mousePressed = false;
        

        //some buttons?
        this.finishButton = new Button(this.canvas.width/2+this.CARD_WIDTH+50,this.canvas.height/2-30,120,60,"FINISHED");
    }
    
    /**
     * Main game loop for updating the canvas
     */
    draw(dt) {
        //clear
        this.ctx.clearRect(0,0,canvas.width,canvas.height);
        
        //background
        this.ctx.fillStyle = "#222";
        this.ctx.globalAlpha = 0.6;
        this.ctx.fillRect(0,0,canvas.width,canvas.height);
        this.ctx.globalAlpha = 1;
        
        //draw deck
        this.ctx.drawImage(this.backImage,
            this.canvas.width/2-this.CARD_WIDTH-10,
            this.canvas.height/2-this.CARD_HEIGHT/2,
            this.CARD_WIDTH,this.CARD_HEIGHT);

        //draw discard pile
        if(GAME.topCards.length>0) {
            let x = this.canvas.width / 2 + 10;
            let y = this.canvas.height / 2 - this.CARD_HEIGHT / 2;
            for(let image of GAME.topCards) {
                this.ctx.drawImage(image, x, y, this.CARD_WIDTH, this.CARD_HEIGHT);
                y-=40;
            }
        }
        //draw whose turn it is
        this.ctx.textAlign = "left";
        this.ctx.font = "bold 24px Courier New";
        this.ctx.fillStyle = "#fff";
        this.ctx.fillText(GAME.turnString,this.canvas.width/2+this.CARD_WIDTH+50,this.canvas.height/2-70);

        //draw pickup count
        if(GAME.pickupAmount>0) {
            this.ctx.textAlign = "center";
            this.ctx.fillText("+" + GAME.pickupAmount,this.canvas.width/2-10-this.CARD_WIDTH/2,this.canvas.height/2-this.CARD_HEIGHT/2-12);
        }

        //draw button
        this.finishButton.draw(this.ctx);

        //draw your hand
        for(let i = 0; i<GAME.yourCards.length;i++) {
            let card = GAME.yourCards[i];
            if(i==this.draggedCard) continue;
            this.ctx.drawImage(card.image,
                this.canvas.width/2+this.scrollOffset+i*this.CARD_WIDTH_GAP,this.canvas.height-50-this.CARD_HEIGHT,
                this.CARD_WIDTH,this.CARD_HEIGHT);
            if(!card.allowedToPlay) {
                this.ctx.drawImage(this.transparentImage,
                    this.canvas.width/2+this.scrollOffset+i*this.CARD_WIDTH_GAP,this.canvas.height-50-this.CARD_HEIGHT,
                    this.CARD_WIDTH,this.CARD_HEIGHT);
            }
        }

        //draw card you are dragging
        if(this.draggedCard!=-1) {
            let image;
            if(this.draggedCard>=0) image = GAME.yourCards[this.draggedCard].image;
            else image = this.backImage;
            this.ctx.drawImage(image,this.mousePosition.x+this.selectOffset.x,this.mousePosition.y+this.selectOffset.y,this.CARD_WIDTH,this.CARD_HEIGHT);
            if(this.draggedCard>=0) if(!GAME.yourCards[this.draggedCard].allowedToPlay) {
                this.ctx.drawImage(this.transparentImage,this.mousePosition.x+this.selectOffset.x,this.mousePosition.y+this.selectOffset.y,this.CARD_WIDTH,this.CARD_HEIGHT);
            }
        }
    }

    /**
     * Method when you tap/click a point on the screen
     */
    click(x, y) {
        this.mousePressed = true;
        this.mousePosition.x = x;
        this.mousePosition.y = y;
        //Clicked in hand area
        if(this.mousePosition.y > this.HAND_AREA_BORDER) {
            this.clickPosition.x = this.mousePosition.x-this.scrollOffset;
            this.clickPosition.y = this.mousePosition.y;
            this.dragType = 1;
        }
        //clicking the deck
        else if(this.mousePosition.x>this.canvas.width/2-CARD_WIDTH-10 && this.mousePosition.x<this.canvas.width/2-10 &&
            this.mousePosition.y>this.canvas.height/2-CARD_HEIGHT/2 && this.mousePosition.y<this.canvas.height/2+CARD_HEIGHT/2) {
            this.selectOffset.x = this.canvas.width/2-CARD_WIDTH-10-this.mousePosition.x;
            this.selectOffset.y = this.canvas.height/2-CARD_HEIGHT/2-this.mousePosition.y;
            this.draggedCard = -2;
        }
        //clicking on the finish turn button
        else if(this.finishButton.isClicked(this.mousePosition.x,this.mousePosition.y) && this.finishButton.canPress()) {
            GAME.finishTurn();
        }
    }

    /**
     * Determines the card at the clickPosition
     */
    getClickedCard() {
        let x = this.clickPosition.x-this.canvas.width/2;
        let r = x % (this.CARD_WIDTH+20);
    
        if(r<=this.CARD_WIDTH && this.clickPosition.y<this.canvas.height-50 && this.clickPosition.y>this.canvas.height-50-this.CARD_HEIGHT) {
            let i = Math.floor(x/(this.CARD_WIDTH+20));
    
            if(i>=0 && i<GAME.yourCards.length) {
                //i is the card id you selected
                this.draggedCard = i;
                this.selectOffset.x = -r;
                this.selectOffset.y = (this.canvas.height-50-CARD_HEIGHT)-this.clickPosition.y;
                return;
            }
        }
    
        this.draggedCard = -1;
    }

    /**
     * When you drag the mouse/touch 
     */
    drag(x,y) {
        this.mouseMove.x = event.offsetX-this.mousePosition.x;
        this.mouseMove.y = event.offsetY-this.mousePosition.y;
        this.mousePosition.x = event.offsetX;
        this.mousePosition.y = event.offsetY;

        this.finishButton.setHover(this.finishButton.isClicked(this.mousePosition.x,this.mousePosition.y));
        
        if(this.mousePressed) {
            if(this.dragType==2) {
                this.scrollOffset = this.mousePosition.x-this.clickPosition.x;
                if(this.mousePosition.y<this.canvas.height-100-CARD_HEIGHT) {
                    this.dragType = 3;
                    this.getClickedCard();
                }
            }
            //determine if you are dragging the mouse horizontally or vertically
            else if(this.dragType==1){
                if(Math.abs(this.mousePosition.x-this.scrollOffset-this.clickPosition.x)>20) {
                    this. dragType = 2;
                }
                else if(Math.abs(this.mousePosition.y-this.clickPosition.y)>20) {
                    this.dragType = 3;
                    this.getClickedCard();
                }
            }
        }
    }
    /**
     * Release the mouse/touch
     */
    release() {
        //selected a card
        if(this.draggedCard>=0 && this.mousePosition.y<this.HAND_AREA_BORDER) {
            let card = GAME.yourCards[this.draggedCard];
            if(card.allowedToPlay) {
                GAME.playCard(card.id,0,0);
            }
        }
        //pickup
        else if(this.draggedCard==-2 && this.mousePosition.y>this.HAND_AREA_BORDER) {
            GAME.pickup();
            GAME.finishTurn();
        }
        this.draggedCard = -1;
        this.mousePressed = false;
        this.dragType = 0;
    }

    /**
     * Scrolling 
     */
    scroll(dt) {
        //accelerate based on your dragging speed
        if(this.scrollSpeed > 0) {
            this.scrollSpeed-=dt;
            if(this.scrollSpeed<0) this.scrollSpeed = 0;
        }
        else if(this.scrollSpeed < 0) {
            this.scrollSpeed+=dt;
            if(this.scrollSpeed>0) this.scrollSpeed = 0;
        }

        this.scrollOffset+=this.scrollSpeed;
        if(this.scrollOffset < -GAME.yourCards.length*this.CARD_WIDTH_GAP-this.CARD_MAX_SCROLL) {
            this.scrollOffset = -GAME.yourCards.length*this.CARD_WIDTH_GAP-this.CARD_MAX_SCROLL;
        }
        else if(this.scrollOffset > this.CARD_MAX_SCROLL+this.GAP_SIZE) {
            this.scrollOffset = this.CARD_MAX_SCROLL+this.GAP_SIZE;
        }
    }
}



/*

VARIOUS EVENTS

*/

function mouseDown(event) {
    if(event.button == 0) {
        GAME_CANVAS.click(event.offsetX,event.offsetY);
    }
}
function touchStart(event) {
    GAME_CANVAS.click(event.touches[0].clientX,event.touches[0].clientY);
}
function mouseUp(event) {
    if(event.button==0) {
        GAME_CANVAS.release();
    }
}
function touchEnd(event) {
    GAME_CANVAS.release();
}
function mouseLeave(event) {
    if(GAME_CANVAS.mousePressed) {
        GAME_CANVAS.release();
    }
}
function mouseWheel(event) {
    GAME_CANVAS.scrollSpeed = -100 * Math.sign(event.deltaY);
}
function mouseMove(event) {
    GAME_CANVAS.drag(event.offsetX,event.offsetY);
}
function touchMove(event) {
    GAME_CANVAS.drag(event.touches[0].clientX, event.clientY);
}
function resize() {
    GAME_CANVAS.canvas.width = window.innerWidth;
    GAME_CANVAS.canvas.height = window.innerHeight;
    GAME_CANVAS.CARD_MAX_SCROLL = GAME_CANVAS.canvas.width/4;
    GAME_CANVAS.HAND_AREA_BORDER = GAME_CANVAS.canvas.height-100-GAME_CANVAS.CARD_HEIGHT;
    GAME_CANVAS.finishButton.updateLocation(GAME_CANVAS.canvas.width/2+GAME_CANVAS.CARD_WIDTH+50,GAME_CANVAS.canvas.height/2-30);
}

var lastTime = 0;
function gameLoop(timestamp) {
    let dt = timestamp-lastTime;
    lastTime = timestamp;
    
    //update scrolling speed
    GAME_CANVAS.scroll(dt);
    GAME_CANVAS.draw(dt);

    requestAnimationFrame(gameLoop);
}