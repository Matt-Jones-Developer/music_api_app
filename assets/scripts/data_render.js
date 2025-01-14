// an initial build development from initial testing scripts
// will be split into data.js render.js and main.js 

// search elements
const searchBtn = document.querySelector(".search-button")
const userSearch = document.querySelector("#search-input")

// modal access?
const errorModalEl = document.querySelector('#errorModalEl')

// render elements
const gridContainer = document.querySelector("#grid-container")

// array to store history
let searchHistory = []
console.log("history array is empty:", searchHistory)

// genreList - exclude 'funk' to allow for Funkadelic, 
// punk for daft punk etc
const genreList = [
  'pop', 'rock', 'country', 'reggae', 'house', 'dubstep', 'disco', 'classical',
  'folk', 'ska', 'dance', 'dub', 'trip hop', 'hip hop', 'hiphop', 'rap',
  'instrumental', 'electronica', 'jive', 'grime', 'zeezy'
]

// on-load handler 
// display artist data in card format
window.onload = function () {
  // define currently stored and get
  let storedArtistObject = localStorage.getItem("artistObject");
  // define parsed
  let parsedArtistObject = storedArtistObject ? JSON.parse(storedArtistObject) : [];
  // render the saved cards
  renderSavedCards(parsedArtistObject);
};

// [TODO: BUG] unknown name error - type dj scotch for example
// event listener
searchBtn.addEventListener("click", function (event) {
  event.preventDefault()

  // define the search request
  const searchRequest = userSearch.value
  console.log("user searched for:", searchRequest)

  // if user clicks button without entering an artist
  // if this was put within the fetchData section - you could catch the console error as before!
  if (searchRequest === '' || !isNaN(searchRequest)) {
    // log error
    console.log('user entered garbage, error passed.')
    // call modal from here
    errorModal()
    return;
  }

  // genre not allowed catch
  if (genreList.some(x => searchRequest.includes(x))) {
    // There's at least one
    // log error
    console.log('user entered a genre, error passed.')
    // call modal from here
    genreModal()
    return;
  }

  // check if value is in the array
  if (searchHistory.includes(searchRequest)) {
    console.log('value already in the array')
    // call dupeModal
    dupeModal()
    return;

  } else {

    // push item to array - it's not in the array, so add it 
    searchHistory.push(searchRequest)
    console.log("new search item added to array: ", searchHistory)
    // save to local 
    localStorage.setItem('savedArtists', JSON.stringify(searchHistory));

    // fetch request (to await and then call app functions)
    fetchData(searchRequest).then(data => {
      // console log the data
      console.log("fetchData call: ", data) // now defined!

      // getArtist() or similar
      getArtist(data, searchRequest)

    })
  }
})

// try this for discogs discography? or other...
// /database/search?q={query}&{?type,title,release_title,credit,artist,anv,label,genre,style,country,year,format,catno,barcode,track,submitter,contributor} 

// async await promise all fetch data function

async function fetchData(searchRequest) {
  // ... fetch logic
  // grab our fetch API URL
  const queryURLCogs = `
    https://api.discogs.com/database/search?q=${searchRequest}&key=${apiKeyCogs}&secret=${secret}`
  // url for lastfm artist.getinfo
  const queryURLLast = `
    https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${searchRequest}&api_key=${apiKeyLast}&format=json`

  // fetch promise all as response
  const responses = await Promise.all([
    fetch(queryURLCogs),
    fetch(queryURLLast)
  ])
  // map each promise to response 
  const data = await Promise.all(responses.map(function (response) {
    // return the response 
    return response.json()
  }))
  // Log the data to the console
  // logs an object array of both API data OK
  console.log("fetchData function const 'data':", data);

  // catch user type error
  // Check if the data exists and is defined
  // type in Graham Cox - returns a 'name' error - needs fixing!!
  if (data[1] && data[1].hasOwnProperty("artist")) {
    return data;

  } else {
    // bad entry - pop it off the array 
    searchHistory.pop(searchRequest)
    console.log('bad entry popped!', searchHistory)

    // from stack overflow (one-liner) https://stackoverflow.com/questions/63351263/how-to-remove-last-value-localstorage
    localStorage.savedArtists = JSON.stringify(JSON.parse(localStorage.savedArtists ?? "[]").slice(0, -1))
    console.log('bad value was removed from array and local:', searchHistory, localStorage)
    unknownModal()
  }
}

