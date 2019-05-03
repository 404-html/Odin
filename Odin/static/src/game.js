class Player {
    constructor(name, nCards, nPickup) {
        this.name = name;
        this.nCards = nCards;
        this.nPickup = nPickup;
    }
}

class GameEvent {
    constructor(run) {
        this.run = run;
    }
}

/**
 * A stack of cards in your hand
 */
class CardStack {
    constructor(id, name, url, allowedToPlay) {
        this.allowedToPlay = allowedToPlay;
        this.url = url;
        this.name = name;
        this.card = game.allCards[name];
        this.image = game.allImages[url];

        if(id != undefined) {
            this.cardIds = [id];
        }
        else {
            this.cardIds = [];
        }
    }

    addCard(id) {
        this.cardIds.push(id);
    }

    playAll() {
        if(this.cardIds.length == 0) return;
        let card_array = [];
        for(let id of this.cardIds) {
            card_array.push(id);
        }
        game.playCard(card_array);
    }

    playSingle() {
        if(this.cardIds.length == 0) return;
        let id = this.cardIds[0];
        game.playCard([id]);
    }

    pop() {
        this.cardIds.splice(0, 1);
    }

    size() {
        return this.cardIds.length;
    }
}

/**
 * Represents a card type. Has a name, image and some info to be used for its description
 */
class Card {
    constructor(card, image) {
        this.name = card["name"];
        this.colour = card["colour"];
        this.type = card["type"];
        this.compatiblePickup = card["can be on pickup"];
        this.compatibilityDescription = card["compatibility description"];
        this.effectDescription = card["effect description"];
        this.image = image;
    }
}

/**
 * Class representing all the current game objects
 */
class Game {
    constructor() {
        this.yourStacks = [];
        this.cardNameIndices = {};
        this.cardIndices = {};
        this.topCards = [];
        this.planningCards = [];
        this.yourTurn = false;
        this.direction = 1;
        this.yourId = 0;
        this.players = [];
        this.pickupAmount = 0;
        this.turn = 0;
        this.turnsLeft = 1;
        this.skip = 0;
        this.turnString = "";
        this.cantPlayReason = null;  // is null if you are allowed to have your turn with the cards you have played
        this.events = [];

        //build a list of all cards - use the url as the key
        this.allImages = [];
        for(let url of ALL_URLS) {
            this.allImages[url] = new Image;
            this.allImages[url].src = url;
        }
        this.allCards = [];
        for(let card of ALL_CARDS) {
            this.allCards[card["name"]] = new Card(card, this.allImages[card["url"]]); 
        }
    }

    /**
     * Add a new event to the queue, if the queue is empty, run the event.
     */
    addEvent(event) {
        this.events.push(event);
        if(this.events.length == 1) {
            event.run();
        }
    }

    /**
     * Finish the current event in the queue and move onto the next one if it exists
     */
    finishedEvent() {
        if(this.events.length == 0) return;

        this.events.splice(0, 1);

        if(this.events.length > 0) {
            this.events[0].run();
        }
    }

    createCardStack(id, name, url, canPlay, cardStackPanels) {
        let cardStack = new CardStack(id, name, url, canPlay);
        this.yourStacks.push(cardStack);
        if (id!=undefined) {
            this.cardIndices[id] = this.yourStacks.length - 1;
        }
        this.cardNameIndices[name] = this.yourStacks.length - 1;
        cardStackPanels.push(new CardStackPanel(cardStack));

        return cardStack;
    }

