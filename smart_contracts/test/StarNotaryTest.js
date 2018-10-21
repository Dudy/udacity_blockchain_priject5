const StarNotary = artifacts.require('StarNotary')

contract('StarNotary', accounts => { 
    var defaultAccount = accounts[0];
    var user1 = accounts[1];
    var user2 = accounts[2];
    var operator = accounts[3];

    beforeEach(async function() { 
        this.contract = await StarNotary.new({from: defaultAccount})
    })
    
    describe('star creation', () => {
        it('can create two stars with different coordinates and get their names', async function() {
            let starName1 = "Antares 1";
            let deg1 = "deg1";
            let mag1 = "mag1";
            let cent1 = "cent1";
            let story1 = "story1";
            let tokenId1 = 1;

            let starName2 = "Antares 2";
            let deg2 = "deg2";
            let mag2 = "mag2";
            let cent2 = "cent2";
            let story2 = "story2";
            let tokenId2 = 2;

            await this.contract.createStar(starName1, deg1, mag1, cent1, story1, tokenId1, {from: user1});
            await this.contract.createStar(starName2, deg2, mag2, cent2, story2, tokenId2, {from: user2});

            var starInfo1 = await this.contract.tokenIdToStarInfo(tokenId1);
            var starInfo2 = await this.contract.tokenIdToStarInfo(tokenId2);
            assert.equal(starInfo1[0], starName1);
            assert.equal(starInfo2[0], starName2);
        });

        it('cannot create two stars the same coordinates', async function() {
            let starName1 = "Antares 1";
            let deg1 = "deg1";
            let mag1 = "mag1";
            let cent1 = "cent1";
            let story1 = "story1";
            let tokenId1 = 1;

            let starName2 = "Antares 2";
            let deg2 = deg1;
            let mag2 = mag1;
            let cent2 = cent1;
            let story2 = "story2";
            let tokenId2 = 2;

            await this.contract.createStar(starName1, deg1, mag1, cent1, story1, tokenId1, {from: user1});
            await expectThrow(this.contract.createStar(starName2, deg2, mag2, cent2, story2, tokenId2, {from: user2}));
        });
    });

    describe('buying and selling stars', () => {
        let starName = "Antares 1";
        let deg = "deg1";
        let mag = "mag1";
        let cent = "cent1";
        let story = "story1";
        let tokenId = 1;
        let starPrice = web3.toWei(.01, "ether");

        beforeEach(async function() {
            await this.contract.createStar(starName, deg, mag, cent, story, tokenId, {from: user1});
        });

        describe('user1 can sell a star', () => {
            it('user1 can put up their star for sale', async function() {
                await this.contract.putStarUpForSale(tokenId, starPrice, {from: user1});
                assert.equal(await this.contract.starsForSale(tokenId), starPrice);
            });

            it('user1 gets the funds after selling a star', async function() {
                await this.contract.putStarUpForSale(tokenId, starPrice, {from: user1});
                const balanceBefore = web3.eth.getBalance(user1);
                await this.contract.buyStar(tokenId, {from: user2, value: starPrice});
                const balanceAfter = web3.eth.getBalance(user1);
                assert.equal(balanceBefore.add(starPrice).toNumber(), balanceAfter.toNumber()); 
            });
        });

        describe('user2 can buy a star that was put up for sale', () => {
            beforeEach(async function () { 
                await this.contract.putStarUpForSale(tokenId, starPrice, {from: user1})
            });

            it('user2 is the owner of the star after they buy it', async function() {
                await this.contract.buyStar(tokenId, {from: user2, value: starPrice});
                assert.equal(await this.contract.ownerOf(tokenId), user2);
            });

            it('user2 correctly has their balance changed', async function() {
                let overpaidAmount = web3.toWei(.05, "ether");
                const balanceBefore = web3.eth.getBalance(user2);
                await this.contract.buyStar(tokenId, {from: user2, value: overpaidAmount, gasPrice:0});
                const balanceAfter = web3.eth.getBalance(user2);
                assert.equal(balanceBefore.sub(balanceAfter), starPrice);
            });
        });
    });

    describe('check star existance', () => {
        let starName = "Antares 1";
        let deg = "deg1";
        let mag = "mag1";
        let cent = "cent1";
        let story = "story1";
        let tokenId = 1;

        let differentDeg = "deg2";
        let differentMag = "mag2";
        let differentCent = "cent2";

        beforeEach(async function() {
            await this.contract.createStar(starName, deg, mag, cent, story, tokenId, {from: user1});
        });

        it('star exists', async function() {
            assert.equal(await this.contract.checkIfStarExist.call(deg, mag, cent), true);
            assert.equal(await this.contract.checkIfStarExist.call(differentDeg, mag, cent), false);
            assert.equal(await this.contract.checkIfStarExist.call(deg, differentMag, cent), false);
            assert.equal(await this.contract.checkIfStarExist.call(deg, mag, differentCent), false);
        });
    });

    describe('can mint a token', () => {
        let tokenId = 1;
        let tx;

        beforeEach(async function() {
            tx = await this.contract.mint(tokenId, {from: user1});
        });

        it('ownerOf tokenId is user1', async function() {
            assert.equal(await this.contract.ownerOf(tokenId), user1);
        });

        it('balanceOf user1 is incremented by 1', async function() {
            let balance = await this.contract.balanceOf(user1);
            assert.equal(balance.toNumber(), 1);
        });

        it('emits the correct event during creation of a new token', async function() {
            assert.equal(tx.logs[0].event, 'Transfer');
        });
    });
})

var expectThrow = async function(promise) {
    try {
        await promise;
    } catch (error) {
        assert.exists(error);
        return;
    }

    assert.fail('expected an error but did not see any');
};
