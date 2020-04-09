
var request = require('superagent');
var Crawler = require('simplecrawler');
const cheerio = require('cheerio');
const fs = require('fs');
var nlp = require('compromise');



function crawl1(res){
    console.log("crawl1.1")
    var crawler = Crawler("http://visualmedia.jacobs.com/Tyndall-IFS/").on("fetchcomplete", function(queueItem, responseBuffer, response){
        console.log("I just received %s (%d bytes)", queueItem.url, responseBuffer.length);
        console.log("It was a resource of type %s", response.headers['content-type']);
    }).on("crawlstart", function(){
        console.log('crawl started');
    }).on("discoverycomplete", function(queueItem, Array){
        _scrapeResults.results = Array;
        console.log("dicovery complete event")
    }).on("complete", function(){
        let data = JSON.stringify(_scrapeResults, null, 2);
        fs.writeFile('crawler.json', data, (err) => {
            if (err) throw err;
            console.log("data written to file")
        })
        res.send(_scrapeResults);
    });
    crawler.maxConcurrency = 3;
    // crawler.maxDepth = 2;
    // console.log(crawler);
    crawler.discoverResources = function(buffer, queueItem) {
        var $ = cheerio.load(buffer.toString("utf8"));
     
        return $("a[href]").map(function () {
            return $(this).attr("href");
        }).get();
    }; 

    crawler.start();
    //You'll also need to set up event listeners for the events you want to listen to. crawler.fetchcomplete and crawler.complete are good places to start.
}

function analyze1(){

    fs.readFile('crawler.json', (err, data) =>{
        if (err) throw err;
        let _data = JSON.parse(data);
        // console.log(_data);
        // processURLs (_data.results, res);
        request
            .get("http://visualmedia.jacobs.com/Tyndall-IFS/technical_guidelines_division_33.php")
            .end((err, res) => {
                // console.log(res.text);
                var $ = cheerio.load(res.text);
                var allText = $.text();
                // console.log(allText);
                var _doc = nlp(allText);
                var _topics = _doc.topics().json();
                console.log(_topics);
            });
    })

}

function processURLs(Array){
    for (var i=0;i<Array.length;i++){
        console.log(Array[i]);
    }
}

analyze1();
