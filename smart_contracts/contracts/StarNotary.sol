pragma solidity ^0.4.23;

import 'openzeppelin-solidity/contracts/token/ERC721/ERC721.sol';

contract StarNotary is ERC721 { 

    struct Star { 
        string name;
        string deg;
        string mag;
        string cent;
        string story;
    }

    mapping(uint256 => Star) public tokenIdToStarInfo; 
    mapping(uint256 => uint256) public starsForSale;
    mapping(string => bool) coordinates;

    function createStar(string _name, string _deg, string _mag, string _cent, string _story, uint256 _tokenId) public { 
        string memory coords = coordinatesToString(_deg, _mag, _cent);
        require(!coordinates[coords], "a star with this coordinates already exists");

        Star memory newStar = Star(_name, _deg, _mag, _cent, _story);
        tokenIdToStarInfo[_tokenId] = newStar;
        coordinates[coords] = true;

        _mint(msg.sender, _tokenId);
    }

    function putStarUpForSale(uint256 _tokenId, uint256 _price) public {
        require(this.ownerOf(_tokenId) == msg.sender, "only owner can put up a star for sale");
        starsForSale[_tokenId] = _price;
    }

    function buyStar(uint256 _tokenId) public payable {
        require(starsForSale[_tokenId] > 0, "that star is not for sale");

        uint256 starCost = starsForSale[_tokenId];
        address currentOwner = this.ownerOf(_tokenId);

        require(msg.value >= starCost, "you do not have sufficient funds");

        _removeTokenFrom(currentOwner, _tokenId);
        _addTokenTo(msg.sender, _tokenId);

        currentOwner.transfer(starCost);

        if (msg.value > starCost) {
            msg.sender.transfer(msg.value - starCost);
        }
    }

    function checkIfStarExist(string _deg, string _mag, string _cent) public returns(bool) {
        return coordinates[coordinatesToString(_deg, _mag, _cent)];
    }

























    function coordinatesToString(string _cent, string _deg, string _mag) internal returns(string) {
        return strConcat(_cent, "_", _deg, "_", _mag);
    }

    // string concatenation taken from https://ethereum.stackexchange.com/questions/729/how-to-concatenate-strings-in-solidity
    function strConcat(string _a, string _b, string _c, string _d, string _e) internal returns (string){
        bytes memory _ba = bytes(_a);
        bytes memory _bb = bytes(_b);
        bytes memory _bc = bytes(_c);
        bytes memory _bd = bytes(_d);
        bytes memory _be = bytes(_e);
        string memory abcde = new string(_ba.length + _bb.length + _bc.length + _bd.length + _be.length);
        bytes memory babcde = bytes(abcde);
        uint k = 0;
        for (uint i = 0; i < _ba.length; i++) babcde[k++] = _ba[i];
        for (i = 0; i < _bb.length; i++) babcde[k++] = _bb[i];
        for (i = 0; i < _bc.length; i++) babcde[k++] = _bc[i];
        for (i = 0; i < _bd.length; i++) babcde[k++] = _bd[i];
        for (i = 0; i < _be.length; i++) babcde[k++] = _be[i];
        return string(babcde);
    }
}