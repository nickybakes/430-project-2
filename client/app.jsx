const { model } = require('mongoose');
const helper = require('./helper.js');

//the index of the channel that the user currently has open
let selectedChannelIndex = 0;

//our user's csrf token
let csrf;

//https://bobbyhadz.com/blog/javascript-check-if-url-is-image#:~:text=To%20check%20if%20a%20url,return%20true%20if%20it%20does.
//from above, just checks if a link ends in an image file extension
const isImageUrl = (url) => {
    return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(url);
}

//checks if text is a corectly foprmatted url
const isFormattedUrl = (text) => {
    try {
        let url = new URL(text);
        return true;
    } catch (e) {
        return false;
    }
}

//https://stackoverflow.com/questions/28735459/how-to-validate-youtube-url-in-client-side-in-text-box
//i have edited it slightly to fit my use case
//will return null if its not a valid youtube url
//otherwise it will return a link for embeding a youtube video
const isYouTubeUrl = (url) => {
    if (url != undefined || url != '') {
        let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
        let match = url.match(regExp);
        if (match && match[2].length == 11) {
            return 'https://www.youtube.com/embed/' + match[2] + '?autoplay=0';
        }
        return null;
    }
    return null;
}

//When the user pressed Ctrl + V (or when they press 
//the Paste button on mobile)
//this will take whatevers in the user's clipboard 
//and make a 'Paste' out of it
const pasteFromClipboard = async (e) => {
    e.preventDefault();
    helper.hideMessage();

    //grab whatevers in the clipboard
    let text = await navigator.clipboard.readText();

    text = text.trim();

    //clean it up and check it
    if (text == "" || text == undefined || text == null) {
        helper.showMessage('There\'s nothing to paste!');
        return;
    }

    //finally send it off to the server
    helper.sendPost("/app", { text, channelIndex: selectedChannelIndex, _csrf: csrf }, loadPastesFromServer);
}

//When the user hovers over parts of a Paste
//the buttons for Copying and Deleting the paste
//need to show
const pasteHover = (e) => {
    //this loop just goes up the nodes of the paste/buttons
    //so nomatter what part of the paste we hover
    //we always properly show the buttons
    if (!e.target.classList.contains('paste')) {
        let currentNode = e.target.parentNode;
        while (!currentNode.classList.contains('paste') && currentNode.parentNode != null) {
            currentNode = currentNode.parentNode;
        }
        currentNode.querySelector('.pasteHoverButtons').classList.remove('hidden');
    } else {
        e.target.querySelector('.pasteHoverButtons').classList.remove('hidden');
    }
}

//does similar thing as the function above, but
//hides the buttons instead of showing them
const pasteHoverOff = (e) => {
    if (!e.target.classList.contains('paste')) {
        let currentNode = e.target.parentNode;
        while (!currentNode.classList.contains('paste') && currentNode.parentNode != null) {
            currentNode = currentNode.parentNode;
        }
        currentNode.querySelector('.pasteHoverButtons').classList.add('hidden');
    } else {
        e.target.querySelector('.pasteHoverButtons').classList.add('hidden');
    }
}

//when user presses the button labeled "C" on a paste
//copy its contents into the user's clipboard
const copyPasteButtonClick = (e) => {
    let currentNode = e.target.parentNode.parentNode;

    let text = currentNode.getAttribute('data-raw-text');

    navigator.clipboard.writeText(text);

    helper.hideMessage();
    helper.showMessage('Copied to clipboard!');
}

//when the user clicks the button labeled 'X'
//tell the server to delete the paste!
const deletePasteButtonClick = async (e) => {
    let currentNode = e.target.parentNode.parentNode;

    let id = currentNode.getAttribute('data-id');

    helper.sendPost("/app", { id, _csrf: csrf }, loadPastesFromServer, 'DELETE');
}

//for use in the PasteList below, this automatically 
//creates the C and X buttons
//as well as the Date text that are shown when the user hovers over a
//paste
const getPasteHoverButtons = (createdDate) => {
    let time = new Date(createdDate);
    //gotten from: https://stackoverflow.com/questions/8888491/how-do-you-display-javascript-datetime-in-12-hour-am-pm-format
    let timeText = time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

    let dateText = time.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

    return <div className='pasteHoverButtons hidden'><div className='dateText'>{dateText + " " + timeText}</div><button className="buttonLook rightSideFlat" onClick={copyPasteButtonClick}>C</button><button className="buttonLook leftSideFlat" onClick={deletePasteButtonClick}>X</button></div>;
}

