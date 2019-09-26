var _ = require('./lodash'),

  sanitize = require('./util').sanitize;


/**
 * parses body of request when mode of body is formdata and
 * returns code snippet for nodejs to send body
 *
 * @param {Array<Object>} bodyArray - array containing body elements of request
 * @param {String} indentString - string required for indentation
 * @param {Boolean} trimBody - indicates whether to trim body fields or not
 */
function parseMultipart (bodyArray, indentString, trimBody) {
  return _.reduce(bodyArray, function (bodyString, item) {
    if (item.disabled) {
      return bodyString;
    }
    /* istanbul ignore next */
    if (item.type === 'file') {
      bodyString += indentString + `.attach('file', '${sanitize(item.src, trimBody)}')\n`;
    }
    else {
      bodyString += indentString +
                          `.field('${sanitize(item.key, trimBody)}', '${sanitize(item.value, trimBody)}')\n`;
    }
    return bodyString;
  }, '');
}

/**
 * parses body of request when mode of body is urlencoded and
 * returns code snippet for nodejs to send body
 *
 * @param {Array<Object>} bodyArray - data containing body elements of request
 * @param {String} indentString - string required for indentation
 * @param {Boolean} trimBody - indicates whether to trim body fields or not
 */
function parseFormdata (bodyArray, indentString, trimBody) {
  return _.reduce(bodyArray, function (bodyString, item) {
    if (item.disabled) {
      return bodyString;
    }
    bodyString += indentString +
      '.send(' + `'${sanitize(item.key, trimBody)}=${sanitize(item.value, trimBody)}'`.replace(/&/g, '%26') + ')\n';
    return bodyString;
  }, '');
}

/**
 * Parses body object based on mode of body and converts into nodejs(unirest) code snippet
 *
 * @param {Object} requestbody - json object representing body of request
 * @param {String} indentString - string required for indentation
 * @param {Boolean} trimBody - indicates whether to trim body fields or not
 * @returns {String} - code snippet for adding body in request
 */
function parseBody (requestbody, indentString, trimBody) {
  if (requestbody) {
    switch (requestbody.mode) {
      case 'raw':
        return indentString + '.send(' + JSON.stringify(requestbody[requestbody.mode]) + ')\n';
      case 'urlencoded':
        return parseFormdata(requestbody[requestbody.mode], indentString, trimBody);
      case 'formdata':
        return parseMultipart(requestbody[requestbody.mode], indentString, trimBody);
        /* istanbul ignore next */
      case 'file':
        return '.send("<file contents here>")\n';
      default:
        return '';
    }
  }
  return '';
}

/**
 * parses header of request object and returns code snippet of nodejs unirest to add header
 *
 * @param {Object} request - Postman SDK request object
 * @param {String} indentString - indentation required in code snippet
 * @returns {String} - code snippet of nodejs unirest to add header
 */
function parseHeader (request, indentString) {
  var headerArray = request.toJSON().header,
    headerSnippet = '';

  if (!_.isEmpty(headerArray)) {
    headerArray = _.reject(headerArray, 'disabled');
    headerSnippet += indentString + '.headers({\n';

    headerSnippet += _.reduce(headerArray, function (accumalator, header) {
      accumalator.push(indentString.repeat(2) + `'${sanitize(header.key, true)}': '${sanitize(header.value)}'`);
      return accumalator;
    }, []).join(',\n') + '\n';

    headerSnippet += indentString + '})\n';
  }
  return headerSnippet;
}

module.exports = {
  parseBody: parseBody,
  parseHeader: parseHeader
};
