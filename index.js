const HEROKU_TIMEOUT = 30000;
const KEEP_ALIVE_INTERVAL = HEROKU_TIMEOUT - 2000;
const RESPONSE_DATA_THAT_CAN_BE_SENT_AHEAD = 'HTTP/1.1 ';

const herokuTimeoutHandler = (_req, res, next) => {
  let socketWasWrittenTo = false;
  const origSocketWrite = res.socket.write.bind(res.socket);
  const remainingResponseDataThatCanBeSentAhead = RESPONSE_DATA_THAT_CAN_BE_SENT_AHEAD.split('');

  const interval = setInterval(() => {
    const letterToSend = remainingResponseDataThatCanBeSentAhead.shift();
    if (!socketWasWrittenTo && !res.headersSent && letterToSend) {
      origSocketWrite(letterToSend);
      return;
    }
    clearInterval(interval);
  }, KEEP_ALIVE_INTERVAL);

  res.socket.write = (data, encoding, callback) => {
    if (!socketWasWrittenTo) {
      socketWasWrittenTo = true;
      const dataSentAhead =
        RESPONSE_DATA_THAT_CAN_BE_SENT_AHEAD.length - remainingResponseDataThatCanBeSentAhead.length;
      data = data.substr(dataSentAhead.length);
      clearInterval(interval);
    }
    return origSocketWrite(data, encoding, callback);
  };

  next();
};

module.exports = herokuTimeoutHandler;
