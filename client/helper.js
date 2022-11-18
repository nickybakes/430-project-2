/* Takes in an error message. Sets the error message up in html, and
   displays it to the user. Will be hidden by other events that could
   end in an error.
*/

  //shows our message box and then hides it after a second
function showMessage(message) {
  //get our message box
  let messageBox = document.querySelector(".message");
  //set its text to our custom message
  messageBox.innerHTML = message;

  //show the message box!
  messageBox.style.opacity = 1;
  messageBox.style.visibility = "visible";
  messageBox.style.transform = "scaleY(1)";

  //after about a second, hide the message box again
  setTimeout(hideMessage, 2000);
}

//hides our message box
function hideMessage() {
  //get our message box and hide it
  let messageBox = document.querySelector(".message");
  messageBox.style.opacity = 0;
  messageBox.style.visibility = "hidden";
  messageBox.style.transform = "scaleY(0)";
}
  
  /* Sends post requests to the server using fetch. Will look for various
     entries in the response JSON object, and will handle them appropriately.
  */
  const sendPost = async (url, data, handler) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  
    const result = await response.json();
    hideMessage();
  
    if(result.error) {
        showMessage(result.error);
      }

    if(result.redirect) {
      window.location = result.redirect;
    }
  
    if(handler){
        handler(result);
    }

  };

  module.exports = {
    showMessage,
    sendPost,
    hideMessage,
  }