// 1. Get the api data using ajax
// 2. Get one deck of cards
// 3. Deal the cards to each player (2 players)
// 4. Display cards to user, hide computer's cards
// 5. Flip one card over in the pile
// 6. Randomize who gets to start first
// 7. Accept the user's choice of card to play
// 8. Check user choice against rules
// 9. Based on the rules of the game, computer will play one of its cards
// 10. Repeat 7-9 until either party has no more cards

// Create app namespace to hold all methods
const app = {};

// Variables
app.apiURL = "https://deckofcardsapi.com/api/deck/";
app.startOfGame = true;
app.garbageHand = [];
app.yourTurn = true;
app.legalMove = false;
app.userDrawCount = 0;


// Make AJAX request with user inputted data
app.ajaxRequest = function (urlEnding) {
    return $.ajax({
        url: app.apiURL + urlEnding,
        method: "Get",
        dataType: "JSON",
    });
}

// New Deck
app.newDeck = function () {
    const urlEnding = "new/shuffle/?deck_count=1";
    app.ajaxRequest(urlEnding).then((res) => {
        app.deckID = res.deck_id;
        app.dealCards(17); // Every Time a new deck is made 17 cards are dealt
    })
}

// Dealing Cards
app.dealCards = function (numberOfCards) {
    const urlEnding = `${app.deckID}/draw/?count=${numberOfCards}`;
    const promise = (app.ajaxRequest(urlEnding));

    promise.then((res) => {
        app.cardsForPile = res.cards; // Creating new mutable property

        if (app.startOfGame === true) {
            app.addToPile("user", 8);
            app.addToPile("computer", 8);
            app.addToPile("garbage", 1)
            app.startOfGame = false;
        } else if (app.yourTurn === true) {
            app.addToPile("user", numberOfCards);
            
        } else if (app.yourTurn === false) {
            app.addToPile("computer", numberOfCards);
        }
    });
}


// Add to pile
app.addToPile = function (pileName, numberOfCards) {
    // Following the below url format for adding to piles
    // https://deckofcardsapi.com/api/deck/<<deck_id>>/pile/<<pile_name>>/add/?cards=AS,2S

    // Declaring empty arrays to hold the card object and codes
    let cardArray = [];
    let cardCodes = []; // Array for url ending

    // Pushing the card object and card codes to array 
    // from first card up to the number of cards to be added to pile
    for (let i = 0; i < numberOfCards; i++) {
        cardArray.push(app.cardsForPile[i]);
        cardCodes.push(app.cardsForPile[i].code);
    }

    // Removing the cards which were added to pile from array
    app.cardsForPile.splice(0, numberOfCards);

    // Joining elements in the array to get desired format
    let cardsAdded = cardCodes.join(",");  // using "," as a separator

    // Putting it together to get desired url format
    const urlEnding = `${app.deckID}/pile/${pileName}/add/?cards=${cardsAdded}`;

    // Updating piles on api side
    app.ajaxRequest(urlEnding)

    // Saving value and suit of garbage pile top card
    app.decidePile(pileName, cardArray);
}

app.decidePile = function (pileName, hand) {
    // When its the user's turn the update user's hand
    if (pileName === "user") {
        // If its the start of the game make the user hand equal card array
        if (app.startOfGame === true) {
            app.userHand = hand;
        } else {
            app.userHand.push(hand[0]); // otherwise push the new card to existing array
        }
        app.displayHands(app.userHand, `.${pileName}Hand`);
    } else if (pileName === "computer") {
        if (app.startOfGame === true) {
            app.computerHand = hand;
        } else {
            app.computerHand.push(hand[0]);
        }
        app.displayHands(app.computerHand, `.${pileName}Hand`);
        app.yourTurn = true; // Changing back to user turn after computer has played
    } else if (pileName === "garbage") {
        app.garbageHand.push(hand[0]);
        app.displayHands(hand, `.${pileName}Hand`);
    }
}

// Once player chooses card, remove from user pile/array, add to garbage pile/array
app.removeFromPile = function (code) {
    if (app.yourTurn === true) {
        app.userHand = app.userHand.filter(card => card.code != code);
    } else {
        app.computerHand = app.computerHand.filter(card => card.code != code);
    }
    const cards = $(`.cardContainer[data-code="${code}"]`).remove();
}