// finally, the getArtist(data) function to access all the data nomnomnom

function getArtist(data) {
  console.log("getArtist found data: ", data); // returns correct object, no errors or undefined

  // grabbing from API 1 (results array)

  // access cogsData array items
  let cogBioData = data[0].results[0];
  console.log("cogsBioData[0]", cogBioData)

  // access album [1]
  let cogData = data[0].results[1];
  console.log("cogsData array[1]:", cogData)

  // an alt array for missing/poor images
  let cogDataAlt = data[0].results[4];
  console.log("alt cogsData array(5):", cogDataAlt)

  // access the artist name only
  let nameCogs = cogData.title;
  console.log("cogsData artist name: ", nameCogs)

  // access artwork [0] bio pic
  let artworkBio = cogBioData.cover_image;
  console.log("cogsData artworkBIO: ", artworkBio)

  // if artwork missing (spacer.gif) - catch
  if (artworkBio.includes("/spacer.gif")) {
    artworkBio = data[0].results[1].cover_image;
    // and twice!
    if (artworkBio.includes("/spacer.gif")) {
      artworkBio = data[0].results[2].cover_image;
    }
  }

  // access artwork [1] 1st album
  let artwork = cogData.cover_image;
  console.log("cogsData artwork: ", artwork)

  // grabbing from API 2: lastfm artists array data[1].artist.name

  // access entire lastData array
  let lastData = data[1]
  console.log("Access entire lastfm array: ", lastData)
  // access artist array item
  let artistArray = lastData.artist;
  console.log("Access artist array: ", artistArray)

  // catch a bad name entry - refers to 'genre name'
  let artistName = '';

  if (!lastData.artist || !lastData.artist.name) {
    searchHistory.pop();
    console.log('bad entry popped!', searchHistory);
    unknownModal();

  } else {
    artistName = lastData.artist.name;
  }
  console.log("Access artist name: ", artistName)

  // these are causing the 'name' undefined issues ... !! 'talib kwali' etc
  // add ALL the other vars we"ll want to display here [TODO]
  let genreTags = artistArray.tags.tag; // all available genres
  console.log(genreTags)

  let genreArray = genreTags[0];
  console.log(genreArray)

  // genre without unknown catch sadly!
  let genre = genreArray.name;
  console.log('genre:', genre)

  // genre playlist - odd 'name' abbrev. error - fixed?
  let genrePlaylist = "";
  // catch bad url for genre
  if (typeof genreArray !== 'undefined' && typeof genreArray.url !== 'undefined') {
    genrePlaylist = genreArray.url;
    console.log(genrePlaylist)
  } else {
    // else- the item is UNDEFINED - but this is ignored??
    // originally this caught the error? now it does not run and error displays:
    // Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'name')
    console.log('genreArray or genreArray.url is undefined');
    // remove it from local
    localStorage.savedArtists = JSON.stringify(JSON.parse(localStorage.savedArtists ?? "[]").slice(0, -1))
    console.log('bad value was removed from array and local:', searchHistory, localStorage)
  }

  // temporary feature until full artist page is built (link to artist page URL)
  let artistPage = artistArray.url;
  console.log('artists URL page for lastfm: ', artistPage)

  // on-tour [TODO] - button colour grays out if not on tour
  // returns a boolean (0/1)
  let onTour = lastData.artist.ontour;
  console.log(onTour)
  console.log(typeof (Number(onTour)))

  // correct call from WITHIN the function we want to add the args to!
  // probably a cleaner way of gathering these into an array and passing that
  renderCard(
    cogData, nameCogs, artwork, artworkBio, lastData, artistArray, artistName, genre, genrePlaylist, artistPage)

  // call the createArtistObject function to re-use and store artist data (outside of fetch)
  // means no waiting/errors from API and all cards load instantly
  storeArtistObject(artistName, genre, artworkBio, artistPage)

}

// Function to store artist data in local storage
function storeArtistObject(artistName, genre, artworkBio, artistPage) {
  // grab currently stored
  let storedArtistObject = localStorage.getItem("artistObject");
  // define the parsed json
  let parsedArtistObject = storedArtistObject ? JSON.parse(storedArtistObject) : [];
  // push new artistObject
  parsedArtistObject.push({ artistName, genre, artworkBio, artistPage });
  // set to local
  localStorage.setItem("artistObject", JSON.stringify(parsedArtistObject));
  // debug
  console.log('artistObject created:', parsedArtistObject)
}

