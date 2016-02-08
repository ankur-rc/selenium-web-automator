/**
@author: Ankur Roy Chowdhury
**/

/////////////////////////////////////////////////////////////////////initialisation//////////////////////////////////////////////////////////////////////////////////////////////

//constants
const URL = 'http://www.delhi.gov.in/wps/wcm/connect/doit_transport/Transport/Home/Driving+Licence/Online+Appointment+and+Payment+for+Driving+License';
const RECEIPT_NO = "HS-6837";
const RESULT_FILE = 'result.txt';

//config
var twilioCredentials = require("./my-config").TwilioCredentials;
var counter = 0;

const EventEmitter = require('events');
const util = require('util');
const fs = require('fs');

//variables
var webdriver = require('selenium-webdriver/phantomjs'),
    By = require('selenium-webdriver').By,
    until = require('selenium-webdriver').until,
    driver = null,
    result = null;

var twilio = require('twilio')(twilioCredentials.AUTH_SID, twilioCredentials.AUTH_TOKEN);

/////////////////////////////////////////////////////////////////////event_emitter///////////////////////////////////////////////////////////////////////////////////////////////

var EventEmitterImpl = function () {
    EventEmitter.call(this);
}

util.inherits(EventEmitterImpl, EventEmitter);

var eventEmitter = new EventEmitterImpl();

//////////////////////////////////////////////////////////////////////functions//////////////////////////////////////////////////////////////////////////////////////////////////

var checkPreviousResult = function (current_result) {
    console.log("Opening file...");
    try {
        fs.accessSync(RESULT_FILE, fs.F_OK);
        console.log("File exists, reading contents...");
        try {
            var data = fs.readFileSync(RESULT_FILE, 'utf8');
            if (data.trim() === current_result.trim()) {
                console.log("Status hasn't changed.\n Not sending sms...");
            } else {
                try {
                    fs.writeFileSync(RESULT_FILE, current_result, 'utf8');
                    sendSms(current_result);
                } catch (err) {
                    console.error("Could not write to file... " + err.message);
                }
            }
        } catch (err) {
            console.error("Could not read file... " + err.message);
        }

    } catch (err) {
        console.error('File does not exist, creating it...');
        try {
            fs.writeFileSync(RESULT_FILE, current_result, 'utf8');
            console.log('created.')
            sendSms(current_result);
        } catch (err) {
            console.error("Could not write to file... " + err.message);
        }
    }
}

///////////////////////////////////////////////////////////////////////////////////////automation_Script/////////////////////////////////////////////////////////////////////////
var executeAutomationScript = function () {

    counter += 1;
    console.log("Counter is at: " + counter);
    try {
        driver = new webdriver.Driver();

        driver.get(URL).then(function () {
            driver.manage().window().maximize();
        });

        driver.wait(until.elementLocated(By.xpath("html/body/table/tbody/tr/td/iframe")), 10000).then(
            function (webElement) {
                //console.log("Element found...Switching to iframe");
                driver.switchTo().frame(0);
            },
            function (err) {
                console.log("Element not found, exiting..." + err.message);
                throw new Error("Element not found, exiting...");
            });

        driver.wait(until.elementLocated(By.xpath(".//*[@id='ctl00_ContentPlaceHolder1_Image9']")), 5000).then(
            function (webElement) {
                //console.log("Element found...");
                webElement.click();
            },
            function (err) {
                console.log("Element not found, exiting..." + err.message);
                throw new Error("Element not found, exiting...");
            });

        driver.wait(until.elementLocated(By.xpath(".//*[@id='ctl00_ContentPlaceHolder1_ddlzone']/option[4]")), 5000).then(
            function (webElement) {
                //console.log("Element found...");
                webElement.click();
            },
            function (err) {
                console.log("Element not found, exiting..." + err.message);
                throw new Error("Element not found, exiting...");
            });

        driver.wait(until.elementLocated(By.xpath(".//*[@id='ctl00_ContentPlaceHolder1_TextBox1']")), 5000).then(
            function (webElement) {
                //console.log("Element found...");
                webElement.sendKeys(RECEIPT_NO);
            },
            function (err) {
                console.log("Element not found, exiting..." + err.message);
                throw new Error("Element not found, exiting...");
            });

        driver.wait(until.elementLocated(By.xpath(".//*[@id='ctl00_ContentPlaceHolder1_btnsearch1']")), 5000).then(
            function (webElement) {
                //console.log("Element found...");
                webElement.click();
            },
            function (err) {
                console.log("Element not found, exiting..." + err.message);
                throw new Error("Element not found, exiting...");
            });

        driver.wait(until.elementLocated(By.xpath(".//*[@id='ctl00_ContentPlaceHolder1_lblStatus']")), 5000).then(
            function (element) {
                element.getInnerHtml().then(
                    function (html) {
                        console.log("Current Result: " + html.toString());
                        var current_result = html.toString();
                        eventEmitter.emit('result_changed', current_result);
                        eventEmitter.emit('kill_driver');
                    });
            },
            function (err) {
                console.log("Element not found, exiting..." + err.message);
                throw new Error("Element not found, exiting...");
            });
    } catch (err) {
        console.error("******ExecuteAutomationScript--->error: " + err.message);
    }
}

/////////////////////////////////////////////////////////////////////send_sms//////////////////////////////////////////////////////////////////////////////////////////
var sendSms = function (text) {

    console.log("Sending sms...");
    var timestamp = new Date().toLocaleString();
    twilio.sendMessage({

        to: '+919999980842',
        from: twilioCredentials.NUMBER,
        body: "- Counter: " + counter + "\nLast updated: " + timestamp + "\nStatus: " + text

    }, function (err, responseData) {
        if (!err) {
            //console.log(responseData.from);
            //console.log(responseData.body);
        } else {
            console.error(err.message);
        }
    });
}

//////////////////////////////////////////////////////////main_loop//////////////////////////////////////////////////////////////////////////////////////////////////////////////

//setup event_emitters
eventEmitter.on('result_changed', function (current_result) {
    checkPreviousResult(current_result);
});

eventEmitter.on('kill_driver', function () {
    console.log("Killing driver instance...");
    driver.quit().then(function () {
        console.log('killed.');
    }, function (err) {
        console.log('Could not kill.' + err.message);
        //throw new Error("Driver could not be killed.")
    });
    setTimeout(executeAutomationScript, 3 * 60 * 60 * 1000);
});

executeAutomationScript();

var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));

//For avoidong Heroku $PORT error
app.get('/', function (request, response) {
    var result = 'App is running'
    response.send(result);
}).listen(app.get('port'), function () {
    console.log('App is running, server is listening on port ', app.get('port'));
});

var http = require("http");
setInterval(function () {
    http.get("http://phantomjs-selenium.herokuapp.com");
}, 300000); // every 5 minutes (300000)