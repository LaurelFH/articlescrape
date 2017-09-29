//sets up the server and connection to Mongoose

//DEPENDENCIES
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var path = require("path");
var express = require("express");
// var expressHandlebars = require("express-handlebars");



//LINKS TO MODEL FILES IN MODELS FOLDER
var Article = require("./models/article.js");
var Note = require("./models/note.js");


//SCRAPING TOOL SETUP
var request = require("request");
var cheerio = require("cheerio");
//grab data from ES6
mongoose.Promise = Promise;


//EXPRESS SET UP 
var app = express();

//BODY-PARSE INFO AND MORGAN FOR LOGGING
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));


//LINK TO PUBLIC STATIC FILES 
app.use(express.static("public"));


//DATABASE CONFIG WITH MONGOOSE
// mongoose.connect("mongodb://localhost/articlescrape");
// mongoose.connect("mongodb://heroku_zgqnbv72:mgl7s03pakp0is74ut1934nu6v@ds155934.mlab.com:55934/heroku_zgqnbv72");
// MONGOLAB_URI = "mongodb://heroku_zgqnbv72:mgl7s03pakp0is74ut1934nu6v@ds155934.mlab.com:55934/heroku_zgqnbv72";
// mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/articlescrape");
// mongoURI = 'mongodb://localhost/articlescrape';
// mongoose.createConnection("mongodb://heroku_zgqnbv72:mgl7s03pakp0is74ut1934nu6v@ds155934.mlab.com:55934/heroku_zgqnbv72", {useMongoClient: true});
// var options = { server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } }, 
//                 replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS : 30000 } } };  
// mongoose.connect(process.env.MONGOLAB_URI, function (error) {
//     if (error) console.error(error);
//     else console.log('mongo connected');
// });

// mongoose.connect(MONGOLAB_URI, options);
mongoose.connect("mongodb://heroku_zgqnbv72:mgl7s03pakp0is74ut1934nu6v@ds155934.mlab.com:55934/heroku_zgqnbv72");
var db = mongoose.connection;

//if there was an error connecting 
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

//if successfully connected 
db.once("open", function() {
  console.log("Mongoose connection successful.");
});

// mongoose.Promise = global.Promise; // mongoose promises deprecated, use node - mongoosejs.com/docs/promises
// mongoose.connect(config.db.MONGODB_URI);
// mongoose.connection.once('open', () => { console.log('MongoDB Connected'); });
// mongoose.connection.on('error', (err) => { console.log('MongoDB connection error: ', err); });


//ALL APP ROUTES 

//information for the landingpage
app.get("/", function(req, res) {
  res.send("Welcome to Digitimes: your home for quick news reviews");
});


//set up the site to be scraped with request and cheerio info 
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  request("http://www.unc.edu/spotlight/", function(error, response, html) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);
    // Now, we grab every h2 within an article tag, and do the following:
    //COULD ALSO BE H5 ELEMENTS ON THIS PAGE-- DOUBLE CHECK THE DIV CLASSES TOO FOR THE LI
    $("h3").each(function(i, element) {

      // Save an empty result object
      var result = {};
      console.log("this is the result of h3 at unc spotlight:"+ result);

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this).children("a").text();
      result.link = $(this).children("a").attr("href");

      // Using our Article model, create a new entry
      // This effectively passes the result object to the entry (and the title and link)
      var entry = new Article(result);

      // Now, save that entry to the db
      entry.save(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        // Or log the doc
        else {
          console.log(doc);
        }
      });

    });
  });
  // Tell the browser that we finished scraping the text
  res.send("News Scrape Complete!");
  //make the user return to the main page?
  res.redirect('/');
});


// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
  // Grab every doc in the Articles array
  Article.find({}, function(error, doc) {
    // Log any errors
    if (error) {
      console.log("there was an error getting all articles:"+ error);
    }
    // Or send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});

// Grab an article by its ObjectId
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  Article.findOne({ "_id": req.params.id })
  // ..and populate all of the notes associated with it
  .populate("note")
  // now, execute our query
  .exec(function(error, doc) {
    // Log any errors
    if (error) {
      console.log("there was an error getting the article by its objectID:"+ error);
    }
    // Otherwise, send the doc to the browser as a json object
    else {
      // res.json(doc);
      res.send(doc);
    }
  });
});


// Create a new note or replace an existing note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  var newNote = new Note(req.body);

 // And save the new note the db
  newNote.save(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      // Use the article id to find and update it's note
      Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
      // Execute the above query
      .exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        else {
          // Or send the document to the browser
          res.send(doc);
        }
      });
    }
  });
});

//LISTENING AND PORT INFORMATION process.env.PORT || 
app.listen(process.env.PORT || 3000, function() {
  console.log("App running on port 3000!");
});
