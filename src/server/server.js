import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';
import 'babel-polyfill';

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);



flightSuretyApp.events.OracleRequest({
    fromBlock: 0
  }, async function (error, event) {
    if (error) console.log(error)
    await handleRequest(flightSuretyApp, event.returnValues.airline, event.returnValues.flight, event.returnValues.timestamp);
});

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;

async function handleRequest(flightSuretyApp, airline, flight, timestamp) {
  const accounts = await web3.eth.getAccounts();
  for(let a=1; a<=20; a++) {
    let oracleIndexes = await flightSuretyApp.methods.getMyIndexes().call({from: accounts[a], gas: 99999999});
    for(let idx=0;idx<3;idx++) {
      try {
        // Submit a response...it will only be accepted if there is an Index match
        await flightSuretyApp.methods.submitOracleResponse(oracleIndexes[idx], airline, flight, timestamp, 10).send({ from: accounts[a], gas: 99999999 });
      }
      catch(e) {
        // Enable this when debugging
      }
    }
  }
}

(async() => {
  let config = Config['localhost'];
  let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
  web3.eth.defaultAccount = web3.eth.accounts[0];
  let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
  const accounts = await web3.eth.getAccounts();

  var fee = web3.utils.toWei("1", "ether");
  console.log("Starting registration");

  for(let a=1; a<=20; a++) {      
    try {
      await flightSuretyApp.methods.registerOracle().send({ from: accounts[a], value: fee, gas: 99999999 });
      let result = await flightSuretyApp.methods.getMyIndexes().call({from: accounts[a], gas: 99999999});
      console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
    } catch (error) {
      console.log(error);
    }  
  }
})();