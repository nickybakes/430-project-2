const helper = require('./helper.js');

let selectedChannelIndex = 0;

const handleDomo = (e) => {
    e.preventDefault();
    helper.hideMessage();

    const name = e.target.querySelector('#domoName').value;
    const age = e.target.querySelector('#domoAge').value;
    const _csrf = e.target.querySelector('#_csrf').value;

    if (!name || !age) {
        helper.showMessage('All fields are requied!');
        return false;
    }

    helper.sendPost(e.target.action, { name, age, _csrf }, loadDomosFromServer);
    return false;
}

const pasteFromClipboard = async (e) => {
    const text = await navigator.clipboard.readText();
    console.log(text);
}

const DomoForm = (props) => {
    return (
        <form id="domoForm"
            onSubmit={handleDomo}
            name="domoForm"
            action="/app"
            method="POST"
            className="domoForm"
        >
            <label htmlFor="name">Name: </label>
            <input id="domoName" type="text" name="name" placeholder="Domo Name" />
            <label htmlFor="age">Age: </label>
            <input id="domoAge" type="number" min="0" name="pass" />
            <input id="_csrf" type="hidden" name="_csrf" value={props.csrf} />
            <input className="makeDomoSubmit" type="submit" value="Make Domo" />
        </form>
    );
}

const DomoList = (props) => {
    if (props.domos.length === 0) {
        return (
            <div className="domoList">
                <h3 classNames="emptyDomo">No Domos Yet!</h3>
            </div>
        );
    }

    const domoNodes = props.domos.map(domo => {
        return (
            <div key={domo._id} className="domo">
                <img src="assets/img/domoface.jpeg" alt="domo face" className="domoFace" />
                <h3 classNames="domoName"> Name: {domo.name} </h3>
                <h3 classNames="domoAge"> Age: {domo.age} </h3>
            </div>
        );

    });

    return (
        <div className="domoList">
            {domoNodes}
        </div>
    );
}

const ChannelList = (props) => {
    if (props.channels == undefined || props.channels.length === 0) {
        return (
            <div className="channelList">
                <h3 className="emptyDomo">No Channels</h3>
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

const loadDomosFromServer = async () => {
    const response = await fetch('/getDomos');
    const data = await response.json();
    ReactDOM.render(
        <DomoList domos={data.domos} />,
        document.getElementById('domos')
    );
}

const loadChannelsFromServer = async () => {
    const response = await fetch('/getChannels');
    const data = await response.json();
    ReactDOM.render(
        <ChannelList channels={data.channels} />,
        document.getElementById('sideBar')
    );
}

const onChannelButtonClick = (e) => {
    selectedChannelIndex = e.target.getAttribute('index');
    console.log(selectedChannelIndex);

    const channelButtons = document.getElementsByClassName("channelButton");
    for (let i = 0; i < channelButtons.length; i++) {
        channelButtons[i].classList.remove("active");
    }

    e.target.classList.add("active");
}

const createSideBar = () => {
    loadChannelsFromServer();

    // let channelButtons = document.getElementsByClassName("channelButton");
    // for (let i = 0; i < channelButtons.length; i++) {
    //     console.log(channelButtons[i]);
    //     channelButtons[i].addEventListener('click', (e) => {
    //         onChannelButtonClick(e);
    //     });
    // }
}

const init = async () => {
    const response = await fetch('/getToken');
    const data = await response.json();

    ReactDOM.render(
        <ChannelList csrf={data.csrfToken} />,
        document.getElementById('sideBar')
    );

    // ReactDOM.render(
    //     <DomoList domos={[]} />,
    //     document.getElementById('domos')
    // );

    const mainView = document.getElementById('mainView');

    mainView.addEventListener('paste', (e) => {
        pasteFromClipboard();
    });

    createSideBar();
    // loadDomosFromServer();
}

window.onload = init;