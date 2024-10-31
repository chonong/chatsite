let currentUser = '';
let currentChannel = '';
let socket;

document.addEventListener('DOMContentLoaded', function() {
    const chatSection = document.getElementById('chatSection');
    const channelList = document.getElementById('channelList');
    const chatWindow = document.getElementById('chatWindow');
    const chatHeader = document.getElementById('chatHeader');
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');

    // URL에서 사용자 이름 가져오기
    currentUser = decodeURIComponent(window.location.pathname.split('/').pop());

    socket = io();

    socket.on('new message', (message) => {
        if (message.channel === currentChannel) {
            appendMessage(message);
        }
    });

    loadChannels();

    function loadChannels() {
        const channels = ['채널1', '채널2', '채널3', '채널4'];
        channelList.innerHTML = '';
        channels.forEach(channel => {
            const channelBox = document.createElement('div');
            channelBox.className = 'channelBox';
            channelBox.textContent = channel;
            channelBox.addEventListener('click', () => openChat(channel));
            channelList.appendChild(channelBox);
        });
    }

    function openChat(channel) {
        if (currentChannel) {
            socket.emit('leave channel', currentChannel);
        }
        currentChannel = channel;
        socket.emit('join channel', channel);
        chatWindow.style.display = 'block';
        chatHeader.textContent = `${channel} 채팅`;
        loadMessages(channel);
    }

    function loadMessages(channel) {
        fetch(`/api/messages?channel=${channel}`)
            .then(response => response.json())
            .then(messages => {
                chatMessages.innerHTML = '';
                messages.forEach(appendMessage);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            });
    }

    function appendMessage(msg) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(msg.sender === currentUser ? 'sent' : 'received');
        messageElement.textContent = `${msg.sender}: ${msg.content}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    function sendMessage() {
        const message = messageInput.value;
        if (message.trim() !== '') {
            fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    channel: currentChannel,
                    sender: currentUser,
                    content: message
                }),
            })
            .then(response => response.json())
            .then(() => {
                messageInput.value = '';
            });
        }
    }
});