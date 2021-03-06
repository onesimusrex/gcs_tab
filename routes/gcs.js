var express = require('express');
var router = express.Router();
var request = require('superagent');

/* GET google custom search listing. */
router.post('/', function(req, res, next) {
    var _maxResults = 20;
    // console.log(req.body.query);
    _query = req.body.query;
    _queryType = req.body.queryType;
    _gcsResults = {"results":[]};
    getCustomSearch(_query, _gcsResults, res, -1, _maxResults, _queryType);
});

function getCustomSearch(_query, _gcsResults, res, _start, _maxResults, _queryType){
    if (_queryType == 'ifs'){
        _cx = process.env.TYNDALL_GCS_CX_IFS;
    } else _cx = process.env.TYNDALL_GCS_CX_MAIN;
    if (_start > 0){
        queryString = 'https://www.googleapis.com/customsearch/v1?key='+process.env.TYNDALL_GCS_KEY_IFS+'&cx='+_cx+'&q='+_query+'&start='+(_start-1);
    } else {
        queryString = 'https://www.googleapis.com/customsearch/v1?key='+process.env.TYNDALL_GCS_KEY_IFS+'&cx='+_cx+'&q='+_query;
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
                getCustomSearch(_query, _gcsResults, res, _start, _maxResults,_queryType);
            } else res.send(_gcsResults.results[0]);
        });
    
}

module.exports = router;