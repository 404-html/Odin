
/**
 * Class for the main game canvas
 */
class Gui {
    /**
     * Creates a game canvas
     */
    constructor() {
        //some assets
        this.backImage = new Image;
        this.backImage.src = '/static/cards/back.png';
        this.transparentImage = new Image;
        this.transparentImage.src = '/static/transparent.png';


        this.cardImages = [];
        //load all card images
        for(let url of ALL_URLS) {
            let image = new Image;
            image.src = '/static/' + url;
            this.cardImages['/static/' + url] = image;
        }


        //initialize some variables
        this.optionsWindow = null;
        this.playAll = false;

        //SOME BUTTONS


        //finish
        this.finishButton = new Button(CARD_WIDTH*2+1, 4, 2, "+1");
        this.finishButton.x = function() {
            return gui.getLeftX() + GUI_SCALE*18;
        }
        this.finishButton.y = function() {
            return gui.getBottomY() - GUI_SCALE*12;
        };
        //undo
        this.undoButton = new Button(CARD_WIDTH, 3, 1, "UNDO");
        this.undoButton.x = function() {
            return gui.getLeftX() + GUI_SCALE*18;
        }
        this.undoButton.y = function() {
            return gui.getBottomY() - GUI_SCALE*7;
        };
        //undo all
        this.undoAllButton = new Button(CARD_WIDTH, 3, 1, "UNDO ALL");
        this.undoAllButton.x = function() {
            return gui.getLeftX() + GUI_SCALE*(19+CARD_WIDTH);
        }
        this.undoAllButton.y = function() {
            return gui.getBottomY() - GUI_SCALE*7;
        };


        //SCROLLER
        this.cardScroller = new ScrollArea(new Container(),CARD_WIDTH+1,CARD_HEIGHT+9,IS_MOBILE ? 0 : 3);
    }

    updateCards(cardPanels) {
        this.cardScroller.setItems(cardPanels);
    }

    /**
     * Set the dimensions of gaps and gaps based on your canvas window size
     */
    setCardDimensions() {
        this.CARD_WIDTH = CARD_WIDTH*GUI_SCALE;
        this.CARD_HEIGHT = CARD_HEIGHT*GUI_SCALE;
    }

    getLeftX() {
        return (canvas.width/2-GUI_SCALE*22)*0.8;
    }

    getBottomY() {
        let y = canvas.height - GUI_SCALE*(CARD_HEIGHT+10 + (IS_MOBILE ? 0 : 3));
        return y;
    }
    
