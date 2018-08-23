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
app.garbageHand = [];


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
                app.dealtCards = res.cards;
                app.cardsForPile = app.dealtCards; // Creating new mutable property

                app.addToPile("user", 8);
                app.addToPile("computer", 8);
                app.addToPile("garbage", 1)
            });
        })
}


app.decidePile = function (pileName, hand){
    if (pileName === "user") {
        app.userHand = hand;
    } else if (pileName === "computer") {
        app.computerHand = hand;
    } else if (pileName === "garbage") {
        app.garbageHand.push(hand[0]);
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
    app.ajaxRequest(urlEnding);

    // Displaying the hand on screen
    app.displayHands(cardArray, `.${pileName}Hand`);

    // Saving value and suit of garbage pile top card
    app.decidePile(pileName, cardArray);

}

// Once player chooses card, remove from user pile/array, add to garbage pile/array

// Display data on the page

app.displayHands = function (dealtCards, hand) {
    dealtCards.forEach((card, i) => {
        const cardImageDiv = $("<div>")
            .addClass(`cardContainer card${i}`)
            // .css("transform", "rotate(45deg)")
            .attr({
                "data-value": card.value, 
                "data-suit": card.suit,
                "data-code": card.code});
        const cardImage = $("<img>").attr("src", card.image);
        cardImageDiv.append(cardImage);
        $(hand).append(cardImageDiv);
    });
    // Styling for hands
    app.handSpread();
}

// Collect user input
app.events = function () {
    app.userTurn();
}

app.userTurn = function () {
    $('.userHand').on('click', '.cardContainer', function () {
        const cardValue = $(this).attr("data-value");
        const cardSuit = $(this).attr("data-suit");
        const cardCode = $(this).attr("data-code");
        // app.garbageCardCheck();
        app.checkRules(cardValue, cardSuit, cardCode);
    })
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


app.checkRules = function(value, suit, code) {
    const currentGarbageIndex = app.garbageHand.length - 1;
    console.log(`current`, currentGarbageIndex);
    console.log(app.garbageHand);

    // Check user selection against garbage pile card - if suit is the same OR same value OR value = 8 
    if (value == app.garbageHand[currentGarbageIndex].value || 
        suit == app.garbageHand[currentGarbageIndex].suit ||
        value == 8 ) {
        console.log(`HELL YEA`);
        app.userHand.forEach((card) =>{
            if (card.code === code) {
                app.cardsForPile.push(card);
            }
        })
        app.addToPile("garbage", 1);
        // Once card has been added to garbage pile, need to remove the card from the players hand
    } 
    // console.log(value, suit);

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

app.handSpread = function (){
    let degrees = 0;
    let shiftX = 120;
    let shiftY = 0;
    for (let i = 0; i < 8; i++) {
        $(`.card${i}`)
            .css ({
                "transform": `rotate(${degrees}deg)`,
                "left": shiftX,
                "top": shiftY           
            });
        degrees += 8;
        shiftX += 10;
        shiftY += 10;
    }
}
