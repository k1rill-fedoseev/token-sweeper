require('dotenv').config()
const Web3 = require('web3')
const axios = require('axios')

const { RPC_URL, PRIVATE_KEY, BLOCKSCOUT_BASE_API, SKIP_DRY_RUN, RECEIVER, MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS } = process.env
const GAS_LIMIT = parseInt(process.env.GAS_LIMIT, 10) || 500000

const web3 = new Web3(RPC_URL)
const account = web3.eth.accounts.wallet.add(PRIVATE_KEY)

const abi = [{
  "inputs": [
    {
      "internalType": "address",
      "name": "recipient",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "amount",
      "type": "uint256"
    }
  ],
  "name": "transfer",
  "outputs": [
    {
      "internalType": "bool",
      "name": "",
      "type": "bool"
    }
  ],
  "stateMutability": "nonpayable",
  "type": "function"
}]

async function main() {
  console.log(`Sender: ${account.address}`)
  console.log(`Receiver: ${RECEIVER}`)
  const result = await axios.get(`${BLOCKSCOUT_BASE_API}?module=account&action=tokenlist&address=${account.address}`)
  const tokens = result.data.result.filter(t => t.type === 'ERC-20')

  console.log(`Sweeping ${tokens.length} ERC-20 tokens`)

  let nonce = await web3.eth.getTransactionCount(account.address)

  console.log(`Starting nonce: ${nonce}`)

  for (let token of tokens) {
    console.log(`Sweeping token ${token.balance} ${token.name} (${token.symbol}) to ${RECEIVER}`)

    const contract = new web3.eth.Contract(abi, token.contractAddress)
    const data = contract.methods.transfer(RECEIVER, token.balance).encodeABI()
    const tx = {
      from: account.address,
      to: token.contractAddress,
      data,
      nonce: nonce++,
      gas: GAS_LIMIT,
      maxFeePerGas: MAX_FEE_PER_GAS,
      maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS
    }
    const raw = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    if (SKIP_DRY_RUN === 'true') {
      await new Promise((res, rej) => {
        web3.eth.sendSignedTransaction(raw.rawTransaction, (error, hash) => {
          if (error) {
            rej(error)
          } else {
            console.log(`Tx hash: ${hash}`)
            res(hash)
          }
        })
      })
    } else {
      try {
        const gas = await web3.eth.estimateGas(tx)
        console.log(`Estimated gas: ${gas}`)
      } catch (e) {
        console.log(`Failed to estimate gas: ${e.message}`)
      }
    }
  }
}

main()