// dynamic HTML rendering 

// add a card counter to track when to scroll! [TODO: buggy]
// possibly conflicts with the fixed footer I imagine
let cardCounter = 0;
let cardCount = 0;

function updateCardCount(add) {
  cardCount += add ? 1 : -1;
  console.log('cards on screen:', cardCount)
  return cardCount;
}
// render the newly searched artist card (separate from the local saved)
function renderCard(

  cogData, nameCogs, artwork, artworkBio, lastData, artistArray, artistName, genre, genrePlaylist, artistPage) {

  console.log(cogData, nameCogs, artwork, artworkBio, lastData, artistArray, artistName, genre, genrePlaylist, artistPage)

  // cardCount++;
  updateCardCount(true);
  // success!! Learning at last!
  // console.log(cogData, lastData, nameCogs, artwork, artistArray, artistName)
  // define the card wrapper/container
  // create a wrapper to allow a fixed footer with a space for the cards
  const wrapper = document.createElement("div")
  wrapper.classList.add("wrapper");
  // for each new artist - create a new card container
  const cardContainer = document.createElement("div")
  // set its class (card-cont?)
  cardContainer.classList.add("d-inline-flex");
  // add a fixed width and centered margin
  cardContainer.style = "width: 100%", "margin: 0 auto";

  // create the card element
  const card = document.createElement("div");
  card.classList.add("card", "bg-dark", "m-3", "justify-content-center");
  // define cols
  card.classList.add("col-lg-3", "col-md-6", "col-sm-12");

  // set card attr and styling 
  card.setAttribute("data-name", artistName);
  // offsets the cards in an unhelpful way
  // card.style.boxShadow = "var(--btn-shadow)";
  card.style.paddingTop = "3rem";
  // define a card size for pixel perfect
  card.style.width = "398px";
  card.style.height = "520px";

  if (window.matchMedia("(max-width: 414px)").matches) {
    card.style.height = "580px";
  }

  // cardClose (x)
  const cardClose = document.createElement("div");
  cardClose.classList.add("btn-close", "alert-dismissible", "fade", "show");
  cardClose.setAttribute("data-bs-theme", "dark");
  cardClose.setAttribute("type", "button");
  cardClose.style.marginLeft = "auto";
  // [TODO] - x buttons bigger clickable area
  // cardClose.style.padding = "1rem";
  cardClose.order = "2";

  // create card body
  const cardBody = document.createElement("div");
  cardBody.classList.add("card-body");
  cardBody.style.textAlign = "center";

  // add title (artist name)
  const artistEl = document.createElement("h1");
  artistEl.classList.add("card-title");
  artistEl.textContent = `${artistName}`;
  // style here
  artistEl.style.letterSpacing = ".2rem";

  // adjust title for long names
  switch (true) {
    case artistName.length < 13:
      artistEl.style.fontSize = "34px";
      break;
    case artistName.length < 16:
      artistEl.style.fontSize = "30px";
      break;
    case artistName.length < 20:
      artistEl.style.fontSize = "24px";
      break;
    default:
      artistEl.style.fontSize = "16px";
      break;
  }

  // odd ipad issue 

  if (window.matchMedia("(max-width: 768px)").matches) {
    if (artistName.length < 13) {
      artistEl.style.fontSize = "24px";
    }
    else if (artistName.length > 15) {
      artistEl.style.letterSpacing = ".1rem";
      artistEl.style.fontSize = "18px";
    }

  }

  // add a genre label
  const genreEl = document.createElement("h3");
  genreEl.textContent = `${genre}`;
  // styling
  genreEl.style.fontSize = "18px";

  // add an image
  const albumArtEl = document.createElement("img");
  // specify src
  albumArtEl.src = `${artworkBio}`;
  // set the class
  albumArtEl.classList.add("album-img");
  // set the image size and style
  albumArtEl.style.width = "330px";
  albumArtEl.style.height = "310px";

  // matchMedia queries
  if (window.matchMedia("(max-width: 320px)").matches) {
    albumArtEl.style.width = "270px";
  } else if (window.matchMedia("(max-width: 414px)").matches) {
    albumArtEl.style.width = "300px";
  } else {
    albumArtEl.style.width = "330px";
  }
  // set dynamic heights too
  if (window.matchMedia("(max-width: 320px)").matches) {
    albumArtEl.style.height = "280px";
    // also change card length
    card.style.height = "550px";
  } else {
    albumArtEl.style.height = "310px";
  }

  albumArtEl.style.paddingBottom = "1rem";
  albumArtEl.style.borderRadius = ".5rem";

  // go to artist page button
  const artistButton = document.createElement("button");
  artistButton.classList.add("btn");
  // must include an <a href>
  const artistButtonLink = document.createElement("a");
  artistButtonLink.setAttribute("onclick", `window.open('${artistPage}', '_blank')`);
  artistButtonLink.href = `${artistPage}`;


  // get info btn style
  artistButton.style.height = "2.3rem";
  artistButton.style.color = "#fff";
  artistButton.style.margin = "1rem";
  artistButton.textContent = "Playlist";

  // new feature added! remove artist card
  const ticketButton = document.createElement("button")
  ticketButton.classList.add("btn", "tickets-new-card")
  ticketButton.style.height = "2.3rem";
  ticketButton.style.fontSize = '14px';

  // if artist 'onTour' = colour button differently
  // this could be done, but events != tours (so events will show up)
  // if (onTour === "1") {
  //   ticketButton.style.backgroundColor = "#07d159";
  // } else {
  //   ticketButton.style.backgroundColor = "#555555";
  // }

  ticketButton.style.backgroundColor = "#07d159";
  ticketButton.style.color = "#fff";
  ticketButton.style.margin = "1rem";
  ticketButton.textContent = "Buy Tickets";

  // append card container
  wrapper.appendChild(cardContainer)
  cardContainer.appendChild(card);
  // all card appends
  card.appendChild(cardClose);
  card.append(artistEl, genreEl);
  cardBody.appendChild(albumArtEl);
  cardBody.append(artistButton, ticketButton)
  card.appendChild(cardBody);
  gridContainer.appendChild(card);

  // // auto scroll every 5th card
  cardCounter++;
  if (cardCount % 5 === 0) {
    let nextRow = cardContainer.offsetTop + (Math.floor(cardCount / 5) * card.offsetHeight);
    window.scrollTo({
      top: nextRow,
      behavior: "smooth"
    });
  }

  // card event handlers

  // redirect to URL link (temp artist page)
  artistButton.addEventListener('click', function () {

    // Redirect to the artistButtonLink's href  - same window
    // window.location.href = artistButtonLink.getAttribute("href");
    // new tab
    window.open(artistButtonLink.getAttribute("href"), "_blank");

  })

  // event listener for tickets button [TODO - render data to modal]
  ticketButton.addEventListener('click', function () {

    // retrieve that artists ticketmaster data (if any)
    console.log("Accessing fetchTM function now...")

    // fetch TM data
    fetchTM(artistName)

    // instead - call the new ticketmaster modal?


    // // call the modal to display the data
    // ticketModal(artistName, eventsTotal, ticketmasterSiteLogin)
    // if its a pre-saved artist stored its - currentArtist.artistName
    // if its newly added its artistName to access the artists name to search TM


    // could offer more buttons within it to search site, check touring dates etc
    // if not touring - generate 'generic no tours found' message

  })

  // remove button (delete card) handler

  cardClose.addEventListener('click', function () {

    // grab the card index
    let indexName = card.getAttribute('data-name');
    console.log('cardIndex =', indexName);

    // remove the item from the searchHistory array using filter
    searchHistory = searchHistory.filter(function (historyItem) {
      return historyItem.toLowerCase() !== indexName.toLowerCase();
    });
    // debug
    console.log('searchHistory after filter: ', searchHistory);

    // remove the name item from local storage using filter
    let savedArtists = JSON.parse(localStorage.getItem("savedArtists") || "[]");
    savedArtists = savedArtists.filter(function (historyItem) {
      return historyItem.toLowerCase() !== indexName.toLowerCase();
    });
    // save it
    localStorage.setItem("savedArtists", JSON.stringify(savedArtists));

    // remove the artist object from local 
    removeArtistObject(artistName)

    // remove the card
    card.remove();
    // don't update count?
    updateCardCount(false);
    cardCounter--;
    console.log('cards on screen:', cardCounter)

  });

}

