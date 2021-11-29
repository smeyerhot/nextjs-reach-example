import MyAlgoConnect from '@reach-sh/stdlib/ALGO_MyAlgoConnect'
import React, { useState, useEffect, useRef, useMemo } from 'react';

export const AlgoWrapper = (props) => {
  const algoconnector = useMemo(() => new MyAlgoConnect(),[]);  
  console.log(algoconnector)
  return <div></div>;
}

export default AlgoWrapper;