// Display data on the page
app.displayHands = function (dealtCards, hand) {
    $(hand).empty()

    dealtCards.forEach((card, i) => {
        const cardImageDiv = $("<div>")
            .addClass(`cardContainer card${i}`)
            .attr({
                "data-value": card.value,
                "data-suit": card.suit,
                "data-code": card.code
            });
        const cardImage = $("<img>").attr("src", card.image);

        cardImageDiv.append(cardImage);
        $(hand).append(cardImageDiv);
    });
    // Styling for hands
    app.handSpread(dealtCards.length);
}

// Collect user input
app.events = function () {
    app.userTurn();
    app.drawCard();
}

app.userTurn = function () {
    app.legalMove = false;
    console.log(`My turn`);
    // Listing for click on card in user hand
    $('.userHand').on('click', '.cardContainer', function () {
        // Saving card value, suit, and code for checking rules
        const cardValue = $(this).attr("data-value");
        const cardSuit = $(this).attr("data-suit");
        const cardCode = $(this).attr("data-code");

        app.checkRules(cardValue, cardSuit, cardCode);
        // If user made a legal move then it's computer's turn
        if (app.legalMove === true) {
            // Reset legal move to false for computer
            app.legalMove = false;
            app.computerTurn();
        } 
    })
}

app.computerTurn = function () {
    app.yourTurn = false;
    
    // Resets the counter for number of cards the user has drawn
    app.userDrawCount = 0
    app.checkComputerHand();
    
    console.log(``);
    
    // If computer has no available moves then draw a card
    if (app.legalMove === false) {
        app.dealCards(1);
        console.log('Computer has no legal moves');
        console.log("no legal", app.yourTurn);
    }
    // app.yourTurn = true;
}

// Go through all cards in computer hand to check for available rules
app.checkComputerHand = function () {
    
    app.computerHand.forEach((card, i) => {
        const cardValue = card.value
        const cardSuit = card.suit
        const cardCode = card.code
        
        
        if (app.yourTurn === false) {
            app.checkRules(cardValue, cardSuit, cardCode);
        }
    });
}

app.drawCard = function () {
    // Only allow user to draw one card from deck each turn
    // Count number of times the user has drawn card in turn
    // Reset count when user turn ends

    $(".drawHand").on("click", function () {
        app.yourTurn = true;
        console.log('Draw Count', app.userDrawCount);
        console.log("draw card", app.yourTurn);
        
        if (app.userDrawCount === 0) {
            app.userDrawCount++;
            app.dealCards(1);
            // app.computerTurn();
        } else {
            console.log('You already drew a card, its the computer\'s turn now');
        }
        app.computerTurn();
        console.log(`draw card after computer turn initiated`, app.yourTurn);
    });
    
    
}


app.checkRules = function (value, suit, code) {
    const currentGarbageIndex = app.garbageHand.length - 1;
    const topGarbageCard = app.garbageHand[currentGarbageIndex];
    // app.rulesPickUp(currentGarbageIndex);
    // Check user selection against garbage pile card - if suit is the same OR same value OR value = 8 
    if (value == topGarbageCard.value ||
        suit == topGarbageCard.suit ||
        value == 8) {

        app.legalMove = true; // If condition met the move is legal

        // Searching user hand for chosen card and pushes to cardsForPile array
        if (app.yourTurn === true) {
            app.searchHand(app.userHand, code);
            app.yourTurn = false;
            // app.rulesPickUp(topGarbageCard);
        } else {
            app.searchHand(app.computerHand, code);
            app.yourTurn = true;
            console.log(`after searchhand`, app.yourTurn);
            
        }
    }
}

app.searchHand = function (hand, code) {    

    hand.forEach((card) => {
        if (card.code === code) {
            app.cardsForPile.push(card);
        }
    })
    // Once card has been added to garbage pile, need to remove the card from the players hand
    app.removeFromPile(code, hand);
    app.addToPile("garbage", 1);
}

app.startGame = function () {
    app.newDeck();


}

