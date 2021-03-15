pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false
    mapping(address => bool) private authorizedCallers; 
    
    struct Airlines {
        int airlineCount;
        mapping(address => int) airlineList;
        mapping(address => uint256) airlineMoney;
    }
    Airlines private airlines;

    struct Insuree {
        address insuree;
        uint256 amount;
    }
    mapping(bytes32 => Insuree[]) insurees;

    mapping(address => uint256) payouts;

    uint256 totalFund;
 
    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                    address firstAirline
                                ) 
                                public 
    {
        contractOwner = msg.sender;

        airlines = Airlines(1);
        airlines.airlineList[firstAirline] = 1;
        airlines.airlineMoney[firstAirline] = 10;

        totalFund = 10;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus
                            (
                                bool mode
                            ) 
                            external
                            requireContractOwner 
    {
        operational = mode;
    }

    function authorizeCaller(address callerAddress) external requireContractOwner {
        authorizedCallers[callerAddress] = true;
    }


    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline
                            (
                                address newAirline,
                                address oldAirline
                            )
                            public
                            requireIsOperational
                            returns(bool)
    {
        require(isAirline(oldAirline), "New airline can only be registered by a registered airline.");
        require(!isAirline(newAirline), "New airline already registered.");
        airlines.airlineList[newAirline] = 1;
        airlines.airlineCount++;
        return true;
    }

    function fundAirline(address airline, uint256 amount) public payable {
        totalFund = totalFund.add(amount);
        airlines.airlineMoney[airline] = airlines.airlineMoney[airline].add(amount);
    }

    function isAirline(address airline) public view returns(bool) {
        return ((airlines.airlineList[airline] == 1) && (airlines.airlineMoney[airline] >= 10));
    }

    function returnAirlinesCount() public view returns(int) {
        return airlines.airlineCount;
    }

   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy
                            (      
                                address airline,
                                string flight,
                                uint256 timestamp
                            )
                            external
                            payable
    {
        bytes32 flightKey = keccak256(abi.encodePacked(airline, flight, timestamp));
        require(msg.value <= 1, "Insurance amount cannot surpass 1 eth.");
        insurees[flightKey].push(Insuree(msg.sender, msg.value));
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                    address airline,
                                    string flight,
                                    uint256 timestamp
                                )
                                external
    {
        bytes32 flightKey = keccak256(abi.encodePacked(airline, flight, timestamp));
        uint256 payoutAmt = 0;

        for (uint256 i = 0; i < insurees[flightKey].length; i++) {
            payoutAmt = payoutAmt.add(insurees[flightKey][i].amount);
            payouts[insurees[flightKey][i].insuree] = payouts[insurees[flightKey][i].insuree].add((3 * insurees[flightKey][i].amount)/2);
        }
        totalFund = totalFund.sub((3 * payoutAmt)/2);
        
        delete insurees[flightKey];
        // Insuree[] storage emptyList;
        // insurees[flightKey] = emptyList;
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                            )
                            external
    {
        uint256 amt = payouts[msg.sender];
        payouts[msg.sender] = payouts[msg.sender].sub(amt);
        msg.sender.transfer(amt);
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund
                            (   
                            )
                            public
                            payable
    {
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() 
                            external 
                            payable 
    {
        fund();
    }


}

