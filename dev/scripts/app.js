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

app.newDeck = function() {
    const urlEnding = "new/shuffle/?deck_count=1";
    app.promise.push(app.ajaxRequest(urlEnding));
}

// Dealing Cards

app.dealCards = function (numberOfCards){
    $.when(...app.promise)
        .then((res) => {
            app.deckID = res.deck_id 
            const urlEnding = `${app.deckID}/draw/?count=${numberOfCards}`;          
            const promise = (app.ajaxRequest(urlEnding));          
            promise.then((res) => {
                app.playerOneHand = res.cards  
                app.displayInfo();       
            });
        })   
}


// Display data on the page
app.displayInfo = function () {
    app.playerOneHand.forEach((card)=>{
        const cardImage = $("<img>").attr("src", card.image);
        $('.userHand').append(cardImage);
    });
}

// Start app
app.init = function () {
    // app.getInfo();
    app.newDeck();
    app.dealCards(8);
}

$(function () {
    app.init();
});