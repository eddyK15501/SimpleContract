const chai = require('chai');
const { utils } = require('ethers');
const { ethers } = require('hardhat');
const { solidity } = require('ethereum-waffle');

chai.use(solidity);
const { expect } = chai;

let simpleContract;

beforeEach(async () => {
  [account0, account1, account2, account3] = await ethers.getSigners();

  const SimpleContract = await ethers.getContractFactory("SimpleContract");
  simpleContract = await SimpleContract.deploy();
  await simpleContract.deployed();

  console.log("SimpleContract deployed to: ", simpleContract.address);
});

describe("sendMoney", () => {
  it('can send money to the smart contract', async () => {
    await simpleContract.connect(account0).sendMoney({value: utils.parseEther('1')});
    expect((await simpleContract.balanceReceived(account0.address)).totalBalance).to.eq(utils.parseEther('1'));
    expect((await simpleContract.balanceReceived(account0.address)).numPayments).to.eq(1);
  });
});

describe("getBalance", () => {
  it('can get the balance of the smart contract', async () => {
    await simpleContract.connect(account0).sendMoney({value: utils.parseEther('1')});
    await simpleContract.connect(account1).sendMoney({value: utils.parseEther('8')});
    await simpleContract.connect(account2).sendMoney({value: utils.parseEther('3')});
    await simpleContract.connect(account3).sendMoney({value: utils.parseEther('10')});
    expect(await simpleContract.getBalance()).to.eq(utils.parseEther('22'));
  });
});

describe("withdrawTo", () => {
  it('cannot withdraw more funds than was sent to the contract', async () => {
    await simpleContract.connect(account1).sendMoney({value: utils.parseEther('1')});
    await expect(simpleContract.connect(account1).withdrawTo(account0.address, utils.parseEther('1.1')))
      .to.be.revertedWith("not enough funds");
  });

  it('can withdraw to another address', async () => {
    await simpleContract.connect(account1).sendMoney({value: utils.parseEther('5')});
    await simpleContract.connect(account2).sendMoney({value: utils.parseEther('3')});
    expect(await simpleContract.getBalance()).to.eq(utils.parseEther('8'));
    expect((await simpleContract.balanceReceived(account1.address)).totalBalance).to.eq(utils.parseEther('5'));
    await simpleContract.connect(account1).withdrawTo(account3.address, utils.parseEther('5'));
    expect(await simpleContract.getBalance()).to.eq(utils.parseEther('3'));
    expect((await simpleContract.balanceReceived(account1.address)).totalBalance).to.eq(0);
  });
});

describe("withdrawMyAddress", () => {
  it('can withdraw all the money from the address of the msg.sender', async () => {
    await simpleContract.connect(account0).sendMoney({value: utils.parseEther('10')});
    expect((await simpleContract.balanceReceived(account0.address)).totalBalance).to.eq(utils.parseEther('10'));
    expect(await simpleContract.getBalance()).to.eq(utils.parseEther('10'));
    await simpleContract.connect(account0).withdrawMyAddress();
    expect((await simpleContract.balanceReceived(account0.address)).totalBalance).to.eq(0);
    expect(await simpleContract.getBalance()).to.eq(0);
  });
});