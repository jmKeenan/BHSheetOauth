function makeJSON () { //util to create a JSON file with the global variables inside of your Google docs (you could also create your JSON manually
  var bhCredentials = {
    //"CLIENT_ID": "YOUR CLIENT ID", 
    //"CLIENT_SECRET": "YOUR SECRET", 
    //"USER": 'YOUR BH USER NAME FOR OAUTH / REST', 
    //"PASS":'YOUR PASSWORD',
    //"AUTH_URL" :'YOUR AUTH URL',
    //"AUTH_TOKEN_URL" : 'YOUR TOKEN URL',
    //"REST_API": 'YOUR REST API STRING'
    };

  var myJSON = JSON.stringify(bhCredentials);
  DriveApp.createFile('bhOauth.json', myJSON); //the JSON file is called bhOauth but you could call it whatever you want
}
  
function readJSONVars(){ //read the global variables from a JSON file

  // define a file iterator
  var iter = DriveApp.getFilesByName("bhOauth.json"); //probably should move this to a global variable for clarity
  
  // define a File object variable and set the Media Type
  var file = iter.next();
  var jsonFile = file.getAs('application/json');
    
  var jsonObject = JSON.parse(jsonFile.getDataAsString());
   
  return { client_id: jsonObject.CLIENT_ID,
           client_secret: jsonObject.CLIENT_SECRET,
           user: jsonObject.USER,
           pass: jsonObject.PASS,
           auth_url: jsonObject.AUTH_URL,
           auth_token_url: jsonObject.AUTH_TOKEN_URL,
           rest_api: jsonObject.REST_API   
           };
}

function testOauth(){ //test app to make sure that the Oauth flow is working
  
  var test = authorizeAccess();
  Logger.log(test.BhRestToken + " and rest URL " + test.rBhRestUrl + " authorization " + test.BhAuthorization + " and token " + test.BhAccessToken);

  var options = {'method': 'GET', 'headers': {
    'bhresttoken': test.BhRestToken,
    'Authorization': test.BhAuthorization}};
  
    //candidates added
    var candidateSearchStr = "search/Candidate?fields=id,firstName,customDate3&query=dateAdded:[20180120 TO 20180127]";
    var url = test. BhRestUrl + candidateSearchStr;
    
    var response = UrlFetchApp.fetch(url, options);
    response = JSON.parse(response);
    Logger.log(response);

} 

/**
 * Raises a number to the given power, and returns the result.
 *
 * @param {number} base the number we're raising to a power
 * @param {number} exp the exponent we're raising the base to
 * @return {object} the result of the exponential calculation
 */

function authorizeAccess (){

  var clientVariable = readJSONVars(); // get the client variables from a json doc
  var authCode = getAuthCode(clientVariable.user,clientVariable.pass,clientVariable.client_id, clientVariable.auth_url); //first get the authcdoe
  var accessToken = doBullhornAuthToken(authCode,clientVariable.client_id,clientVariable.client_secret, clientVariable.auth_token_url); //then get bearerToken
  var bhRestToken = getBhRestToken(accessToken.authorization, accessToken.access_token, clientVariable.rest_api); // get the Bullhorn rest token
  
  return bhRestToken;
} 

function getAuthCode(user, pass, client_id, auth_url){//getAuthCode
      
  var data =  {
    "username": user,
    "password": pass,
    "client_id": client_id,
    "response_type": "code",
    "action": "Login"
  };
      
  var options = {
  
    'method': 'POST',
    'followRedirects' : false,
    'contentType': 'application/x-www-form-urlencoded',
    'payload': data
  };
   
  var response = UrlFetchApp.fetch(auth_url, options);
  
  var responseStr = response.getAllHeaders().toSource();
  
  responseStr = responseStr.slice(responseStr.search("code")+ 5)
  responseStr = responseStr.substring(0,responseStr.search("&"));
  responseStr = decodeURIComponent(responseStr);

  return responseStr;  
}

function doBullhornAuthToken(authCode, client_id, client_secret, auth_token_url) {

  var options ={'method' : 'POST'}; //post method to get BhRestCode
  var url = auth_token_url + authCode + 
  '&client_id='+ client_id + '&client_secret='+ client_secret;
  
  var response = JSON.parse(UrlFetchApp.fetch(url, options));

  return { 
    authorization: response.token_type + " " + response.access_token,
    access_token: response.access_token
    };
}

function getBhRestToken(authorization, accessToken, rest_api){

  var options = {"method": "GET"};
  var url = rest_api + accessToken;
   
  var response = JSON.parse(UrlFetchApp.fetch(url, options));

  return {
    BhRestToken: response.BhRestToken,
    BhRestUrl: response.restUrl,
    BhAuthorization: authorization,
    BhAccessToken: accessToken
    };
}
