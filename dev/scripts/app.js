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


// Collect user input
app.collectInfo = function () {

}


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
            });
        })
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
    app.cardsForPile.splice(0, 8);

    // Joining elements in the array to get desired format
    let cardsAdded = cardCodes.join(",");  // using "," as a separator

    // Putting it together to get desired url format
    const urlEnding = `${app.deckID}/pile/${pileName}/add/?cards=${cardsAdded}`;

    // Updating piles on api side
    app.ajaxRequest(urlEnding);

    // Displaying the hand on screen
    app.displayInfo(cardArray, `.${pileName}Hand`);
}

// Display data on the page
app.displayInfo = function (dealtCards, hand) {
    dealtCards.forEach((card) => {
        const cardImage = $("<img>").attr("src", card.image);
        $(hand).append(cardImage);
    });
}

// Start app
app.init = function () {
    app.newDeck();
    app.dealCards(16);
}

$(function () {
    app.init();
});