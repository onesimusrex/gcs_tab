var express = require('express');
var router = express.Router();
var request = require('superagent');
var Crawler = require('simplecrawler');
const cheerio = require('cheerio');
const fs = require('fs');
var nlp = require('compromise');
const Throttle = require('superagent-throttle');
nlp.extend(require('compromise-paragraphs'));
const NaturalLanguageUnderstandingV1 = require ('ibm-watson/natural-language-understanding/v1');
    const { IamAuthenticator } = require ('ibm-watson/auth');

    const naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
        version: '2019-07-12',
        authenticator: new IamAuthenticator({ apikey: 'Asrl_esdUauoAsbVmTG5KxM8BaiqCpBo2rpqY08XCSqN'}),
        url: 'https://gateway.watsonplatform.net/natural-language-understanding/api'
    })

// let throttle = new Throttle({
//     active: true,     // set false to pause queue
//     rate: 5,          // how many requests can be sent every `ratePer`
//     ratePer: 10000,   // number of ms in which `rate` requests may be sent
//     concurrent: 2     // how many requests can be sent concurrently
//   })
_analyze1Results = {"results":{}};


/* GET google custom search listing. */
router.get('/', function(req, res, next) {
    var _maxResults = 20;
    _query = req.body.query;
    _scrapeResults = {"results":[]};
    crawl1(res);
    
});

router.get('/analyze1', function(req, res, next){
    _analyze1Results = {"results":{}};
    analyze1(res);
    console.log('started');
});

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

function analyze1(res){

    fs.readFile('crawler.json', (err, data) =>{
        if (err) throw err;
        let _data = JSON.parse(data);
        // console.log(_data);
        processURLs (_data.results, res, 0);
        // _res.send("done");
    })
    // request
    // .get("http://visualmedia.jacobs.com/Tyndall-IFS/technical_guidelines_division_33.php")
    // .end((err, res1) => {
    //     // console.log(res);
    //     res.send("hi");
    // });
    
}

function processURLs(Array, res, count){
    // for (var i=0;i<Array.length;i++){
    articles = {}
    if (count < Array.length){
        // console.log(Array[count]);
        request
            .get(/*'http://visualmedia.jacobs.com/Tyndall-IFS/technical_guidelines_division_33.php'*/Array[count])
            .end((err, res1) => {
                // console.log(res.text);
                
                var $ = cheerio.load(res1.text);
                var allText = $.text();
    
                // var bigArray = $('article').map(function(i, el){
                //     return ["hi", $(this).html()];
                // }).get();

                $('article').map(function(i, el){
                    _p1 = $(this).find('p')
                    var _parent2 = _p1.parentsUntil('article').filter('article').attr('id')
                    var _text = _p1.nextAll('p').text();
                    var _html = _p1.nextAll('p').html()
                    var p = _parent2 || "Introduction";
                    if (typeof articles[p] === "undefined" && _text != ""){
                        articles[p] = [];
                    }
                    if (typeof _text !== "undefined" && _text != ""){
                        articles[p].push({
                            // "parent": _parent,
                            "heading": p,
                            "text": _text,
                            "text_html": _html
                        });
                    }

                })

                $('article').map(function(i,el){
                    var contentBase = $(this).find('div[class=team-title]').map(function(i,el){
                        var _parentId = $(this).parentsUntil('article').filter('article').attr('id');
                        var heading = $(this).children('span').text();
                        var _text = $(this).nextAll(/*'h5,p'*/).text();
                        var _html = $(this).nextAll(/*'h5,p'*/).html(); 
                        if (typeof articles[_parentId] === "undefined" && _text != ""){
                            articles[_parentId] = [];
                        }
                        
                        console.log(heading || "no heading")
                        console.log(_html.slice(0, 15)+"..." || "not found");
                        try {
                            if (true/*typeof _parentId !== "undefined" && typeof contentBase !== "undefined" && _text != ""*/){
                                articles[_parentId].push({
                                    "heading": heading,
                                    "text": _text,
                                    "text_html": _html
                                })
                            }
                        } catch (err){
                            console.log("error with " +heading +' in '+ _parentId)
                            console.log(err);
                        }
                    })
                })

                var bigArray = $('article').find('div[class=acctitle]').map(function(i, el){
                    var _parent = $(this).parentsUntil('article').filter('article').attr('id');
                    if (typeof articles[_parent] === "undefined"){
                        articles[_parent] = [];
                    }
                   
                    articles[_parent].push({
                        // "parent": _parent,
                        "heading": $(this).text(),
                        "text": $(this).next().text(),
                        "text_html": $(this).next().html()
                    });
                    // var _parent = $(this).parentsUntil('article').filter('article').text();
                    return [_parent, $(this).text(), $(this).next().html()]; 
                }).get();

                Object.keys(articles).map(function(el, i){
                    
                    if (articles[el].length > 0){
                        articles[el].map(function(el2, i2){
                            // console.log(el2)
                            var _tempdoc = nlp(el2.text)
                            // console.log(el2.text)
                            var _tempTopics = _tempdoc.topics().json();
                            // console.log(_tempTopics.length);

                            num = 25;
                            var analyzeParams = {
                                // 'url': 'www.nytimes.com',
                                text: el2.text,
                                'features': {
                                    'keywords': {
                                        'limit': num
                                    },
                                    'relations': {},
                                    'entities': {
                                        'limit': num,
                                        'mentions': true
                                    },
                                    'concepts': {
                                        'limit': num
                                    }
                                }
                            }

                            _this = this;
                            /*  turn back on!
                            naturalLanguageUnderstanding.analyze(analyzeParams)
                                .then(analysisResults => {
                                    // console.log(JSON.stringify(analysisResults.result, null, 2))
                                    // console.log(this)
                                    // _this.AddNlpFeature(analysisResults.result, dataitem)
                                    el2['topics'] = analysisResults.result;
                                    // console.log(_this.AddNlpFeature(analysisResults.result, dataitem));
                                    // return _this.AddNlpFeature(analysisResults.result);
                                })
                                .catch(err => {
                                    console.log('error', err);
                                })
                            */




                            // el2['topics'] = _tempTopics;
                        })
                    }
                })

                var _doc = nlp(allText);
                var _topics = _doc.topics().json();
                // var _paragraphs = _doc.paragraphs().json();

                // console.log(_topics);
                // _analyze1Results.results.push(_topics);
                var keywordArr = []
                // for (var i=0;i<_topics.length; i++){
                //     keywordArr.push = _topics[i].text;
                //     console.log(_topics[i].text);
                // }
                arr = _topics.map(function(item, index){
                    // keywordArr.push = item.text;
                    // console.log(item.text);
                    return item.text;
                })
                _analyze1Results.results[Array[count]] = {
                    // "paragraphs": _paragraphs,
                    "domArray": articles/*bigArray,*/
                    // "keywords": arr
                };
                // res.send(JSON.stringify(_analyze1Results));
    

                count++;
                processURLs(Array, res, count);
            });
    } else {
        // res.send(JSON.stringify(_analyze1Results));
        fs.writeFile('topics_new.json', JSON.stringify(_analyze1Results.results), (err) => {
            if (err) throw err;
            console.log("data written to file")
        })

        res.send(_analyze1Results.results/*["http://visualmedia.jacobs.com/Tyndall-IFS/technical_guidelines_division_33.php"]*/);
    }

    // }

    
}

module.exports = router;