// remove the object array if remove btn clicked 

function removeArtistObject(artistName) {
  // get the item
  let storedArtistObject = localStorage.getItem("artistObject");
  // parse it
  let parsedArtistObject = storedArtistObject ? JSON.parse(storedArtistObject) : [];
  // set an index === artistName
  let index = parsedArtistObject.findIndex(artist => artist.artistName === artistName);
  // remove it
  parsedArtistObject.splice(index, 1);
  // adjust the array
  localStorage.setItem("artistObject", JSON.stringify(parsedArtistObject));
  // debug
  console.log('artistObject removed. new array:', parsedArtistObject)
  // required? [TODO: BUG check?]
  // location.reload();
}

// a re-render saved artist cards function
// bit un-DRY but it serves a purpose for now.  
// It completely bypasses the need to fetch data for one, 
// which was causing headaches and errors with API

function renderSavedCards(artistArray) {

  console.log(artistArray)

  // loop through the card array
  for (let i = 0; i < artistArray.length; i++) {
    // define 'currentArtist'
    const currentArtist = artistArray[i];
    console.log(artistArray[i]);
    // add to cardCount
    updateCardCount(true);
    // re-render saved card
    const wrapper = document.createElement("div")
    wrapper.classList.add("wrapper");
    // for each new artist - create a new card container
    const cardContainer = document.createElement("div")
    // set classes
    cardContainer.classList.add("col-lg-3", "col-md-6", "col-sm-12", "d-inline-flex");
    // add a fixed width and centered margin
    cardContainer.style = "width: 100%", "margin: 0 auto";

    // create the card element
    const card = document.createElement("div");
    card.classList.add("card", "bg-dark", "m-3", "justify-content-center");
    // also add the cols
    card.classList.add("col-lg-3", "col-md-6", "col-sm-12");
    // give each card a data-name tag
    card.setAttribute("data-name", currentArtist.artistName);
    // set card styling 
    card.style.paddingTop = "3rem";
    card.style.width = "398px";
    card.style.height = "520px";

    if (window.matchMedia("(max-width: 414px)").matches) {
      card.style.height = "580px";
    }

    // cardClose 
    const cardClose = document.createElement("div");
    cardClose.classList.add("btn-close", "alert-dismissible", "fade", "show");
    cardClose.setAttribute("data-bs-theme", "dark");
    cardClose.setAttribute("type", "button");
    cardClose.style.marginLeft = "auto";
    // [TODO] - x buttons bigger clickable area
    // cardClose.style.padding = "1rem";
    cardClose.order = "2";

    // create card body
    const cardBody = document.createElement("div");
    cardBody.classList.add("card-body");
    cardBody.style.textAlign = "center";

    // add title (artist name)
    const artistEl = document.createElement("h1");
    artistEl.classList.add("card-title");
    artistEl.textContent = currentArtist.artistName;

    // style 
    artistEl.style.letterSpacing = ".2rem";

    // adjust title for long names
    switch (true) {
      case currentArtist.artistName.length < 13:
        artistEl.style.fontSize = "34px";
        break;
      case currentArtist.artistName.length < 16:
        artistEl.style.fontSize = "30px";
        break;
      case currentArtist.artistName.length < 20:
        artistEl.style.fontSize = "24px";
        break;
      default:
        artistEl.style.fontSize = "16px";
        break;
    }

    if (window.matchMedia("(max-width: 768px)").matches) {
      if (currentArtist.artistName.length < 13) {
        artistEl.style.letterSpacing = ".1rem";
        artistEl.style.fontSize = "28px";
      }
      else if (currentArtist.artistName.length > 15) {
        artistEl.style.letterSpacing = ".1rem";
        artistEl.style.fontSize = "18px";
      }
    }

    // add a genre label
    const genreEl = document.createElement("h3");
    genreEl.textContent = currentArtist.genre;
    // styling
    genreEl.style.fontSize = "18px";

    // add an image
    const albumArtEl = document.createElement("img");
    // specify src
    albumArtEl.src = currentArtist.artworkBio;
    albumArtEl.classList.add("album-img");

    // set the image size and style
    albumArtEl.style.width = "330px";
    albumArtEl.style.height = "310px";
    // image width (dynamic)
    // albumArtEl.style.width = "330px";
    // use matchMedia to adjust the image sizes per screen size
    if (window.matchMedia("(max-width: 320px)").matches) {
      albumArtEl.style.width = "270px";
    } else if (window.matchMedia("(max-width: 414px)").matches) {
      albumArtEl.style.width = "300px";
    } else {
      albumArtEl.style.width = "330px";
    }
    // set dynamic heights too
    // albumArtEl.style.height = "310px";
    if (window.matchMedia("(max-width: 320px)").matches) {
      albumArtEl.style.height = "280px";
      // also change card length
      card.style.height = "550px";
    } else {
      albumArtEl.style.height = "310px";
    }
    // style image
    albumArtEl.style.paddingBottom = "1rem";
    albumArtEl.style.borderRadius = ".5rem";

    // add the buttons
    // go to playlist button
    const artistButton = document.createElement("button");
    artistButton.classList.add("btn");
    // must include an <a href>
    const artistButtonLink = document.createElement("a");
    artistButtonLink.setAttribute("onclick", `window.open('${currentArtist.artistPage}', '_blank')`);
    artistButtonLink.href = `${currentArtist.artistPage}`;
    artistButton.style.height = "2.3rem";
    // artistButton.style.backgroundColor = "#E34EB3";
    artistButton.style.color = "#fff";
    artistButton.style.margin = "1rem";
    artistButton.textContent = "Playlist";

    // new feature added! search for tickets API call
    const ticketsButton = document.createElement("button")
    ticketsButton.classList.add("btn", "tickets-saved-card")
    ticketsButton.style.height = "2.3rem";
    ticketsButton.style.fontSize = '14px';
    ticketsButton.style.backgroundColor = "#07d159";
    ticketsButton.style.color = "#fff";
    ticketsButton.style.margin = "1rem";
    ticketsButton.textContent = "Buy Tickets";
    // add container to wrapper
    wrapper.appendChild(cardContainer)
    // Add the card to the card container
    cardContainer.appendChild(card);
    // append elements
    card.append(cardClose)
    card.append(artistEl, genreEl);
    cardBody.appendChild(albumArtEl);
    cardBody.append(artistButton, ticketsButton)
    card.appendChild(cardBody);
    gridContainer.appendChild(card);

    // button event handling 
    // redirect to URL link (temp artist page)
    artistButton.addEventListener('click', function () {
      // // Redirect to the artistButtonLink's href
      // window.location.href = artistButtonLink.getAttribute("href");
      // new tab
      window.open(artistButtonLink.getAttribute("href"), "_blank");

    })

    // event listener for tickets button [TODO] - fetch API and render data
    ticketsButton.addEventListener('click', function () {

      // retrieve that artists ticketmaster data (if any)
      console.log("ticketmaster called")
      // call the fetchTM function
      // redefine artistName
      let artistName = currentArtist.artistName;
      // call fetch TM data 
      fetchTM(artistName)
      // // modal ticket - this is called within ticketmaster js
      // ticketModal(artistName)
      // if saved artist its - currentArtist.artistName
      // if newly added its artistName to access the artists name to search TM

      // generate a modal to display the info
      // could offer more buttons within it to search site, check touring dates etc
      // if not touring - generate 'generic no tours found' message

    })

    // remove card event ('x' close)

    cardClose.addEventListener('click', function () {

      // remove card, array and local item 
      card.remove()
      // don't update count?
      updateCardCount(false);
      cardCounter--;
      console.log('cards on screen:', cardCounter)

      // update the data-name local storage
      // grab the card index
      let indexName = card.getAttribute('data-name');
      console.log('cardIndex =', indexName);

      // remove the item from the searchHistory array using filter
      searchHistory = searchHistory.filter(function (historyItem) {
        return historyItem.toLowerCase() !== indexName.toLowerCase();
      });
      console.log('searchHistory after filter: ', searchHistory);

      // remove the name item from local storage using filter
      let savedArtists = JSON.parse(localStorage.getItem("savedArtists") || "[]");
      savedArtists = savedArtists.filter(function (historyItem) {
        return historyItem.toLowerCase() !== indexName.toLowerCase();
      });
      // store
      localStorage.setItem("savedArtists", JSON.stringify(savedArtists));

      // also remove object array on re-rendered cards
      removeArtistObject(currentArtist.artistName)

    })

    // count cards
    cardCounter++
    if (cardCount % 5 === 0) {
      let nextRow = cardContainer.offsetTop + (Math.floor(cardCount / 5) * card.offsetHeight);
      window.scrollTo({
        top: nextRow,
        behavior: "smooth"
      });
    }
  }
}