//a React Element that renders all the pastes retrieved from the server
//within the channel the user has selected
//pastes are shown from most recent to least recent, top to bottom
const PasteList = (props) => {
    let pasteNodes = [];

    let previousLinkType = "none";

    //render some instruction text on how to use the app
    pasteNodes.push(<div key={-1} className='paste'><p>While focused on this area, paste text, links, image links, and YouTube links with Ctrl + V!</p></div>);

    //reverse so most recent pastes are on top
    props.pastes.reverse();

    for (let i = 0; i < props.pastes.length; i++) {
        let paste = props.pastes[i];
        //check if the text is a URL
        if (isFormattedUrl(paste.text)) {
            let embedUrl;
            //if it is a url, is it specifically an image one?
            if (isImageUrl(paste.text)) {
                pasteNodes.push(<div className='paste' onMouseOver={pasteHover} onMouseLeave={pasteHoverOff} data-raw-text={paste.text} data-id={paste._id} key={i}><a href={paste.text} target="_blank" className="inlineLink">{paste.text}</a><br /><img src={paste.text} alt={'Image imported from web'} />{getPasteHoverButtons(paste.createdDate)}</div>);
                previousLinkType = 'image';
            }
            //if not an image url, is it specifically a youtube one?
            else if (embedUrl = isYouTubeUrl(paste.text)) {
                pasteNodes.push(<div className='paste' onMouseOver={pasteHover} onMouseLeave={pasteHoverOff} data-raw-text={paste.text} data-id={paste._id} key={i}><a href={paste.text} target="_blank" className="inlineLink">{paste.text}</a><br /><iframe src={embedUrl} className="videoEmbed" type="text/html" frameBorder="0" allowFullScreen></iframe>{getPasteHoverButtons(paste.createdDate)}</div>);
                previousLinkType = 'youtube';
            }
            //if not those, then just put a generic link
            else {
                pasteNodes.push(<div className='paste' onMouseOver={pasteHover} onMouseLeave={pasteHoverOff} data-raw-text={paste.text} data-id={paste._id} key={i}><a href={paste.text} target="_blank" className="inlineLink">{paste.text}</a>{getPasteHoverButtons(paste.createdDate)}</div>);
                previousLinkType = 'link';
            }
        }
        //otherwise, just put plain text
        else {
            //it looks nicer to group plain text together
            //so if the previous paste type was 'p', then make the margin low
            if (previousLinkType == 'p') {
                pasteNodes.push(<div className='paste lowMarginPaste' onMouseOver={pasteHover} onMouseLeave={pasteHoverOff} data-raw-text={paste.text} data-id={paste._id} key={i}><p>{paste.text}</p>{getPasteHoverButtons(paste.createdDate)}</div>);
            } else {
                pasteNodes.push(<div className='paste' onMouseOver={pasteHover} onMouseLeave={pasteHoverOff} data-raw-text={paste.text} data-id={paste._id} key={i}><p>{paste.text}</p>{getPasteHoverButtons(paste.createdDate)}</div>);
            }
            previousLinkType = 'p';
        }
    }

    return (
        <div className='pasteList'>
            {pasteNodes}
        </div>
    );
}

//this React element is the list of channels on
//the top left of the screen. the user can
//click a channel to set is as active and show the
//pastes within that channel
const ChannelList = (props) => {
    //in case the server responds with no channels, show that
    if (props.channels == undefined || props.channels.length === 0) {
        return (
            <div className="channelList">
                <p>No Channels</p>
            </div>
        );
    }

    let channelNodes = [];

    //for all the channels the server gave us, add each one as a button to the array
    for (let i = 0; i < props.channels.length; i++) {
        let channel = props.channels[i];
        //if the channel's index matches the selected index, highlight it
        if (i == selectedChannelIndex) {
            channelNodes.push(<button key={channel.index + channel.name} className="buttonLook channelButton active" index={channel.index} onClick={onChannelButtonClick}>{channel.name}</button>);
        } else {
            channelNodes.push(<button key={channel.index + channel.name} className="buttonLook channelButton" index={channel.index} onClick={onChannelButtonClick}>{channel.name}</button>);
        }
    }

    return (
        <div className="channelList">
            {channelNodes}
        </div>
    );
}

