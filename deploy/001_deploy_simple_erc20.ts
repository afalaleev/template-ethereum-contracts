import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {parseEther} from 'ethers/lib/utils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy, diamond} = deployments;

  const {deployer, simpleERC20Beneficiary} = await getNamedAccounts();

  await diamond.deploy('SimpleERC20Diamond', {
    from: deployer,
    facets: ['SimpleERC20'],
    log: true,
  });
};
export default func;
func.tags = ['SimpleERC20'];