// ticket modal function
function ticketModal(artistName, eventsTotal, ticketmasterSiteLogin) {
  console.log('ticketmaster modal called')
  showModal()
  // stop more being added! (remove them if exist)
  const previousModal = document.querySelector(".modal-dialog");
  if (previousModal) {
    previousModal.remove();
  }
  // attached to event listener
  // create the modal div 
  const ticketModalDiv = document.createElement("div");
  ticketModalDiv.classList.add("ticket-modal",
    "modal-dialog", "modal-dialog-centered", "modal-dialog-scrollable")
  ticketModalDiv.innerHTML = '';
  ticketModalDiv.innerHTML = `
      <div class="modal-content">
        <div class="modal-header custom-header justify-content-center">
        <h2 class="modalTitle"><i class="fa-solid fa-ticket"></i> TICKETMASTER INFO <i class="fa-solid fa-ticket"></i></h2>
        <h1>${artistName}</h1>
        </div>
        <div class="modal-body justify-content-center">
          <!-- ticket master info pulled -->
          <div class="row g-3 align-items-left app-tickets-modal">
            <div class="col-auto justify-content-center modal-data-helper">
              <span id="helperInline" class="form-text">
                We are grabbing all ticketmaster info for you now!
              </span>
              <ul class="list-group list-group-flush info-list">
                <li class="list-group-item active artist-event-count has-events">
                <h2>${artistName} has </h2><h1><b>${eventsTotal}</b></h1> <h3>upcoming events!</h3>
                </li>
              </ul>
              <div class="event-card">
                <p> add all cards here with detailed data info oer event?</p>
                <div class="eventLabel"></div>
              </div>
              <div class="buy-button">
                <p>
                Buy available tickets for upcoming shows via TicketMaster with one click!
                </p>
              </div>
              <button class="btn" type="button"><a href="${ticketmasterSiteLogin}">Buy Tickets</a></button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="close-modal" data-bs-dismiss="modal">Close</button>
        </div>
      </div>`

  // append the modal to the DOM
  errorModalEl.appendChild(ticketModalDiv);

  // if close X clicked - close the modal
  const closeButton = document.querySelector('#close-modal');
  closeButton.addEventListener('click', function () {
    hideModal()
  });
}

