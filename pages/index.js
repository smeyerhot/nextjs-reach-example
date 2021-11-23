import Head from 'next/head'
import React, { useState, useEffect, useRef } from 'react';
import AppViews from '../components/AppViews';
import DeployerViews from '../components/DeployerViews';
import AttacherViews from '../components/AttacherViews';
import {renderView} from '../components/render';
// import './index.css';
import * as backend from '../build/index.main.js';
import {loadStdlib} from '@reach-sh/stdlib';
import dynamic from "next/dynamic"
// const MyAlgoConnect = dynamic(() => import('@reach-sh/stdlib/ALGO_MyAlgoConnect'), {
//   ssr: false
// });

import MyAlgoConnect from '@reach-sh/stdlib/ALGO_MyAlgoConnect'

export default function Home() {
  // let reach = useRef('')
  const [view, setView] = useState('Hello')
  const reach = loadStdlib({
    REACH_CONNECTOR_MODE: process.env.NEXT_PUBLIC_REACH_CONNECTOR_MODE,
  });
  useEffect(() => {
    reach.setWalletFallback(reach.walletFallback({
      providerEnv: 'TestNet', MyAlgoConnect 
    }));
    setView("Goodbye")
  },[])
  console.log(reach)

  const handToInt = {'ROCK': 0, 'PAPER': 1, 'SCISSORS': 2};
  const intToOutcome = ['Bob wins!', 'Draw!', 'Alice wins!'];
  const {standardUnit} = reach;
  const defaults = {defaultFundAmt: '10', defaultWager: '3', standardUnit};
  return (
    <div className="container">
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
       <MyApp defaults={defaults}/>
       {view}
       <Page/>
       </main>
      <style jsx>{`
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
          'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
          sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      code {
        font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
          monospace;
      }
      .App {
        text-align: center;
      }
      
      .App-header {
        background-color: #282c34;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: calc(10px + 2vmin);
        color: white;
      }
      
      .App-link {
        color: #61dafb;
      }
      
      input[type=number] {
        font-size: calc(10px + 2vmin);
        width: 4em;
      }
      
      button {
        font-size: calc(10px + 2vmin);
      }
      
      textarea {
        font-size: calc(10px + 2vmin);
      }
      
      .ContractInfo {
        font-size: calc(10px + 1vmin);
        text-align: left;
        width: 90vw;
        height: 7em;
        padding: 2vw;
        overflow-x: scroll;
        white-space: pre;
      }
      `}</style>
    </div>
    )}

    
class MyApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {view: 'ConnectAccount', ...props.defaults};
  }
  async componentDidMount() {

    const acc = await reach.getDefaultAccount();
    const balAtomic = await reach.balanceOf(acc);
    const bal = reach.formatCurrency(balAtomic, 4);
    this.setState({acc, bal});
    if (await reach.canFundFromFaucet()) {
      this.setState({view: 'FundAccount'});
    } else {
      this.setState({view: 'DeployerOrAttacher'});
    }
  }
  async fundAccount(fundAmount) {
    await reach.fundFromFaucet(this.state.acc, reach.parseCurrency(fundAmount));
    this.setState({view: 'DeployerOrAttacher'});
  }
  async skipFundAccount() { this.setState({view: 'DeployerOrAttacher'}); }
  selectAttacher() { this.setState({view: 'Wrapper', ContentView: Attacher}); }
  selectDeployer() { this.setState({view: 'Wrapper', ContentView: Deployer}); }
  render() { return renderView(this, AppViews); }
}

class Player extends React.Component {
  random() { return reach.hasRandom.random(); }
  async getHand() { // Fun([], UInt)
    const hand = await new Promise(resolveHandP => {
      this.setState({view: 'GetHand', playable: true, resolveHandP});
    });
    this.setState({view: 'WaitingForResults', hand});
    return handToInt[hand];
  }
  seeOutcome(i) { this.setState({view: 'Done', outcome: intToOutcome[i]}); }
  informTimeout() { this.setState({view: 'Timeout'}); }
  playHand(hand) { this.state.resolveHandP(hand); }
}

class Deployer extends Player {
  constructor(props) {
    super(props);
    this.state = {view: 'SetWager'};
  }
  setWager(wager) { this.setState({view: 'Deploy', wager}); }
  async deploy() {
    const ctc = this.props.acc.deploy(backend);
    this.setState({view: 'Deploying', ctc});
    this.wager = reach.parseCurrency(this.state.wager); // UInt
    this.deadline = {ETH: 10, ALGO: 100, CFX: 1000}[reach.connector]; // UInt
    backend.Alice(ctc, this);
    const ctcInfoStr = JSON.stringify(await ctc.getInfo(), null, 2);
    this.setState({view: 'WaitingForAttacher', ctcInfoStr});
  }
  render() { return renderView(this, DeployerViews); }
}
class Attacher extends Player {
  constructor(props) {
    super(props);
    this.state = {view: 'Attach'};
  }
  attach(ctcInfoStr) {
    const ctc = this.props.acc.attach(backend, JSON.parse(ctcInfoStr));
    this.setState({view: 'Attaching'});
    backend.Bob(ctc, this);
  }
  async acceptWager(wagerAtomic) { // Fun([UInt], Null)
    const wager = reach.formatCurrency(wagerAtomic, 4);
    return await new Promise(resolveAcceptedP => {
      this.setState({view: 'AcceptTerms', wager, resolveAcceptedP});
    });
  }
  termsAccepted() {
    this.state.resolveAcceptedP();
    this.setState({view: 'WaitingForTurn'});
  }
  render() { return renderView(this, AttacherViews); }
}
function Page() {
  useEffect(() => {
    console.log(window)
  })
  return (<div>Hello</div>)
}

