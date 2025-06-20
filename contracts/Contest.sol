pragma solidity 0.5.16;

contract Contest{
	
	struct Contestant{
		uint id;
		string name;
		uint voteCount;
		string party;
		uint age;
		string qualification;
		bool exists;
	}

	struct Voter{
		bool hasVoted;
		uint vote;
		bool isRegistered;
	}

	address public admin;
	mapping(uint => Contestant) public contestants; 
	mapping(string => bool) private candidateExists; // Track candidates by name + party
	mapping(address => Voter) public voters;
	uint public contestantsCount;
	// uint public counter;
	enum PHASE{reg, voting , done}
	PHASE public state;

	event PhaseChanged(PHASE newPhase);
	event ContestantAdded(uint id, string name, string party);
	event VoteCast(address voter, uint contestantId);

	modifier onlyAdmin(){
		require(msg.sender==admin);
		_;
	}
	
	modifier validState(PHASE x){
	    require(state==x);
	    _;
	}

	constructor() public{
		admin=msg.sender;
        state=PHASE.reg;
		// counter = 0;

	}

    function changeState(uint nextPhase) public onlyAdmin {
        require(nextPhase <= uint(PHASE.done), "Invalid phase");
        require(nextPhase == uint(state) + 1, "Can only move to next phase");
        state = PHASE(nextPhase);
        emit PhaseChanged(PHASE(nextPhase));
    }

	function generateKey(string memory _name, string memory _party) private pure returns (string memory) {
		return string(abi.encodePacked(_name, "_", _party));
	}

	function addContestant(string memory _name , string memory _party , uint _age , string memory _qualification) public onlyAdmin validState(PHASE.reg){
		// Check if candidate with same name and party already exists
		string memory key = generateKey(_name, _party);
		require(!candidateExists[key], "Candidate with this name and party already exists");
		
		contestantsCount++;
		contestants[contestantsCount]=Contestant(contestantsCount,_name,0,_party,_age,_qualification,true);
		candidateExists[key] = true;
		emit ContestantAdded(contestantsCount, _name, _party);
	}

	function removeContestant(uint _contestantId) public onlyAdmin validState(PHASE.reg) {
		require(_contestantId > 0 && _contestantId <= contestantsCount, "Invalid contestant ID");
		require(contestants[_contestantId].exists, "Contestant does not exist");
		
		// Remove candidate exists flag
		string memory key = generateKey(
			contestants[_contestantId].name,
			contestants[_contestantId].party
		);
		candidateExists[key] = false;
		
		// Mark contestant as removed
		contestants[_contestantId].exists = false;
	}

	function voterRegisteration(address user) public onlyAdmin validState(PHASE.reg){
		voters[user].isRegistered=true;
	}

	function vote(uint _contestantId) public validState(PHASE.voting){
        
		require(voters[msg.sender].isRegistered);
		require(!voters[msg.sender].hasVoted);
        require(_contestantId > 0 && _contestantId<=contestantsCount);
		require(contestants[_contestantId].exists, "This contestant has been removed");
		contestants[_contestantId].voteCount++;
		voters[msg.sender].hasVoted=true;
		voters[msg.sender].vote=_contestantId;
		emit VoteCast(msg.sender, _contestantId);
	}

	function isElectionOver() public view returns (bool) {
		return state == PHASE.done;
	}
}