// MODALS [TODO] - add as a separate js file

// noTour modal
function noTourModal(artistName) {
  console.log('no tour modal called')
  showModal()
  // stop more being added! (remove them if exist)
  const previousModal = document.querySelector(".modal-dialog");
  if (previousModal) {
    previousModal.remove();
  }
  // attached to event listener
  // create the modal div 
  const noTourModalDiv = document.createElement("div");
  noTourModalDiv.classList.add("modal-dialog", "modal-dialog-centered")
  noTourModalDiv.innerHTML = '';
  noTourModalDiv.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
        <h4 class="modalTitle no-tour">Artist is not on tour.</h4>
        <span id="humourInline" class="form-text">
        <br>
        But, all is not lost!
        </span>
        </div>
        <div class="modal-body justify-content-center">
          <!-- app helper -->
          <div class="row g-3 align-items-center justify-content-center app-help">
            <div class="col-auto">
                <ul class="list-group list-group-flush info-list">
                <li class="list-group-item active artist-no-tour">
                <h2>${artistName} isn't touring right now.</h2>
                <h3>Please check back soon.</h3>
                </li>
                <li class="list-group-item d-flex no-tour-text">
                <br>
                Why not visit the artist's page?<br> 
                You'll be able to listen to their music,
                watch music videos, find similar artists and entirely new playlists!
                </li>
                <li class="list-group-item d-flex justify-content-center no-tour-text">
                <br>
                Just click the playlist button within the artist card.
                </li>
                </ul>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="close-modal" data-bs-dismiss="modal">Close</button>
        </div>
      </div>`
  // append the modal to the DOM
  errorModalEl.appendChild(noTourModalDiv);

  // if close X clicked - close the modal
  const closeButton = document.querySelector('#close-modal');

  closeButton.addEventListener('click', function () {
    hideModal()
  });
}

// error modal handling
function errorModal() {
  console.log('modal called')
  showModal()
  // stop more being added! (remove them if exist)
  const previousModal = document.querySelector(".modal-dialog");
  if (previousModal) {
    previousModal.remove();
  }
  // attached to event listener
  // create the modal div 
  const errorModalDiv = document.createElement("div");
  errorModalDiv.classList.add("modal-dialog", "modal-dialog-centered")
  errorModalDiv.innerHTML = '';
  errorModalDiv.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
        <h4 class="modalTitle">Polite Notice</h4>
        </div>
        <div class="modal-body justify-content-center">
          <!-- app helper -->
          <div class="row g-3 align-items-center app-help">
            <div class="col-auto">
              <span id="appHelpInline" class="form-text">
                You need to search for an artist before you hit the search button.
                <br>
                Try again!
              </span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="close-modal" data-bs-dismiss="modal">Close</button>
        </div>
      </div>`
  // append the modal to the DOM
  errorModalEl.appendChild(errorModalDiv);

  // if close X clicked - close the modal
  const closeButton = document.querySelector('#close-modal');

  closeButton.addEventListener('click', function () {
    hideModal()
  });
}