//this React element is shown when the user clicks the Edit Channel Names button
//it lists out the channel's current names, and text boxes to type new names in
const ChannelEditor = (props) => {
    //in case the server responds with no channels, show that
    if (props.channels == undefined || props.channels.length === 0) {
        return (
            <div className="channelEditor" key='0'>
                <h2>Rename Channels</h2>
                <p>No Channels</p>
            </div>
        );
    }

    let channelNodes = [];

    for (let i = 0; i < props.channels.length; i++) {
        let channel = props.channels[i];

        //show the current name on the left, text box on the right
        let newDiv = (<div className='grid2x1' key={i}>
            <div>
                <label htmlFor={"currentName" + i}>Current Name: </label>
                <h2 id={"currentName" + i} className='currentName'>{channel.name}</h2>
            </div>
            <div>
                <label htmlFor={"newName" + i}>New Name: </label>
                <input id={"newName" + i} type="text" name="newName" defaultValue={channel.name} maxLength="18" />
            </div>
        </div>);
        channelNodes.push(newDiv);
    }

    //finally return this list of channels
    //along with 2 buttons that are the Cancel and Save Changes
    return (
        <div className="channelEditor">
            <div key='a'>
                <h2>Rename Channels</h2>
                {channelNodes}
            </div>
            <div key='b'>
                <div className='grid2x1'>
                    <button className="buttonLook" onClick={closeRenameChannels}>Cancel</button>
                    <button className="buttonLook" onClick={saveRenameChannels}>Save Changes</button>
                </div>
            </div>
        </div>
    );
}

//when the user clicks the edit channel names button
//show the modal dialog
const onClickRenameChannels = () => {
    let modal = document.getElementById('fullScreenModal');
    modal.classList.remove('hidden');
    modal.querySelector('#closeModalArea').onclick = closeRenameChannels;

    loadChannelNameEditor();
}

//sends the new channel names to the server to update them
const saveRenameChannels = (e) => {
    let modal = document.getElementById('renameChannelsModal');

    let newNames = {};

    for (let i = 0; i < 5; i++) {
        let newNameElement = modal.querySelector('#newName' + i);

        if (newNameElement != null) {
            newNames[i] = newNameElement.value;
        } else {
            break;
        }
    }

    helper.sendPost("/renameChannels", { newNames, _csrf: csrf }, loadChannelsFromServer, 'POST');

    closeRenameChannels();
}

//closes the edit names modal
const closeRenameChannels = () => {
    let modal = document.getElementById('fullScreenModal');
    modal.classList.add('hidden');
    modal.querySelector('#closeModalArea').onclick = null;
}

//when the user opens the channel names editor,
//this requests all the appropriate data from the server
const loadChannelNameEditor = async () => {
    const csrfRes = await fetch('/getToken');
    const csrfData = await csrfRes.json();
    csrf = csrfData.csrfToken;

    const response = await fetch('/getChannels');
    const data = await response.json();
    ReactDOM.render(
        <ChannelEditor channels={data.channels} />,
        document.getElementById('renameChannelsModal')
    );
}


//This React element renders the button for editing channel names
//and any other info we want to render
const ChannelOptionsArea = (props) => {
    return (
        <div>
            <button className='buttonLook' onClick={onClickRenameChannels}>Edit Channel Names</button>
        </div>
    );
}

//when the user presses the premium button, tell the
//server to purchase premium!
const onClickPurchasePremium = () => {
    helper.sendPost("/purchasePremium", { _csrf: csrf }, purchasePremiumSuccess, 'POST');
}

//on successful premium purchase, show message
//and rerender the sidebar with the new channels
const purchasePremiumSuccess = () => {

    helper.hideMessage();
    helper.showMessage('Premium purchased! Thank you!');

    createSidebar();
}

//this React element renders 1 of 2 things
//if you have premium: a thank you message
//if you dont have premium: a description/price of Premium mode and a nice green button purchase and
const PremiumOptionsArea = (props) => {
    if (props.isPremium) {
        return (
            <div>
                <h2>Account and Billing</h2>
                <p>You are a Premium member. Thank you for supporting us!</p>
            </div>
        );
    } else {
        return (
            <div>
                <h2>Account and Billing</h2>
                <p>Purchasing premium gives you 5 total channels to store pastes in. Premium is a one time purchase of $7.99.</p>
                <button className='buttonLook buttonLookGreen' onClick={onClickPurchasePremium}>Purchase Premium</button>
            </div>
        );
    }
}

