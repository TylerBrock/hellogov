var express = require('express');
var twilio = require('twilio');
var url = require('url');
var path = require('path');

var ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
var AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
var HOST = 'hello-gov.herokuapp.com'

var HG_MPG = 'https://s3.amazonaws.com/hello-gov/helloGov.mp3';

var client = twilio.RestClient(ACCOUNT_SID, AUTH_TOKEN);

var ISSUES = [
  {
    type: 'Minority Issues',
    person: 'Senator Barbara Boxer',
    phone: '+12022243553',
  },
  {
    type: 'Conflict of Interest',
    person: 'Rep Nancy Pelosi',
    phone: '+12022254965',
  }
]

function describeIssues() {
  return ISSUES.map(function (issue, idx){
    `Press ${idx} to call ${issue.person} about ${issue.type}.`
  }).join(' ');
}

function makeUrl(query) {
  return url.format({
    protocol: 'https',
    host: HOST,
    query: query || {}
  })
}

function sendTwiml(res, twiml) {
  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
}

var app = express();
app.set('port', (process.env.PORT || 5000));

app.post('/processComplete', function (req, res) {
  var twiml = new twilio.TwimlResponse();
  twiml
    .say('calling now')
    .dial('+19175263454', { timeout: 15 });
  senTwiml(res, twiml);
});

app.post('/processInfo', function (req, res) {
  var twiml = new twilio.TwimlResponse();
  twiml.say('info about the representative');
  twiml.redirect('/call');
  sendTwiml(res, twiml);
});

app.post('/selected', function (req, res) {
  var digit = req.query.Digits;
  var issue = ISSUES[digit];
  var twiml = new twilio.TwimlResponse();
  twiml.say(`Ok, are you ready to talk with ${issue.person}?`);
});

app.post('/process', function (req, res) {
  var digit = req.query.Digits;
  var issue = ISSUES[digit];
  if (issue) {
    res.redirect('/selected');
  } else {
    res.redirect('/call');
  }
});

app.post('/call', function (req, res) {
  var twiml = new twilio.TwimlResponse();
  twiml
    .say(['Welcome to hello guv', describeIssues()].join(' '))
    .gather({
      numDigits: 1,
      action: '/process',
    });
  sendTwiml(res, twiml);
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
