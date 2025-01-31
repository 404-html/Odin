function getLines(text, maxWidth) {
    let words = text.split(" ");
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        let word = words[i];
        let width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

class DescriptionWindow {
    constructor(cardStack) {
        this.image = cardStack.image;
        this.card = cardStack.card;
        this.cardStack = cardStack;
        this.allowedToPlay = cardStack.allowedToPlay;

        this.exitButton = new Button(CARD_WIDTH-1, 3, 1.5, "EXIT");
        this.exitButton.x = function() {
            return canvas.width/2 + (CARD_WIDTH+1) * GUI_SCALE;
        }
        this.exitButton.y = function() {
            return canvas.height/2 - (0.5*CARD_HEIGHT-2) * GUI_SCALE;
        }

        this.addButton = new Button(CARD_WIDTH-1, 3, 1.5, "ADD");
        this.addButton.x = function() {
            return canvas.width/2 + (CARD_WIDTH+1) * GUI_SCALE;
        }
        this.addButton.y = function() {
            return canvas.height/2 - (0.5*CARD_HEIGHT-6) * GUI_SCALE;
        }

        this.addallButton = new Button(CARD_WIDTH-1, 3, 1.5, "ADD ALL");
        this.addallButton.x = function() {
            return canvas.width/2 + (CARD_WIDTH+1) * GUI_SCALE;
        }
        this.addallButton.y = function() {
            return canvas.height/2 - (0.5*CARD_HEIGHT-10) * GUI_SCALE;
        }
    }

    getWidth() {
        return (CARD_WIDTH * 4 + 3) * GUI_SCALE;
    }
    getHeight() {
        return CARD_HEIGHT * 3 * GUI_SCALE;
    }
    getX() {
        return canvas.width/2 - this.getWidth()/2;
    }
    getY() {
        return canvas.height/2 - this.getHeight()/2;
    }

    draw() {
        let width = this.getWidth();
        let height = this.getHeight();
        let x = this.getX();
        let y = this.getY();

        let cardWidth = GUI_SCALE*CARD_WIDTH;
        let cardHeight = GUI_SCALE*CARD_HEIGHT;

        //draw the window
        ctx.strokeStyle = "#000";
        ctx.lineWidth = GUI_SCALE/2;
        ctx.strokeRect(x+3,y+3,width,height);
        ctx.fillStyle = "#0d3a0d";
        ctx.fillRect(x,y,width,height);
        ctx.strokeStyle = "#fff";
        ctx.strokeRect(x,y,width,height);

        //draw card
        ctx.drawImage(this.image,x+width-GUI_SCALE-cardWidth,y+GUI_SCALE,cardWidth,cardHeight);
        this.exitButton.drawThis(true);
        this.addButton.drawThis(this.allowedToPlay);
        this.addallButton.drawThis(this.allowedToPlay);
        
        let descWidth = 3*CARD_WIDTH*GUI_SCALE;
        
        //draw title
        drawText(this.card.name,x+GUI_SCALE+descWidth/2,y+GUI_SCALE*3,"center",GUI_SCALE*2,descWidth,true);
        drawText("Effects",x+GUI_SCALE,y+GUI_SCALE*6,"left",GUI_SCALE*1.5,descWidth,true);
        drawText("Compatibility",x+GUI_SCALE,y+GUI_SCALE*15,"left",GUI_SCALE*1.5,descWidth,true);

        //draw a description
        ctx.fillStyle = "#fff";
        ctx.textAlign = "left";
        ctx.font = "bold " + Math.round(GUI_SCALE) + "px Arial";
        let effectLines = getLines(this.card.effectDescription,descWidth);
        y += GUI_SCALE*8;
        for(let line of effectLines) {
            ctx.fillText(line,x+GUI_SCALE,y);
            y+=GUI_SCALE;
        }

        y = this.getY() + GUI_SCALE * 17;
        let compatibilityLines = getLines(this.card.compatibilityDescription,descWidth);
        for(let line of compatibilityLines) {
            ctx.fillText(line,x+GUI_SCALE,y);
            y+=GUI_SCALE;
        }

    }

    

    click() {
        //exit
        if(this.exitButton.isMouseOverThis() || mousePosition.x < this.getX() || mousePosition.x > this.getX()+this.getWidth() || mousePosition.y < this.getY() || mousePosition.y > this.getY()+this.getHeight()) {
            gui.popup = null;
        }
        //add
        else if(this.addButton.isMouseOverThis()) {
            gui.play(this.cardStack);
        }
        //add all
        else if(this.addallButton.isMouseOverThis()) {
            gui.playAllCards(this.cardStack);
        }
    }

    drag() {}
    
    release() {}
    wheel(amount) {}
    scroll(dt) {}
}


/**
 * Option in an option window
 */
class OptionItem {
    constructor(optionId, optionString) {
        //this.card = card;
        this.optionId = optionId;
        this.button = new Button(CARD_WIDTH*3-0.5,4.5,2,optionString);
    }

    draw(x,y,allowClick) {
        this.button.draw(x+GUI_SCALE*0.25,y+GUI_SCALE*0.25,allowClick);
    }

    click(x,y) {
        //gui.pickOption(this.card, this.optionId);
        game.pickOption(this.optionId);
        gui.popup = null;
        game.finishedEvent();
    }

}

/**
 * Class for the options window
 */
class OptionWindow {
    constructor(option) {
        //this.card = card;
        //this.image = card.image;
        this.optionTitle = option["title"].split("\n");
        this.optionType = option["type"];
        this.allowCancel = option["allow cancel"];
        this.image = game.allImages[option["image"]];

        //Create the scroll container
        this.scrollContainer = new Container();
        this.scrollContainer.window = this;
        this.scrollContainer.getLeft = function() {
            return this.window.getX() + GUI_SCALE*2;
        }
        this.scrollContainer.getRight = function() {
            return canvas.width - this.window.getX();
        }
        this.scrollContainer.getTop = function() {
            return this.window.getY() + GUI_SCALE * 11;
        }
        this.scrollContainer.getBottom = function() {
            return this.window.getY() + this.window.getHeight() - GUI_SCALE*5.5;
        }

        //Create the scroller
        this.optionsScroller = new ScrollArea(this.scrollContainer,CARD_WIDTH*3,5,3,1);
        this.optionsScroller.scrollOffset = 0;
        let items = [];
        for(let optionId of Object.keys(option["options"])) {
            items.push(new OptionItem(optionId, option["options"][optionId]));
        }
        this.optionsScroller.setItems(items);

        //create a cancel button
        if(this.allowCancel) {
            this.cancelButton = new Button(CARD_WIDTH,3,1.5,"CANCEL");
            this.cancelButton.window = this;
            this.cancelButton.x = function() {
                return this.window.getX() + this.window.getWidth() - GUI_SCALE * (1+CARD_WIDTH);
            }
            this.cancelButton.y = function() {
                return this.window.getY() + (CARD_HEIGHT+2) * GUI_SCALE;
            }
        }
    }
    getWidth() {
        return (4 * CARD_WIDTH + 7) * GUI_SCALE;
    }

    getX() {
        return (canvas.width-this.getWidth())/2;
    }

    getY() {
        return canvas.height/8;
    }

    getHeight() {
        return canvas.height * 0.75;
    }

    /**
     * Draw the options window with specified dimensions
     */
    draw() {
        let width = this.getWidth();
        let height = this.getHeight();
        let x = this.getX();
        let y = this.getY();

        let fontSize = GUI_SCALE*2;
        let cardWidth = GUI_SCALE*CARD_WIDTH;
        let cardHeight = GUI_SCALE*CARD_HEIGHT;

        //draw the options window
        ctx.strokeStyle = "#000";
        ctx.lineWidth = GUI_SCALE/2;
        ctx.strokeRect(x+3,y+3,width,height);
        ctx.fillStyle = "#0d3a0d";
        ctx.fillRect(x,y,width,height);

        //draw card
        ctx.drawImage(this.image,x+width-GUI_SCALE-cardWidth,y+GUI_SCALE,cardWidth,cardHeight);
        if(this.allowCancel) {
            this.cancelButton.drawThis(true);
        }
        
        ctx.strokeStyle = "#fff";
        ctx.fillStyle = "#222";
        ctx.fillRect(this.scrollContainer.getLeft(),this.scrollContainer.getTop(),GUI_SCALE*CARD_WIDTH*3,this.scrollContainer.getHeight());
        
        //draw options box
        this.optionsScroller.draw();

        ctx.fillStyle = "#0d3a0d";
        ctx.strokeStyle = "#fff";
        ctx.fillRect(x+GUI_SCALE*2-1,y+GUI_SCALE*6-1,GUI_SCALE*CARD_WIDTH*3+2,GUI_SCALE*5+2);
        ctx.fillRect(x+GUI_SCALE*2-1,y+height-GUI_SCALE*5.5-1,GUI_SCALE*CARD_WIDTH*3+2,GUI_SCALE*5+2);
        
        ctx.lineWidth = GUI_SCALE/2;
        ctx.strokeStyle = "#fff";
        ctx.strokeRect(x,y,width,height);

        //draw text
        let textY = y + GUI_SCALE * 7.5;
        let gap = 3 * GUI_SCALE;
        textY -= gap * this.optionTitle.length/2;
        for(let optionTitle of this.optionTitle) {
            drawText(optionTitle, x + GUI_SCALE*(CARD_WIDTH*1.5+2), textY, "center", GUI_SCALE*2.5, GUI_SCALE*CARD_WIDTH*3);
            textY+=gap;
        }
    }

    click() {
        this.optionsScroller.click();
        if(this.allowCancel) {
            if(this.cancelButton.isMouseOverThis() || mousePosition.x < this.getX() || mousePosition.x > this.getX()+this.getWidth() || mousePosition.y < this.getY() || mousePosition.y > this.getY()+this.getHeight()) {
                game.pickOption(null);
                gui.popup = null;
                game.finishedEvent();
            }
        }
    }

    drag() {
        this.optionsScroller.drag();

    }
    
    release() {
        this.optionsScroller.release(true);
    }
    wheel(amount) {
        this.optionsScroller.setScrollSpeed(amount*0.07);
    }
    scroll(dt) {
        if(this.optionsScroller.scrollSpeed != 0) gui.shouldDraw = true;
        this.optionsScroller.scroll(dt);
    }
}