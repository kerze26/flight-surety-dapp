var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "belt drip van person cream truth tape balcony awkward ceiling arrange repeat";

module.exports = {
  networks: {
    // development: {
    //   provider: function() {
    //     return new HDWalletProvider(mnemonic, "http://127.0.0.1:7545/", 0, 50);
    //   },
    //   network_id: '5777',
    //   gas: 9999999
    // }
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
      gas: 99999999
      // gas: 6721975
    },
  },
  compilers: {
    solc: {
      version: "^0.4.25"
    }
  }
};