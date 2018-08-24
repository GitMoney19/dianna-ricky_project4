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
app.promise = [];
app.startOfGame = true;
app.garbageHand = [];
app.yourTurn = true;
app.legalMove = false;


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
    app.promise.push(app.ajaxRequest(urlEnding));
}

// Dealing Cards
app.dealCards = function (numberOfCards) {
    $.when(...app.promise)
        .then((res) => {
            app.deckID = res.deck_id

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
                    console.log('dealcards', app.yourTurn);
                    
                    app.addToPile("user", numberOfCards);
                } else if (app.yourTurn === false) {
                    app.addToPile("computer", numberOfCards);
                }
            });
        })
}


app.decidePile = function (pileName, hand) {
    if (pileName === "user") {
        if (app.startOfGame === true) {
            app.userHand = hand;
        } else {
            app.userHand.push(hand[0]);
        }
        app.displayHands(app.userHand, `.${pileName}Hand`);
    } else if (pileName === "computer") {
        if (app.startOfGame === true) {
            app.computerHand = hand;
        } else {
            app.computerHand.push(hand[0]);
        }
        console.log('computer:yourTurn:', app.yourTurn);
        
        app.displayHands(app.computerHand, `.${pileName}Hand`);
    } else if (pileName === "garbage") {
        app.garbageHand.push(hand[0]);
        app.displayHands(hand, `.${pileName}Hand`);
    }
}

// Add to pile
app.addToPile = function (pileName, numberOfCards) {
    // Following the below url format for adding to piles
    // https://deckofcardsapi.com/api/deck/<<deck_id>>/pile/<<pile_name>>/add/?cards=AS,2S

    // Declaring empty arrays to hold the card object and codes
    let cardArray = [];
    let cardCodes = [];

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
    // .then((response) => {
    //     console.log(response);
    // });

    // Saving value and suit of garbage pile top card
    app.decidePile(pileName, cardArray);
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
    console.log(hand, app.computerHand);
    
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

    $('.userHand').on('click', '.cardContainer', function () {
        const cardValue = $(this).attr("data-value");
        const cardSuit = $(this).attr("data-suit");
        const cardCode = $(this).attr("data-code");
        app.checkRules(cardValue, cardSuit, cardCode);
        if (app.legalMove === true) {
            app.computerTurn();
        }
    })

}

app.computerTurn = function () {

    app.legalMove = false;

    // If computer has no available moves then draw a card
    for (let i = 0; i < app.computerHand.length; i++) {
        const cardValue = app.computerHand[i].value
        const cardSuit = app.computerHand[i].suit
        const cardCode = app.computerHand[i].code

        if (app.yourTurn === false) {
            app.checkRules(cardValue, cardSuit, cardCode);
            // break;
        }
    }

    if (app.legalMove === false) {
        app.yourTurn = false;
        app.dealCards(1);
        console.log('No legal moves');
    }

    // app.yourTurn = true;
    // app.computerHand.forEach((card, i) => {
    //     const cardValue = card.value
    //     const cardSuit = card.suit
    //     const cardCode = card.code

    //     if (app.yourTurn === false) {
    //         app.checkRules(cardValue, cardSuit, cardCode);
    //     }
    // });
}

app.drawCard = function () {
    $(".drawHand").on("click", function () {
        console.log('Draw');
        app.dealCards(1);
    });
}

// Computer turn comes after player selects a card
// Event listener for new card added to garbage pile OR add a "turn" boolean variable that will turn on and off between user/computer
// Based on the value/suit of the card in the garbage pile, computer will take action (Jack - skip its turn, pick up 2, pick up 5) OR play a 2 or QS to counter the pickup
// if garbage pile card is not special, randomly choose a card that matches in value or suit
// app.garbageCardCheck = function(value, suit, code) {
//     if (app.garbageHand[currentGarbageIndex].value == "JACK") {
//         console.log('skip a turn');
//         // display skip a turn
//         // next player's turn
//     } 
//     // else if {
//     //     (app.garbageHand[currentGarbageIndex].value == 2) {}
//     // }
// }


app.checkRules = function (value, suit, code) {
    const currentGarbageIndex = app.garbageHand.length - 1;
    // Check user selection against garbage pile card - if suit is the same OR same value OR value = 8 
    if (value == app.garbageHand[currentGarbageIndex].value ||
        suit == app.garbageHand[currentGarbageIndex].suit ||
        value == 8) {
            app.legalMove = true;

        // Searching user hand for chosen card and pushes to cardsForPile array
        if (app.yourTurn === true) {
            app.userHand.forEach((card) => {
                if (card.code === code) {
                    app.cardsForPile.push(card);
                }
            })
            app.removeFromPile(code);
            app.addToPile("garbage", 1);
            app.yourTurn = false;
        } else {
            app.computerHand.forEach((card) => {
                if (card.code === code) {
                    app.cardsForPile.push(card);
                }
            })
            app.removeFromPile(code);
            app.addToPile("garbage", 1);
            app.yourTurn = true;
        }
        // Once card has been added to garbage pile, need to remove the card from the players hand
    }
    // Jack skips next players turn
}


app.startGame = function () {
    app.newDeck();
    app.dealCards(17);
}

// Start app
app.init = function () {
    app.startGame();
    app.events();
}

$(function () {
    app.init();
});


//Styling + Animations
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

app.rulesPickUp = function (currentGarbageIndex) {
    console.log('rules pickup', app.garbageHand[currentGarbageIndex].value);
    if (app.garbageHand[currentGarbageIndex].value === 2) {
        app.dealCards(2);
        
        // in the event that other 2's were previously played, accumulate their value
        if (app.garbageHand[currentGarbageIndex - 3].value === 3) {
            app.dealCards(8);
        } else if (app.garbageHand[currentGarbageIndex - 2].value === 2) {
            app.dealCards(6);
        } else if (app.garbageHand[currentGarbageIndex - 1].value === 1) {
            app.dealCards(4);
        } 
    }
    app.rulesQueen(currentGarbageIndex);
    app.rulesJack(currentGarbageIndex);
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