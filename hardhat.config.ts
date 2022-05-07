import 'dotenv/config';
import {HardhatUserConfig} from 'hardhat/types';
import 'hardhat-deploy';
import '@nomiclabs/hardhat-ethers';
import 'hardhat-gas-reporter';
import '@typechain/hardhat';
import 'solidity-coverage';
import 'hardhat-deploy-tenderly';
import {node_url, accounts, addForkConfiguration} from './utils/network';
import {extendEnvironment} from "hardhat/config";
import {DeterministicDeploymentInfo} from "hardhat-deploy/dist/types";
import {neonPrivateKeys} from './neon.private.keys'

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.9',
        settings: {
          optimizer: {
            enabled: true,
            runs: 2000,
          },
        },
      },
    ],
  },
  namedAccounts: {
    deployer: 0,
    simpleERC20Beneficiary: 0,
  },
  networks: addForkConfiguration({
    hardhat: {
      initialBaseFeePerGas: 0, // to fix : https://github.com/sc-forks/solidity-coverage/issues/652, see https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136
    },
    localhost: {
      url: node_url('localhost'),
      accounts: accounts(),
    },
    staging: {
      url: node_url('rinkeby'),
      accounts: accounts('rinkeby'),
    },
    production: {
      url: node_url('mainnet'),
      accounts: accounts('mainnet'),
    },
    mainnet: {
      url: node_url('mainnet'),
      accounts: accounts('mainnet'),
    },
    rinkeby: {
      url: node_url('rinkeby'),
      accounts: accounts('rinkeby'),
    },
    kovan: {
      url: node_url('kovan'),
      accounts: accounts('kovan'),
    },
    goerli: {
      url: node_url('goerli'),
      accounts: accounts('goerli'),
    },
    neonLocal: {
      url: 'http://127.0.0.1:9090/solana',
      timeout: 10000000,
      accounts: neonPrivateKeys,
    },
    neonDevnet: {
      url: 'https://proxy.devnet.neonlabs.org/solana',
      timeout: 10000000,
      accounts: neonPrivateKeys,
    }
  }),
  paths: {
    sources: 'src',
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 100,
    enabled: process.env.REPORT_GAS ? true : false,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    maxMethodDiff: 10,
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },
  mocha: {
    timeout: 1000000000
  },
  external: process.env.HARDHAT_FORK
    ? {
        deployments: {
          // process.env.HARDHAT_FORK will specify the network that the fork is made from.
          // these lines allow it to fetch the deployments from the network being forked from both for node and deploy task
          hardhat: ['deployments/' + process.env.HARDHAT_FORK],
          localhost: ['deployments/' + process.env.HARDHAT_FORK],
        },
      }
    : undefined,

  tenderly: {
    project: 'template-ethereum-contracts',
    username: process.env.TENDERLY_USERNAME as string,
  },
};

extendEnvironment(async(hre) => {
  const isNeonNetwork = (): boolean => {
    return ['neonLocal', 'neonDevnet'].includes(hre.network.name);
  }

  let snapshot = 0
  const originalSend = hre.network.provider.send
  hre.network.provider.send = async (method: string, params: Array<any>): Promise<any> => {
    if (isNeonNetwork()) {
      if (method == 'evm_snapshot') {
        snapshot += 1;
        return snapshot;
      } else if (method == 'evm_revert') {
        return true;
      }
    }

    return originalSend.call(this, method, params);
  }

  hre.config.deterministicDeployment = (): DeterministicDeploymentInfo | undefined => {
    if (isNeonNetwork()) {
      return {
        factory: '',
        deployer: '',
        signedTx: '',
        funding: '10000000000000000' + '000'
      }
    }

    return undefined;
  }
})

export default config;