//when the user wants to change their password
const handlePasswordChange = (e) => {
    e.preventDefault();
    helper.hideMessage();

    const pass = e.target.parentNode.querySelector('#pass').value;
    const pass2 = e.target.parentNode.querySelector('#pass2').value;

    //make sure they entered something
    if (!pass) {
        helper.showMessage('Password is empty!');
        return false;
    }

    //check if the 2 texts match
    if (pass != pass2) {
        helper.showMessage('Passwords do not match!');
        return false;
    }

    helper.sendPost("/passwordChange", { pass, _csrf: csrf }, passwordChangeSuccess, "POST");

    return false;
}

//on a sucessful password change, reset the text boxes and show a message
const passwordChangeSuccess = () => {
    helper.showMessage('Password changed!');
    document.getElementById('pass').value = '';
    document.getElementById('pass2').value = '';
}

//this React element shows the form for changing the user's password
const PasswordChangeArea = (props) => {
    return (
        <div>
            <label htmlFor="pass">New Password: </label>
            <input id="pass" type="password" name="pass" placeholder="password" />
            <label htmlFor="pass">Confirm your new Password: </label>
            <input id="pass2" type="password" name="pass2" placeholder="retype password" />
            <button className="buttonLook" onClick={handlePasswordChange}>Change Password</button>
        </div>
    );
}

//this retrieves all the pastes within the currently selected channel from
//the server, and then renders them in the view
const loadPastesFromServer = async () => {
    const csrfRes = await fetch('/getToken');
    const csrfData = await csrfRes.json();
    csrf = csrfData.csrfToken;

    const response = await fetch('/getPastes?index=' + selectedChannelIndex);
    const data = await response.json();
    ReactDOM.render(
        <PasteList pastes={data.pastes} />,
        document.getElementById('mainView')
    );

}

//this gets all the channel data from the server
//and renders the list of channel buttons on the top left
const loadChannelsFromServer = async () => {
    const csrfRes = await fetch('/getToken');
    const csrfData = await csrfRes.json();
    csrf = csrfData.csrfToken;

    const response = await fetch('/getChannels');
    const data = await response.json();
    ReactDOM.render(
        <ChannelList channels={data.channels} />,
        document.getElementById('channels')
    );
}

//this renders everything under the channel buttons list
const loadOptionsFromServer = async () => {
    const csrfRes = await fetch('/getToken');
    const csrfData = await csrfRes.json();
    csrf = csrfData.csrfToken;

    //channel edit buttons
    //for renaming channels
    const response = await fetch('/getChannels');
    const data = await response.json();
    ReactDOM.render(
        <ChannelOptionsArea channels={data.channels} />,
        document.getElementById('editChannelsArea')
    );

    const response2 = await fetch('/getPremium');
    const data2 = await response2.json();
    //premium purchasing area
    ReactDOM.render(
        <PremiumOptionsArea isPremium={data2.isPremium} />,
        document.getElementById('premiumArea')
    );
    
    //the form for changing password
    ReactDOM.render(
        <PasswordChangeArea />,
        document.getElementById('passwordChangeArea')
    );
}

//when the user clicks a channel button
//load the pastes from that channel and render it
const onChannelButtonClick = (e) => {
    //gets the index from the channel button that was clicked
    selectedChannelIndex = e.target.getAttribute('index');

    //unhighlights the old channel button and highlights the new selected one
    const channelButtons = document.getElementsByClassName("channelButton");
    for (let i = 0; i < channelButtons.length; i++) {
        channelButtons[i].classList.remove("active");
    }
    e.target.classList.add("active");

    loadPastesFromServer();
}

//renders the channel list and options list
//in the sidebar on the left side of the screen
const createSidebar = () => {
    loadChannelsFromServer();
    loadOptionsFromServer();
}

//initialized the app by getting the user's csrf token
//and rendering the first channel's pastes
//and all the options
const init = async () => {
    const response = await fetch('/getToken');
    const data = await response.json();

    csrf = data.csrfToken;

    const mainView = document.getElementById('mainView');

    mainView.addEventListener('paste', (e) => {
        pasteFromClipboard(e);
    });

    createSidebar();
    loadPastesFromServer();

    const pasteButton = document.getElementById('mobilePasteButton');
    pasteButton.addEventListener('click', (e) => {
        pasteFromClipboard(e);
    });
}

window.onload = init;