// modal for a duplicate artist search

function dupeModal() {
  console.log('modal called')
  showModal()
  // stope more being added! (remove them if exist)
  const previousModal = document.querySelector(".modal-dialog");
  if (previousModal) {
    previousModal.remove();
  }

  // attached to event listener
  // create the modal div 
  const dupeModalDiv = document.createElement("div");
  dupeModalDiv.classList.add("modal-dialog", "modal-dialog-centered")
  dupeModalDiv.innerHTML = '';
  dupeModalDiv.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
        <h4 class="modalTitle">Polite Notice</h4>
        </div>
        <div class="modal-body justify-content-center">
          <!-- app helper -->
          <div class="row g-3 align-items-center app-help">
            <div class="col-auto">
              <span id="appHelpInline" class="form-text">
                You've already searched and added this artist to your library!
                <br>
                Please pick another artist.
              </span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="close-modal" data-bs-dismiss="modal">Close</button>
        </div>
      </div>`
  // append the modal to the DOM
  errorModalEl.appendChild(dupeModalDiv);

  // if close X clicked - close the modal
  const closeButton = document.querySelector('#close-modal');

  closeButton.addEventListener('click', function () {
    hideModal()
  });
}

// unknown/mis-spelt function
function unknownModal() {
  console.log('modal called')
  showModal()
  // stop more being added! (remove them if exist?)
  const previousModal = document.querySelector(".modal-dialog");
  if (previousModal) {
    previousModal.remove();
  }
  // attached to event listener
  // create the modal div 
  const unknownModalDiv = document.createElement("div");
  unknownModalDiv.classList.add("modal-dialog", "modal-dialog-centered")
  unknownModalDiv.innerHTML = '';
  unknownModalDiv.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
        <h4 class="modalTitle">Polite Notice</h4>
        </div>
        <div class="modal-body justify-content-center">
          <!-- app helper -->
          <div class="row g-3 align-items-center app-help">
            <div class="col-auto">
              <span id="appHelpInline" class="form-text">
                Artist not recognised. <br>  Please make sure you have spelt the name correctly!
                <br>
                Until our system improves by catching typos(!), please try again.
              </span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="close-modal" data-bs-dismiss="modal">Close</button>
        </div>
      </div>`
  // append the modal to the DOM
  errorModalEl.appendChild(unknownModalDiv);

  // if close X clicked - close the modal
  const closeButton = document.querySelector('#close-modal');

  closeButton.addEventListener('click', function () {
    hideModal()
  });
}