    update(update) {

        this.yourStacks.length = 0;
        this.cardIndices = {};
        this.cardNameIndices = {};
        let canPlay = 0;

        let cardStackPanels = [];

        let lastStack = null;
        //update the cards in your hand
        for(let card of update['your cards']) {
            if(card['can be played']) canPlay++;
            if(lastStack != null) {
                if(lastStack.name == card['name']) {
                    lastStack.addCard(card['card id']);
                    this.cardIndices[card['card id']] = this.yourStacks.length - 1;
                    continue;
                }
            }
            lastStack = this.createCardStack(card['card id'], card['name'], 
                    card['card image url'], card['can be played'], cardStackPanels);
        }
        gui.updateCards(cardStackPanels);

        //update cards at the top
        this.topCards.length = 0;
        for(let card of update['cards on deck']) {
            this.topCards.push(this.allImages[card['card image url']]);
        }
        //update planning cards
        this.planningCards.length = 0;
        for(let card of update['planning pile']) {
            this.planningCards.push(new CardStack(card['card id'], card['name'], card['card image url'], true));
        }

        //update pickup
        this.pickupAmount = update['pickup size'];

        //update direction
        this.direction = update['direction'];

        //can't play reason
        this.cantPlayReason = update['cant play reason'];
        
    
        //update players
        this.players.length = 0;
        for(let player of update['players']) {
            if(player['is you']) {
                this.yourId = this.players.length;
            }
            if(player['is turn']) {
                this.turn = this.players.length;
                this.turnsLeft = player['turns left'];
                if(player['is you']) {
                    this.turnString = "Your Turn! Cards Avaliable: " + canPlay + "/" + player['number of cards'];
                    this.yourTurn = true;
                }else {
                    this.turnString = player['name'] + "'s Turn";
                    this.yourTurn = false;
                }
            }
            this.players.push(new Player(player['name'],player['number of cards'],player['pickup amount']));
        }

        
        this.skip = (update['iteration']-1) % this.players.length; //tells you how many players will be skipped

        this.finishedEvent();
    }

    animate(data) {
        switch(data["type"]) {
        // ADD CARDS TO PLANNING PILE
        case "play cards":
            this.addEvent(new GameEvent(function() {
                    gui.animatePlayCards(data["cards"]);
                }));
            break;
        // UNDO
        case "undo":
            this.addEvent(new GameEvent(function() {
                gui.animateUndo();
            }));
            break;
        // UNDO ALL
        case "undo all":
            this.addEvent(new GameEvent(function() {
                gui.animateUndoAll();
            }));
            break;
        // PICKUP
        case "pickup":
            if(data["from"] == null) {
                this.addEvent(new GameEvent(function() {
                    gui.animatePickup(data["cards"]);  // pickup cards from deck
                }));
            }
            break;
        // REMOVE CARD
        case "remove cards":
            this.addEvent(new GameEvent(function() {
                gui.animateRemoveCards(data["cards"]);
            }));
            break;
        //COMMUNIST CARD
        case "communist":
            this.addEvent(new GameEvent(function() {
                gui.currentAnimation = new CommunistAnimation(data["cards"]);
            }));
            break;
        //THANOS
        case "thanos":
            this.addEvent(new GameEvent(function() {
                gui.currentAnimation = new ThanosAnimation(data["cards"]);
            }));
            break;
        //THANOS
        case "genocide":
            this.addEvent(new GameEvent(function() {
                gui.currentAnimation = new GenocideAnimation(data["cards"], data['banned']);
            }));
            break;
        //SOUND EFFECT - FOR THINGS LIKE 69 NICE
        case "sound":
            let audio = new Audio(data["sound"]);
            audio.play();
            break;
        }
    }

    playCard(card_array){
        // leave picked_option as null unless needed
        socket.emit("game message", GAME_ID, "play cards", card_array);
    }

    ask(question) {
        this.addEvent(new GameEvent(function() {
            gui.popup = new QuestionWindow(question);
        }));

    }

    pickOption(optionId) {
        socket.emit("game message", GAME_ID, "answer", [optionId]);
    }

    /*sayUno(){
        socket.emit("game message", GAME_ID, "uno", null);
    }*/

    undo() {
        socket.emit("game message", GAME_ID, "undo", null);
    }

    undoAll() {
        socket.emit("game message", GAME_ID, "undo all", null);
    }

    pickup(){
        socket.emit("game message", GAME_ID, "pickup", null);
    }

    finishTurn(){
        // not currently working!
        socket.emit("game message", GAME_ID, "finished turn", null);
    }
}
