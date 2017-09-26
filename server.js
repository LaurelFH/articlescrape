//sets up the server and connection to Mongoose

//DEPENDENCIES
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

//LINKS TO MODEL FILES

//SCRAPING TOOL SETUP

var request = require("request");
var cheerio = require("cheerio");
//grab data from ES6
mongoose.Promise = Promise;


//EXPRESS 
var app = express();

//BODY-PARSE INFO 
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));


//LINK TO PUBLIC STATIC FILES 
app.use(express.static("public"));


//DATABASE CONFIG WITH MONGOOSE
mongoose.connect("");
var db = mongoose.connection;

//if there was an error connecting 
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

//if successfully connected 
db.once("open", function() {
  console.log("Mongoose connection successful.");
});


//ALL APP ROUTES 

//set up the site to be scraped with request and cheerio info 
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  request("http://www.wired.com/", function(error, response, html) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);
    // Now, we grab every h2 within an article tag, and do the following:
    //COULD ALSO BE H5 ELEMENTS ON THIS PAGE-- DOUBLE CHECK THE DIV CLASSES TOO FOR THE LI
    $("h2").each(function(i, element) {

      // Save an empty result object
      var result = {};

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
  res.send("Scrape Complete");
});
