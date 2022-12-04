const helper = require('./helper.js');

let selectedChannelIndex = 0;
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

const pasteFromClipboard = async (e) => {
    e.preventDefault();
    helper.hideMessage();

    let text = await navigator.clipboard.readText();

    text = text.trim();

    if (text == "" || text == undefined || text == null) {
        helper.showMessage('There\'s nothing to paste!');
        return;
    }

    helper.sendPost("/app", { text, channelIndex: selectedChannelIndex, _csrf: csrf }, loadPastesFromServer);
}

const pasteHover = (e) => {
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

const copyPasteButtonClick = (e) => {
    let currentNode = e.target.parentNode.parentNode;

    let text = currentNode.getAttribute('data-raw-text');

    navigator.clipboard.writeText(text);

    helper.hideMessage();
    helper.showMessage('Copied to clipboard!');
}

const deletePasteButtonClick = async (e) => {
    let currentNode = e.target.parentNode.parentNode;

    let id = currentNode.getAttribute('data-id');

    helper.sendPost("/app", { id, _csrf: csrf }, loadPastesFromServer, 'DELETE');
}

const getPasteHoverButtons = (createdDate) => {
    let time = new Date(createdDate);
    //gotten from: https://stackoverflow.com/questions/8888491/how-do-you-display-javascript-datetime-in-12-hour-am-pm-format
    let timeText = time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

    let dateText = time.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

    return <div className='pasteHoverButtons hidden'><div className='dateText'>{dateText + " " + timeText}</div><button className="buttonLook rightSideFlat" onClick={copyPasteButtonClick}>C</button><button className="buttonLook leftSideFlat" onClick={deletePasteButtonClick}>X</button></div>;
}

const PasteList = (props) => {
    let pasteNodes = [];

    let previousLinkType = "none";

    pasteNodes.push(<div key={-1} className='paste'><p>While focused on this area, paste text, links, image links, and YouTube links with Ctrl + V!</p></div>);

    props.pastes.reverse();

    for (let i = 0; i < props.pastes.length; i++) {
        let paste = props.pastes[i];
        if (isFormattedUrl(paste.text)) {
            let embedUrl;
            if (isImageUrl(paste.text)) {
                pasteNodes.push(<div className='paste' onMouseOver={pasteHover} onMouseLeave={pasteHoverOff} data-raw-text={paste.text} data-id={paste._id} key={i}><a href={paste.text} target="_blank" className="inlineLink">{paste.text}</a><br /><img src={paste.text} alt={'Image imported from web'} />{getPasteHoverButtons(paste.createdDate)}</div>);
                previousLinkType = 'image';
            } else if (embedUrl = isYouTubeUrl(paste.text)) {
                pasteNodes.push(<div className='paste' onMouseOver={pasteHover} onMouseLeave={pasteHoverOff} data-raw-text={paste.text} data-id={paste._id} key={i}><a href={paste.text} target="_blank" className="inlineLink">{paste.text}</a><br /><iframe src={embedUrl} className="videoEmbed" type="text/html" frameBorder="0" allowFullScreen></iframe>{getPasteHoverButtons(paste.createdDate)}</div>);
                previousLinkType = 'youtube';
            } else {
                pasteNodes.push(<div className='paste' onMouseOver={pasteHover} onMouseLeave={pasteHoverOff} data-raw-text={paste.text} data-id={paste._id} key={i}><a href={paste.text} target="_blank" className="inlineLink">{paste.text}</a>{getPasteHoverButtons(paste.createdDate)}</div>);
                previousLinkType = 'link';
            }
        } else {
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

const ChannelList = (props) => {
    if (props.channels == undefined || props.channels.length === 0) {
        return (
            <div className="channelList">
                <p>No Channels</p>
            </div>
        );
    }

    let channelNodes = [];

    for (let i = 0; i < props.channels.length; i++) {
        let channel = props.channels[i];
        if (i == 0) {
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

const onClickRenameChannels = () => {
    console.log("RENAME");
}



const ChannelOptionsArea = (props) => {
    return (
        <div>
            <h2>Channel Options</h2>
            <button className='buttonLook' onClick={onClickRenameChannels}>Edit Channel Names</button>
        </div>
    );
}

const onClickPurchasePremium = () => {
    console.log("PREMIUM");
}

const PremiumOptionsArea = (props) => {
    return (
        <div>
            <h2>Premium Options</h2>
            <p>Purchasing premium gives you 5 total channels to store pastes in. Premium is a one time purchase of $7.99.</p>
            <button className='buttonLook buttonLookGreen' onClick={onClickPurchasePremium}>Purchase Premium</button>
        </div>
    );
}

const handlePasswordChange = (e) => {
    e.preventDefault();
    helper.hideMessage();

    const pass = e.target.parentNode.querySelector('#pass').value;
    const pass2 = e.target.parentNode.querySelector('#pass2').value;

    if (!pass) {
        helper.showMessage('Password is empty!');
        return false;
    }

    if (pass != pass2) {
        helper.showMessage('Passwords do not match!');
        return false;
    }

    helper.sendPost("/passwordChange", { pass, _csrf: csrf }, passwordChangeSuccess, "POST");

    return false;
}

const passwordChangeSuccess = () => {
    helper.showMessage('Password changed!');
}

const PasswordChangeArea = (props) => {
    return (
        <div>
            <h2>Password Options</h2>
            <label htmlFor="pass">New Password: </label>
            <input id="pass" type="password" name="pass" placeholder="password" />
            <label htmlFor="pass">Confirm your new Password: </label>
            <input id="pass2" type="password" name="pass2" placeholder="retype password" />
            <button className="buttonLook" onClick={handlePasswordChange}>Change Password</button>
        </div>
    );
}

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

const loadOptionsFromServer = async () => {
    const csrfRes = await fetch('/getToken');
    const csrfData = await csrfRes.json();
    csrf = csrfData.csrfToken;

    const response = await fetch('/getChannels');
    const data = await response.json();
    ReactDOM.render(
        <ChannelOptionsArea channels={data.channels} />,
        document.getElementById('editChannelsArea')
    );

    ReactDOM.render(
        <PremiumOptionsArea channels={data.channels} />,
        document.getElementById('premiumArea')
    );

    ReactDOM.render(
        <PasswordChangeArea channels={data.channels} />,
        document.getElementById('passwordChangeArea')
    );
}

const onChannelButtonClick = (e) => {
    selectedChannelIndex = e.target.getAttribute('index');
    const channelButtons = document.getElementsByClassName("channelButton");
    for (let i = 0; i < channelButtons.length; i++) {
        channelButtons[i].classList.remove("active");
    }

    e.target.classList.add("active");

    loadPastesFromServer();
}

const createSidebar = () => {
    loadChannelsFromServer();
    loadOptionsFromServer();
}

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
}

window.onload = init;