// baseline estimates, used to improve performance
// P2WPKH
// var TX_EMPTY_SIZE = 10.5
// var TX_INPUT_BASE = 0
// var TX_INPUT_PUBKEYHASH = 68
// var TX_OUTPUT_BASE = 0
// var TX_OUTPUT_PUBKEYHASH = 31

// // P2PKH
// var TX_EMPTY_SIZE = 10
// var TX_INPUT_BASE = 41
// var TX_INPUT_PUBKEYHASH = 107
// var TX_OUTPUT_BASE = 9
// var TX_OUTPUT_PUBKEYHASH = 25


// var SIZE = {
//   TX_EMPTY_SIZE: 10,
//   TX_INPUT_BASE: 41,
//   TX_INPUT_PUBKEYHASH: 107,
//   TX_OUTPUT_BASE: 9,
//   TX_OUTPUT_PUBKEYHASH: 25,
// }

const utils = () => {
  let SIZE = {
    TX_EMPTY_SIZE: 10,
    TX_INPUT_BASE: 41,
    TX_INPUT_PUBKEYHASH: 107,
    TX_OUTPUT_BASE: 9,
    TX_OUTPUT_PUBKEYHASH: 25,
  }

  const setConfig = (size) => {
    return SIZE = size || SIZE
  }

  function inputBytes(input) {
    return SIZE.TX_INPUT_BASE + (input.script ? input.script.length : SIZE.TX_INPUT_PUBKEYHASH)
  }

  function outputBytes(output) {
    return SIZE.TX_OUTPUT_BASE + (output.script ? output.script.length : SIZE.TX_OUTPUT_PUBKEYHASH)
  }

  function dustThreshold(output, feeRate) {
    /* ... classify the output for input estimate  */
    return inputBytes({}) * feeRate
  }

  function transactionBytes(inputs, outputs) {
    return SIZE.TX_EMPTY_SIZE +
      inputs.reduce(function (a, x) { return a + inputBytes(x) }, 0) +
      outputs.reduce(function (a, x) { return a + outputBytes(x) }, 0)
  }

  function uintOrNaN(v) {
    if (typeof v !== 'number') return NaN
    if (!isFinite(v)) return NaN
    if (Math.floor(v) !== v) return NaN
    if (v < 0) return NaN
    return v
  }

  function sumForgiving(range) {
    return range.reduce(function (a, x) { return a + (isFinite(x.value) ? x.value : 0) }, 0)
  }

  function sumOrNaN(range) {
    return range.reduce(function (a, x) { return a + uintOrNaN(x.value) }, 0)
  }

  var BLANK_OUTPUT = outputBytes({})


  function finalize(inputs, outputs, feeRate) {

    var bytesAccum = transactionBytes(inputs, outputs)
    let vb = bytesAccum

    var feeAfterExtraOutput = Math.ceil(feeRate * (bytesAccum + BLANK_OUTPUT))

    var remainderAfterExtraOutput = sumOrNaN(inputs) - sumOrNaN(outputs) - feeAfterExtraOutput


    // is it worth a change output?
    if (remainderAfterExtraOutput > dustThreshold({}, feeRate)) {
      outputs = outputs.concat({ value: remainderAfterExtraOutput })
      vb = bytesAccum + BLANK_OUTPUT
    }

    var fee = sumOrNaN(inputs) - sumOrNaN(outputs)

    if (!isFinite(fee)) return { fee: feeRate * bytesAccum }

    return {
      inputs: inputs,
      outputs: outputs,
      fee: fee,
      vb: vb
    }
  }

  return {
    dustThreshold: dustThreshold,
    finalize: finalize,
    inputBytes: inputBytes,
    outputBytes: outputBytes,
    sumOrNaN: sumOrNaN,
    sumForgiving: sumForgiving,
    transactionBytes: transactionBytes,
    uintOrNaN: uintOrNaN,
    setConfig: setConfig
  }
}
module.exports = utils()
