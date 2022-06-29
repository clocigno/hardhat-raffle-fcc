const { assert, expect } = require("chai")
const { getNamedAccounts, ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Staging Tests", function () {
          let raffle, chainId, entryFee, deployer

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              console.log("Deploying contracts")
              raffle = await ethers.getContract("Raffle", deployer)
              entryFee = await raffle.getEntryFee()
          })

          describe("fulfillRandomWords", function () {
              it("works with live Chainlink keepers and Chainlink VRF, we get a random winner", async function () {
                  const startingTimestamp = await raffle.getLatestTimestamp()
                  const accounts = await ethers.getSigners()
                  await new Promise(async (resolve, reject) => {
                      raffle.once("WinnerSelected", async () => {
                          console.log("WinnerSelected event fired!")
                          try {
                              const recentWinner = await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const winnerEndingBalance = await accounts[0].getBalance()
                              const endingTimestamp = await raffle.getLatestTimestamp()
                              await expect(raffle.getEntrant(0)).to.be.reverted
                              assert.equal(recentWinner.toString(), accounts[0].address)
                              assert.equal(raffleState.toString(), "0")
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance.add(entryFee).toString()
                              )
                              assert(endingTimestamp > startingTimestamp)
                              resolve()
                          } catch (e) {
                              reject(e)
                          }
                          resolve()
                      })
                      console.log("Entering Raffle...")
                      const tx = await raffle.enterRaffle({ value: entryFee })
                      await tx.wait(1)
                      console.log("Ok, time to wait...")
                      const winnerStartingBalance = await accounts[0].getBalance()
                  })
              })
          })
      })