// Start app
app.init = function () {
    app.startButton();
    // app.startGame(); Moved to Start Button Screen
    app.events();
    app.overlayVisible();
    app.endOfGame();
}

$(function () {
    app.init();
});


//Styling + Animations + Events

// Start Screen

app.startButton = function (){
    $(".startButton").on("click", function(){
        $(".startscreen").toggleClass("visible");
        app.startGame();
    });
}

// Angle + spread of each players hands
app.handSpread = function (numberOfCards) {
    let degrees = 0;
    let shiftX = 120;
    let shiftY = 0;
    for (let i = 0; i < numberOfCards; i++) {
        $(`.card${i}`)
            .css({
                "transform": `rotate(${degrees}deg)`,
                "left": shiftX,
                "top": shiftY
            });
        degrees += 8;
        shiftX += 10;
        shiftY += 10;
    }
}

// Overlay Specific Pieces

app.overlayVisible = function (){
    app.rulesOverlay();
    app.specialCardsOverlay();
    app.restartOverlay();
}

app.rulesOverlay = function () {
    $(".rules").on("click", function () {
        $(".rulesOfTheGame").toggleClass("visible");
    });
}

app.specialCardsOverlay = function () {
    $(".specialCards").on("click", function () {
        $(".specialCardsOverlay").toggleClass("visible");
    });
}


// Restart Section 

app.restartOverlay = function () {
    $(".restart").on("click", function () {
        $(".restartGameOverlay").toggleClass("visible");
    });
}

// restart No
$(".restartNo").on("click", function () {
    $(".restartGameOverlay").toggleClass("visible");
});

// restart Yes
$(".restartYes").on("click", function () {
    app.newDeck();
    $(".restartGameOverlay").toggleClass("visible");
});

// End of Game Stylings

app.endOfGame = function () {
    if (userHand.length == 0) {
        console.log(`You win`);
        
        $(".endScreen").toggleClass("visible");
    } else if (computerHand.length === 0) {
        $(".endScreen").toggleClass("visible");
        console.log(`you lose`);
        
    }
}

app.endButton = function () {
    $(".endButton").on("click", function () {
        $(".endScreen").toggleClass("visible");
        app.startGame();
    });
}

// app.restart = function () {
//     $(".restart").on("click", function () {
//         $(".rulesOfTheGame").addClass('visible');
//     });
// }

// for user

// if (card.code === 8) {
//     $(".suitchoice").toggleClass("visible");
//     $(".suitPick").on('click', function(){
//         //top card of the discard pile would change to that suit
//     });
// }

// for computer 
// if (card.code === 8) {
//     // append new html with all the stylings to play that card
//     // change it so the user only has to match the suit of the randomly assigned suit 
// }

app.rulesPickUp = function (topGarbageCard) {

    if (app.garbageHand[topGarbageCard].value == 2) {
        // app.yourTurn = false;
        // if (app.yourTurn === true) {
            
        // } else {
            
        // }
        app.dealCards(2);

        console.log(app.yourTurn);

        console.log('2 is played');
    }

        // in the event that other 2's were previously played, accumulate their value
        // if (app.garbageHand[currentGarbageIndex - 3].value === 3) {
        //     app.dealCards(8);
        // } else if (app.garbageHand[currentGarbageIndex - 2].value === 2 &&
        //     app.garbageHand.length >= 2) {
        //     app.dealCards(6);
        // } else if (app.garbageHand[currentGarbageIndex - 1].value === 1) {
        //     app.dealCards(4);
        // }

    // app.rulesQueen(currentGarbageIndex);
    // app.rulesJack(currentGarbageIndex);
}

app.rulesQueen = function (currentGarbageIndex) {
    if (app.garbageHand[currentGarbageIndex].value === "QUEEN" && app.garbageHand[currentGarbageIndex].suit === "SPADES") {
        app.dealCards(5);
        console.log(`queen is played`);
    }
}

app.rulesJack = function (currentGarbageIndex) {
    if (app.garbageHand[currentGarbageIndex].value === "JACK") {
        console.log(`Jack is played`);

        if (app.yourTurn === true) {
            app.yourTurn = false;
        } else {
            app.yourTurn = true;
        }
    }
}