// genre error modal
function genreModal() {
  console.log('genre modal called')
  showModal()
  // stop more being added! (remove them if exist)
  const previousModal = document.querySelector(".modal-dialog");
  if (previousModal) {
    previousModal.remove();
  }
  // attached to event listener
  // create the modal div 
  const unknownModalDiv = document.createElement("div");
  unknownModalDiv.classList.add("modal-dialog", "modal-dialog-centered")
  unknownModalDiv.innerHTML = '';
  unknownModalDiv.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
        <h4 class="modalTitle">Polite Notice</h4>
        </div>
        <div class="modal-body justify-content-center">
          <!-- app helper -->
          <div class="row g-3 align-items-center app-help">
            <div class="col-auto">
              <span id="appHelpInline" class="form-text">
                You cannot search via Genre here.
                <br>
                If you go to an artist's page, you can search for similar genres and even entire genre playlists!
              </span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="close-modal" data-bs-dismiss="modal">Close</button>
        </div>
      </div>`
  // append the modal to the DOM
  errorModalEl.appendChild(unknownModalDiv);

  // if close X clicked - close the modal
  const closeButton = document.querySelector('#close-modal');

  closeButton.addEventListener('click', function () {
    hideModal()
  });
}

// show and hide the modal
function showModal() {
  errorModalEl.classList.add('show');
  errorModalEl.style.display = 'block';
}

function hideModal() {
  errorModalEl.classList.remove('show');
  errorModalEl.style.display = 'none';
}

