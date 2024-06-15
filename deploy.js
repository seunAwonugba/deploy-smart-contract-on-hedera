const dotenv = require("dotenv");
dotenv.config();
const simpleStorage = require("./SimpleStorage.json");
const {
    FileCreateTransaction,
    Client,
    Hbar,
    ContractCreateTransaction,
    ContractFunctionParameters,
    ContractCallQuery,
    ContractExecuteTransaction,
} = require("@hashgraph/sdk");
const { HEDERA_ACCOUNT_ID, HEDERA_PRIVATE_KEY } = process.env;

async function deploySimpleStorage() {
    if (!HEDERA_ACCOUNT_ID || !HEDERA_PRIVATE_KEY) {
        throw new Error("Invalid hedera credentials");
    }

    //Create your Hedera Testnet client
    const client = Client.forTestnet();

    client.setOperator(HEDERA_ACCOUNT_ID, HEDERA_PRIVATE_KEY);

    client.setDefaultMaxTransactionFee(new Hbar(100));

    client.setDefaultMaxQueryPayment(new Hbar(50));

    const bytecode = simpleStorage.bytecode;

    //Create a file on Hedera and store the hex-encoded bytecode
    const fileCreateTx = new FileCreateTransaction().setContents(bytecode);

    //submit file to hedera
    const submitTx = await fileCreateTx.execute(client);

    //Get the receipt of the file create transaction
    const fileReceipt = await submitTx.getReceipt(client);

    //Get the file ID from the receipt
    const bytecodeFileId = fileReceipt.fileId;

    console.log("The smart contract byte code file ID is " + bytecodeFileId);

    // Instantiate the contract instance
    const contractTx = await new ContractCreateTransaction()
        .setBytecodeFileId(bytecodeFileId)
        .setGas(100000);

    //Submit the transaction to the Hedera test network
    const contractResponse = await contractTx.execute(client);

    //Get the receipt of the file create transaction

    const contractReceipt = await contractResponse.getReceipt(client);

    //Get the smart contract ID
    const newContractId = contractReceipt.contractId;

    //Log the smart contract ID
    console.log("The smart contract ID is " + newContractId);

    const contractAddress = newContractId.toSolidityAddress();

    console.log(`Contract address ${contractAddress}`);

    //At this point contract is deployed, start interacting with it
    // const contractQuery = await new ContractCallQuery()
    //     .setGas(100000)
    //     .setContractId(newContractId)
    //     .setFunction("store")
    //     .setQueryPayment(new Hbar(2));

    const contractExecTx = await new ContractExecuteTransaction()
        .setContractId(newContractId)
        .setGas(100000)
        .setFunction("store", new ContractFunctionParameters().addUint256(27));

    //Submit the transaction to a Hedera network and store the response
    const submitExecTx = await contractExecTx.execute(client);

    const storeReceipt = await submitExecTx.getReceipt(client);

    console.log("The transaction status is " + storeReceipt.status.toString());

    const contractCallQuery = new ContractCallQuery()
        .setContractId(newContractId)
        .setGas(100000)
        .setFunction("getter")
        .setQueryPayment(new Hbar(2));

    //Submit the transaction to a Hedera network

    const submitStoreExecTx = await contractCallQuery.execute(client);
    const getStore = submitStoreExecTx.getUint256(0);

    console.log("The updated contract message: " + getStore);
}

deploySimpleStorage();
