var express = require('express');
var router = express.Router();
var request = require('superagent');

/* GET google custom search listing. */
router.post('/', function(req, res, next) {
    var _maxResults = 20;
    // console.log(req.body.query);
    _query = req.body.query;
    _gcsResults = {"results":[]};
    getCustomSearch(_query, _gcsResults, res, -1, _maxResults);
});

function getCustomSearch(_query, _gcsResults, res, _start, _maxResults){
    if (_start > 0){
        queryString = 'https://www.googleapis.com/customsearch/v1?key='+process.env.TYNDALL_GCS_KEY_IFS+'&cx=006933437979345530940:ej5rn3yvlcm&q='+_query+'&start='+(_start-1);
    } else {
        queryString = 'https://www.googleapis.com/customsearch/v1?key='+process.env.TYNDALL_GCS_KEY_IFS+'&cx=006933437979345530940:ej5rn3yvlcm&q='+_query;
    }
    request
        .get(queryString)
        .then(data => {
            if (_gcsResults.results.length > 0){
                _gcsResults.results[0].items = _gcsResults.results[0].items.concat(data.body.items);
            } else _gcsResults.results.push(data.body);
            console.log(typeof data.body.queries.nextPage !== 'undefined');
            if(typeof data.body.queries.nextPage !== 'undefined' && _gcsResults.results[0].items.length < _maxResults){
                // console.log('rerunning');
                _start = data.body.queries.nextPage[0].startIndex;
                getCustomSearch(_query, _gcsResults, res, _start, _maxResults);
            } else /*res.send(_gcsResults.results[0]);*/res.send('broken');
        });
    
}

module.exports = router;