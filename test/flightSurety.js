
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

var balance = web3.utils.toWei("10", "ether");

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) FlightSuretyData has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(FlightSuretyApp) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(FlightSuretyApp) can access OperatingStatus`, async function () {

    // Ensure that access is allowed for Contract Owner account
    await config.flightSuretyData.setOperatingStatus(false);
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, false, "Access not restricted to Contract Owner");
});

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) firstAirline is registered on deployment.', async () => {
    
    // ARRANGE
    await config.flightSuretyApp.fundAirline({from: config.firstAirline, value: balance})
    let result = await config.flightSuretyData.isAirline.call(config.firstAirline); 

    // ASSERT
    assert.equal(result, true, "Airline should not be able to register another airline if it hasn't provided funding");

  });

  it('(airline) only existing airline may register a new airline until there are at least four airlines registered.', async () => {
    
    // ARRANGE
    await config.flightSuretyData.setOperatingStatus(true);
    
    let count1 = await config.flightSuretyData.returnAirlinesCount.call(); 
    assert(count1, 1, "Only one airline should be registered.")

    let secondAirline = accounts[2];
    try {
        await config.flightSuretyApp.registerAirline(secondAirline, { from: config.firstAirline }); 
        await config.flightSuretyApp.fundAirline({from: secondAirline, value: balance})
    }
    catch(e) {
        console.log(e);
    }
    
    // ASSERT
    let result = await config.flightSuretyData.isAirline.call(secondAirline); 
    assert(result, true, "Second airline should be registered.")

    let count2 = await config.flightSuretyData.returnAirlinesCount.call(); 
    assert(count1, 2, "Two airlines should be registered.")
  });

  it('(airline) register airline third and fourth with the seond registered airline.', async () => {
    
    // ARRANGE
    await config.flightSuretyData.setOperatingStatus(true);
    
    let secondAirline = accounts[2];
    let thirdAirline = accounts[3];
    let fourthAirline = accounts[4];
    try {
        await config.flightSuretyApp.registerAirline(thirdAirline, { from: secondAirline }); 
        await config.flightSuretyApp.fundAirline({from: thirdAirline, value: balance})
        await config.flightSuretyApp.registerAirline(fourthAirline, { from: secondAirline }); 
        await config.flightSuretyApp.fundAirline({from: fourthAirline, value: balance})
    }
    catch(e) {
        console.log(e);
    }
    
    // ASSERT
    let result1 = await config.flightSuretyData.isAirline.call(thirdAirline); 
    assert(result1, true, "Third airline should be registered.")

    let result2 = await config.flightSuretyData.isAirline.call(fourthAirline); 
    assert(result2, true, "Fourth airline should be registered.")

    let count = await config.flightSuretyData.returnAirlinesCount.call(); 
    assert(count, 4, "Four airlines should be registered.")
  
  });

  it('(airline) fifth regeistration should fail.', async () => {
    
    // ARRANGE
    await config.flightSuretyData.setOperatingStatus(true);
    
    let count1 = await config.flightSuretyData.returnAirlinesCount.call(); 
    assert(count1, 4, "Only one airline should be registered.")

    let fifthAirline = accounts[5];
    
    try {
        await config.flightSuretyApp.registerAirline(fifthAirline, { from: config.firstAirline }); 
    }
    catch(e) {
        console.log(e);
    }
    
    let count2 = await config.flightSuretyData.returnAirlinesCount.call(); 
    assert(count2, 4, "Fifth airline shouldn't be registered.")
  });

  it('(airline) fifth regeistration should succeed.', async () => {
    
    // ARRANGE
    await config.flightSuretyData.setOperatingStatus(true);
    
    let count1 = await config.flightSuretyData.returnAirlinesCount.call(); 
    assert(count1, 4, "Only one airline should be registered.")

    let secondAirline = accounts[2];
    let fifthAirline = accounts[5];
    
    try {
        await config.flightSuretyApp.registerAirline(fifthAirline, { from: secondAirline }); 
        await config.flightSuretyApp.fundAirline({from: fifthAirline, value: balance})
    }
    catch(e) {
        // console.log(e);
    }
    
    // ASSERT
    let result = await config.flightSuretyData.isAirline.call(fifthAirline); 
    assert(result, true, "Second airline should be registered.")

    let count2 = await config.flightSuretyData.returnAirlinesCount.call(); 
    assert(count2, 5, "Two airlines should be registered.")
  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let secondAirline = accounts[2];
    let newAirline = accounts[6];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
        await config.flightSuretyApp.registerAirline(newAirline, {from: secondAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isAirline.call(newAirline); 

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });
 
  it('(Passengers) cannot buy insurance for more than 1 ether', async () => {
    let user1 = accounts[7];
    
    let airline = config.firstAirline;
    let flightName = "Hello World";
    let timestamp = 100;
    let flag = true;

    try {
        await config.flightSuretyData.buy(airline, flightName, timestamp, {from: user1, value: 2, gasPrice: 0});
    } 
    catch(e) {
        flag = false;
    }

    assert.equal(flag, false, "Insurance buy should fail.")
  });

  it('(Passengers) check payout', async () => {
    let user1 = accounts[7];
    
    let airline = config.firstAirline;
    let flightName = "Hello World";
    let timestamp = 100;

    let insuranceAmount = web3.utils.toWei("1", "ether");
    
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
    balanceOfUser1BeforeTransaction = balanceOfUser1BeforeTransaction - insuranceAmount;
    try {
        await config.flightSuretyData.buy(airline, flightName, timestamp, {from: user1, value: 1, gasPrice: 0});
        await config.flightSuretyData.creditInsurees(airline, flightName, timestamp);
        await config.flightSuretyData.pay({from: user1});
    } 
    catch(e) {
        // console.log(e);
    }

    let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
    let value = Number(balanceOfUser1AfterTransaction) - Number(balanceOfUser1BeforeTransaction);
    // console.log(web3.utils.fromWei(value.toString(), 'ether'));
    let x = web3.utils.fromWei(value.toString(), 'ether');
    assert(x>0, "Balance should be positive.");
  });

  it('(Passengers) can register flight', async () => {
    let user1 = accounts[7];
    
    let airline = config.firstAirline;
    let flightName = "Udacity";
    let timestamp = 100;
    
    try {
        await config.flightSuretyApp.registerFlight(airline, flightName, timestamp);
    } 
    catch(e) {
        console.log(e);
    }

    let result = await config.flightSuretyApp.isFlightRegistered.call(airline, flightName, timestamp);
    assert.equal(result, true, "Flight should be registered.")
  });


});
