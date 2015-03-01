(function(){ // The bookmarklet is an anonymous function that calls itself immediately after being defined.
  var token = $.cookie('token'); // We need the token to make the later PUT and POST requests—
                                 // if this was just GET requests we wouldn't need them. (Since we're already on the board.)
 
  var parts = /\/c\/([^/]+)/.exec(document.location); // regex to look for the card name (since it comes after /c/ in the URL; this pulls from the DOM)
 
  if(!parts) { // If there is no card name (because no card is open), the bookmarklet should throw an alert.
    alert("No card is open.") // This is the alert.
    return; // Finishing that out—if that happens, we're done and don't run the rest of everything else.
  } // End of the if statement that checks for what we're doing.
  var idCard = parts[1]; // We're making a variable called idCard. It's equal to the ID we pulled from the DOM. It's the second item in the parts array, becasue the first is the entire string that the regex matched. The second is the capture group secified above using the ([^/]+) .
  $.get("/1/cards/" + idCard, { fields: "idList", checklists: "all" }) // Make the GET request to Trello's API, and pull the list ID and checklists in that list, based on the card ID.
  .success(function(json){ // Return the JSON-encoded data. More info: http://api.jquery.com/jquery.getjson/
    var idList = json.idList; // idList, which we'll use later, is the same as the JSON-encoded idList parameter we get back from the API.
    var checklists = json.checklists; // checklists, which we'll use later, is the same as the JSON-encoded checklists parameter that we get back from the API.
 
    var checkItems = []; // Set up an array to put the checklist items in.
    
    _.sortBy(checklists, 'pos').forEach(function(checklist){ // Sort the checklists by their postition. pos is a thing the API knows, and allows us to maintain the same order (which matters because the user can rearrange them and wants to maintain that order).
      var idChecklist = checklist.id; // We need to know the ID of the checklist. We're getting it.
      checklist.checkItems.forEach(function(checkItem){ // For each item in the checklist, cycle through.
        checkItems.push({ // Push the following to the array.
          idChecklist: idChecklist, // Get the idChecklist
          name: checkItem.name, // Get the name.
          id: checkItem.id // Get the id number.
        })
      })
    })
 
    var createNextCard = function() { // Now that we have the checklist item info, let's start making new cards.
      if(checkItems.length == 0) { // If there aren't any checklist items
        return; // , then we're done. This is useful if there's an empty checklist on the card.
      } // It's also how the function knows to stop, rather than recurse forever, since the next line removes items from the array. 
       // When the array is empty and it hits this return; it stops running.
      var checkItem = checkItems.shift(); // This takes the checklist item that we pull, and moves it out of the array. Prevents infinite recursion later.
      
      // Do something with the checkitem
      $.post("/1/card", { // Make the POST to Trello's API in order to make the new card. The following are all parameters of the API call.
        token: token, // We need a token for a POST—we're giving it to the API.
        idList: idList, // We need a list to put the card on. We're putting it on the list we're already working with.
        name: checkItem.name, // We need a name. The name of the new card will be the same as the name of the old checklist item.
        pos: 'bottom' // Each new card goes to the bottom of the list.
      })
      .success(function(response){ 
        $.ajax({ // We're using AJAX, because jQuery doesn't have a built-in PUT method and we need to make a PUT request now.
          method: 'put', // This is a PUT request.
          url: '/1/cards/' + idCard + '/checklist/' + checkItem.idChecklist + '/checkItem/' + checkItem.id, // We're putting info on the card, on the checklist, on the checklist item—we're replacing the checklist item we just worked with. We're construction the request manually, where we used jQuery to do this in the POST request above.
          data: { // And here's what we're going to put in the request.
            name: response.url, // The checklist item's new name is the URL that we just got back when we made our card—we're replacing the old checklist item with a link to the card we made.
            token: token // Need the token to make a PUT request.
          }
        })
        createNextCard(); // This allows us to use recursion in the function. checkItems.shift() above stops us from recursing infinitely. 
      })
 
    }
 
    createNextCard(); // Calling the function. It runs until it's empty, and then stops.
 
  })
})();