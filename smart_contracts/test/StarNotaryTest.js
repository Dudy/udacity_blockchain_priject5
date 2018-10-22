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
            let dec1 = "dec1";
            let mag1 = "mag1";
            let cent1 = "cent1";
            let story1 = "story1";
            let tokenId1 = 1;

            let starName2 = "Antares 2";
            let dec2 = "dec2";
            let mag2 = "mag2";
            let cent2 = "cent2";
            let story2 = "story2";
            let tokenId2 = 2;

            await this.contract.createStar(starName1, dec1, mag1, cent1, story1, tokenId1, {from: user1});
            await this.contract.createStar(starName2, dec2, mag2, cent2, story2, tokenId2, {from: user2});

            var starInfo1 = await this.contract.tokenIdToStarInfo(tokenId1);
            var starInfo2 = await this.contract.tokenIdToStarInfo(tokenId2);
            assert.equal(starInfo1[0], starName1);
            assert.equal(starInfo2[0], starName2);
        });

        it('cannot create two stars the same coordinates', async function() {
            let starName1 = "Antares 1";
            let dec1 = "dec1";
            let mag1 = "mag1";
            let cent1 = "cent1";
            let story1 = "story1";
            let tokenId1 = 1;

            let starName2 = "Antares 2";
            let dec2 = dec1;
            let mag2 = mag1;
            let cent2 = cent1;
            let story2 = "story2";
            let tokenId2 = 2;

            await this.contract.createStar(starName1, dec1, mag1, cent1, story1, tokenId1, {from: user1});
            await expectThrow(this.contract.createStar(starName2, dec2, mag2, cent2, story2, tokenId2, {from: user2}));
        });

        it('weird test in requirements', async function() {
            let starName1 = "Star power 103!";
            let dec1 = "I love my wonderful star";
            let mag1 = "ra_032.155";
            let cent1 = "dec_121.874";
            let story1 = "mag_245.978";
            let tokenId1 = 1;

            await this.contract.createStar(starName1, dec1, mag1, cent1, story1, tokenId1, {from: user1});

            var starInfo1 = await this.contract.tokenIdToStarInfo(tokenId1);
            assert.equal(starInfo1[0], starName1);
            assert.equal(starInfo1[1], dec1);
            assert.equal(starInfo1[2], mag1);
            assert.equal(starInfo1[3], cent1);
            assert.equal(starInfo1[4], story1);
        });
    });

    describe('buying and selling stars', () => {
        let starName = "Antares 1";
        let dec = "dec1";
        let mag = "mag1";
        let cent = "cent1";
        let story = "story1";
        let tokenId = 1;
        let starPrice = web3.toWei(.01, "ether");

        beforeEach(async function() {
            await this.contract.createStar(starName, dec, mag, cent, story, tokenId, {from: user1});
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
        let dec = "dec1";
        let mag = "mag1";
        let cent = "cent1";
        let story = "story1";
        let tokenId = 1;

        let differentDec = "dec2";
        let differentMag = "mag2";
        let differentCent = "cent2";

        beforeEach(async function() {
            await this.contract.createStar(starName, dec, mag, cent, story, tokenId, {from: user1});
        });

        it('star exists', async function() {
            assert.equal(await this.contract.checkIfStarExist.call(dec, mag, cent), true);
            assert.equal(await this.contract.checkIfStarExist.call(differentDec, mag, cent), false);
            assert.equal(await this.contract.checkIfStarExist.call(dec, differentMag, cent), false);
            assert.equal(await this.contract.checkIfStarExist.call(dec, mag, differentCent), false);
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

    describe('can grant approval to transfer', () => {
        let tokenId = 1;
        let tx;

        beforeEach(async function() {
            await this.contract.mint(tokenId, {from: user1});
            tx = await this.contract.approve(user2, tokenId, {from: user1});
        });

        it('set user2 as an approved address', async function() {
            assert.equal(await this.contract.getApproved(tokenId), user2);
        });

        it('user2 can now transfer', async function() {
            await this.contract.safeTransferFrom(user1, user2, tokenId, {from: user2});
            assert.equal(await this.contract.ownerOf(tokenId), user2);
        });

        it('emits the correct event', async function() {
            assert.equal(tx.logs[0].event, 'Approval');
            assert.equal(tx.logs[0].args.owner, user1);
            assert.equal(tx.logs[0].args.approved, user2);
            assert.equal(tx.logs[0].args.tokenId, tokenId);
        });
    });

    describe('can set an operator', () => {
        let tokenId = 1;
        let tx;

        beforeEach(async function() {
            await this.contract.mint(tokenId, {from: user1});
            tx = await this.contract.SetApprovalForAll(operator, true, {from: user1});
        });

        it('can set an operator', async function() {
            assert.equal(await this.contract.isApprovedForAll(user1, operator), true);
        });

        it('operator can now transfer', async function() {
            await this.contract.transferFrom(user1, user2, tokenId, {from: operator});
            assert.equal(await this.contract.ownerOf(tokenId), user2);
        });

        it('emits the correct event', async function() {
            assert.equal(tx.logs[0].event, 'ApprovalForAll');
            assert.equal(tx.logs[0].args.owner, user1);
            assert.equal(tx.logs[0].args.operator, operator);
            assert.equal(tx.logs[0].args.approved, true);
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