    /**
     * Main game loop for updating the canvas
     */
    draw(dt) {
        //clear
        ctx.clearRect(0,0,canvas.width,canvas.height);
        
        //background
        ctx.fillStyle = "#222";
        ctx.globalAlpha = 0.6;
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.globalAlpha = 1;

        let bottomY = this.getBottomY();
        if(LAYOUT_TYPE == 0) bottomY -= GUI_SCALE*3;
        let leftX = this.getLeftX();

        //draw discard pile
        if(game.topCards.length>0) {
            let x = leftX + (game.topCards.length-1)*GUI_SCALE*2;
            let y = bottomY-this.CARD_HEIGHT;
            for(let image of game.topCards) {
                ctx.drawImage(image, x, y, this.CARD_WIDTH, this.CARD_HEIGHT);
                ctx.drawImage(this.transparentImage,x,y,this.CARD_WIDTH,this.CARD_HEIGHT);
                x-=GUI_SCALE*2;
            }
        }
        //draw planning cards
        if(game.planningCards.length>0) {
            let x = leftX-GUI_SCALE;
            let y = bottomY-this.CARD_HEIGHT-GUI_SCALE;
            let gap = GUI_SCALE*2;
            let maxGap = (y-GUI_SCALE)/(game.planningCards.length-1);
            if(maxGap < gap) gap = maxGap;
            for(let card of game.planningCards) {
                ctx.drawImage(card.image,x,y,this.CARD_WIDTH,this.CARD_HEIGHT);
                y-=gap;
            }
        }

        //draw the number of cards you have
        let bigFontSize = Math.round(GUI_SCALE*2);
        ctx.textAlign = LAYOUT_TYPE == 0 ? "center" : "left";
        ctx.font = "bold " + bigFontSize + "px Courier New";
        ctx.fillStyle = "#fff";

        leftX += GUI_SCALE*18;

        if(LAYOUT_TYPE == 0) {
            ctx.fillText(game.turnString,canvas.width/2,bottomY+GUI_SCALE*3);
        }
        else {
            ctx.fillText(game.turnString,leftX,bottomY-GUI_SCALE/2);
        }

        //DRAW BUTTONS

        //finish button
        if(game.planningCards.length==0) {
            let pickupAmount = 1;
            if(game.pickupAmount>0) pickupAmount = game.pickupAmount;
            this.finishButton.text = "+" + pickupAmount;
        }
        else {
            this.finishButton.text = "PLAY CARDS";
        }
        this.finishButton.drawThis(game.yourTurn);

        //undo button(s)
        if(game.planningCards.length>0) {
            this.undoButton.drawThis(true);
            this.undoAllButton.drawThis(true);
        }


        //draw players
        /*if(game.players.length>0) {
            let px = canvas.width/2-this.CARD_WIDTH*2.5;
            let py = canvas.height/2+this.CARD_HEIGHT/4;
            let pheight = GUI_SCALE*2.5;
            let pgap = GUI_SCALE;
            fontSize = Math.round(this.CARD_WIDTH/8);

            ctx.textAlign = "left";
            ctx.font = "bold " + fontSize + "px Courier New";
            let i = 0;
            for(let player of game.players) {
                //box
                ctx.fillStyle = i==game.yourId ? "#b99" : "#999";
                ctx.fillRect(px-fontSize/2,py-fontSize,this.CARD_WIDTH,pheight);
                if(i==game.turn) ctx.strokeStyle = "#ffa";
                else ctx.strokeStyle = "#fff";
                ctx.strokeRect(px-fontSize/2,py-fontSize,this.CARD_WIDTH,pheight);
                
                //name
                if(i==game.turn) ctx.fillStyle = "#ffa";
                else ctx.fillStyle = "#fff";
                ctx.fillText(player.name,px,py,this.CARD_WIDTH-fontSize);
                ctx.fillText(player.nCards,px,py+pgap,this.CARD_WIDTH-fontSize);

                //iterate
                py-=pgap+pheight;
                i++;
            }

            //draw an arrow to show direction
            ctx.strokeStyle = "#ffa";
            ctx.beginPath();
            let topy = py-fontSize+pheight+pgap+pheight/2;
            let bottomy = canvas.height/2+this.CARD_HEIGHT/4-fontSize+pheight/2;
            let arrowx = px+this.CARD_WIDTH+GUI_SCALE*0.75;
            ctx.moveTo(arrowx,topy);
            ctx.lineTo(arrowx,bottomy);
            ctx.stroke();
            //arrowhead
            ctx.beginPath();
            if(game.direction==1) {
                ctx.moveTo(arrowx-GUI_SCALE/2,topy+GUI_SCALE/2);
                ctx.lineTo(arrowx,topy);
                ctx.lineTo(arrowx+GUI_SCALE/2,topy+GUI_SCALE/2);
            }
            else {
                ctx.moveTo(arrowx-GUI_SCALE/2,bottomy-GUI_SCALE/2);
                ctx.lineTo(arrowx,bottomy);
                ctx.lineTo(arrowx+GUI_SCALE/2,bottomy-GUI_SCALE/2);
            }
            ctx.stroke();
        }*/


        //DRAW CARD SCROLLER
        this.cardScroller.draw();
        //DRAW CARD OPTIONS WINDOW
        if(this.optionsWindow!=null) this.optionsWindow.draw(canvas.width/2-this.CARD_WIDTH*2,canvas.height/4,this.CARD_WIDTH*4,canvas.height/2);
        

        //DRAW MOVING CARDS
        //TODO

    }

    /**
     * Method when you tap/click a point on the screen
     */
    click() {
        if(this.optionsWindow!=null) {
            this.optionsWindow.click();
            return;
        }
        this.cardScroller.click();
        
        //clciking the end turn button
        if(this.finishButton.isMouseOverThis() && game.yourTurn) {
            game.finishTurn();
        }
        //clicking on the undo button
        else if(this.undoButton.isMouseOverThis() && game.planningCards.length>0) {
            game.undo();
        }
        //clicking the undo all button
        else if(this.undoAllButton.isMouseOverThis() && game.planningCards.length>0) {
            for(let i = 0; i<game.planningCards.length;i++) {
                game.undo();
            }
        }
    }

    /**
     * When you drag the mouse/touch 
     */
    drag() {
        if(this.optionsWindow!=null) {
            this.optionsWindow.drag();
            return;
        }
        this.cardScroller.drag();
        
    }
    /**
     * Release the mouse/touch
     */
    release() {
        if(this.optionsWindow!=null) {
            this.optionsWindow.release();
            return;
        }
        this.cardScroller.release();
    }

    /** 
     * Mouse Wheel
     */
    wheel(amount) {
        if(this.optionsWindow!=null) {
            this.optionsWindow.wheel(amount);
            return;
        }
        this.cardScroller.setScrollSpeed(amount*0.7);
        //this.scrollSpeed = -amount * this.CARD_WIDTH;
    }

    /**
     * Scrolling 
     */
    scroll(dt) {
        if(this.optionsWindow!=null) return;

        this.cardScroller.scroll(dt);
    }

    /**
     * Is called when you make a decision in the options menu
     */
    exitOptions(card, pickedOption) {
        this.optionsWindow = null;

        if(this.playAll) {
            card.playAll(pickedOption);

        }else {
            card.playSingle(pickedOption);

        }
        //game.playCard(game.your[this.draggedCard].id,pickedOption);
        
        //this.draggedCard = -1;
        this.playAll = false;
    }

}
