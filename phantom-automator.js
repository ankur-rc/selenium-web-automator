/**
@author: Ankur Roy Chowdhury
**/

/////////////////////////////////////////////////////////////////////initialisation//////////////////////////////////////////////////////////////////////////////////////////////

//constants
const URL = 'http://www.delhi.gov.in/wps/wcm/connect/doit_transport/Transport/Home/Driving+Licence/Online+Appointment+and+Payment+for+Driving+License';
const RECEIPT_NO = "HS-6837";

//config
var twilioCredentials = require("./my-config").TwilioCredentials;

const EventEmitter = require('events');
const util = require('util');

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

var executeAutomationScript = function () {

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
        });

    driver.wait(until.elementLocated(By.xpath(".//*[@id='ctl00_ContentPlaceHolder1_Image9']")), 5000).then(
        function (webElement) {
            //console.log("Element found...");
            webElement.click();
        },
        function (err) {
            console.log("Element not found, exiting..." + err.message);
        });

    driver.wait(until.elementLocated(By.xpath(".//*[@id='ctl00_ContentPlaceHolder1_ddlzone']/option[4]")), 5000).then(
        function (webElement) {
            //console.log("Element found...");
            webElement.click();
        },
        function (err) {
            console.log("Element not found, exiting..." + err.message);
        });

    driver.wait(until.elementLocated(By.xpath(".//*[@id='ctl00_ContentPlaceHolder1_TextBox1']")), 5000).then(
        function (webElement) {
            //console.log("Element found...");
            webElement.sendKeys(RECEIPT_NO);
        },
        function (err) {
            console.log("Element not found, exiting..." + err.message);
        });

    driver.wait(until.elementLocated(By.xpath(".//*[@id='ctl00_ContentPlaceHolder1_btnsearch1']")), 5000).then(
        function (webElement) {
            //console.log("Element found...");
            webElement.click();
        },
        function (err) {
            console.log("Element not found, exiting..." + err.message);
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
        });
}

var sendSms = function (text) {

    console.log("Sending sms...");
    var timestamp = new Date().toUTCString();
    twilio.sendMessage({

        to: '+919999980842',
        from: twilioCredentials.NUMBER,
        body: "****" + "\n\nLast updated: " + timestamp + "\nStatus: " + text

    }, function (err, responseData) {
        if (!err) {
            //console.log(responseData.from);
            //console.log(responseData.body);
        } else {
            console.log(err.message);
        }
    });
}

//////////////////////////////////////////////////////////main_loop//////////////////////////////////////////////////////////////////////////////////////////////////////////////

//setup event_emitters
eventEmitter.on('result_changed', function (current_result) {
    if (result !== current_result) {
        result = current_result;
        sendSms(result); //send sms 
    }
});

eventEmitter.on('kill_driver', function () {
    console.log("Killing driver instance...");
    driver.quit();
    setInterval(executeAutomationScript, 3600000);
});

executeAutomationScript();

var http = require('http');

http.createServer(function (request, response) {
    console.log("Server created....");
}).listen(process.env.PORT || 5000);