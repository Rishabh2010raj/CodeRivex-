const DB_USERS = "hb_users";
const DB_POSTS = "hb_posts";
const DB_MESSAGES = "hb_messages";
const DB_FOLLOWS = "hb_follows";
const DB_SESSION = "hb_session";

let currentUser = "";
let activeChatReceiver = "";

/* ================= INITIALIZE ================= */

document.addEventListener("DOMContentLoaded", function () {

currentUser = localStorage.getItem(DB_SESSION) || "";

document.getElementById("loginBtn")
    .addEventListener("click", loginUser);

document.getElementById("registerBtn")
    .addEventListener("click", registerUser);

document.getElementById("logoutBtn")
    .addEventListener("click", logout);

document.getElementById("navFeed")
    .addEventListener("click", () => switchTab("feed"));

document.getElementById("navUsers")
    .addEventListener("click", () => switchTab("users"));

document.getElementById("navChat")
    .addEventListener("click", () => switchTab("chat"));

document.getElementById("postBtn")
    .addEventListener("click", createPost);

document.getElementById("sendBtn")
    .addEventListener("click", sendMessage);

document.getElementById("backChatBtn")
    .addEventListener("click", closeChat);

document.getElementById("mediaInput")
    .addEventListener("change", function () {

        const file = this.files[0];

        document.getElementById("fileNameDisplay")
            .textContent = file ? file.name : "";
    });

if (currentUser) {
    showApp();
}

});

/* ================= AUTH ================= */

function loginUser() {

const username =
    document.getElementById("authUsername")
    .value.trim();

const password =
    document.getElementById("authPassword")
    .value.trim();

if (!username || !password) {
    showError("Username और Password भरें!");
    return;
}

const users =
    JSON.parse(localStorage.getItem(DB_USERS)) || {};

if (users[username] === password) {

    currentUser = username;

    localStorage.setItem(
        DB_SESSION,
        currentUser
    );

    hideError();
    showApp();

} else {

    showError("गलत Username या Password!");

}

}

function registerUser() {

const username =
    document.getElementById("authUsername")
    .value.trim();

const password =
    document.getElementById("authPassword")
    .value.trim();

if (!username || !password) {
    showError("Username और Password भरें!");
    return;
}

const users =
    JSON.parse(localStorage.getItem(DB_USERS)) || {};

if (users[username]) {

    showError(
        "यह Username पहले से मौजूद है!"
    );

    return;
}

users[username] = password;

localStorage.setItem(
    DB_USERS,
    JSON.stringify(users)
);

currentUser = username;

localStorage.setItem(
    DB_SESSION,
    currentUser
);

hideError();
showApp();

}

function showError(message) {

const error =
    document.getElementById("authError");

error.textContent = message;
error.classList.remove("hidden");

}

function hideError() {

document.getElementById("authError")
    .classList.add("hidden");

}

function logout() {

localStorage.removeItem(DB_SESSION);

currentUser = "";
activeChatReceiver = "";

document.getElementById("appSection")
    .classList.add("hidden");

document.getElementById("authSection")
    .classList.remove("hidden");

}

function showApp() {

document.getElementById("authSection")
    .classList.add("hidden");

document.getElementById("appSection")
    .classList.remove("hidden");

switchTab("feed");

}

/* ================= TABS ================= */

function switchTab(tab) {

document.getElementById("feedView")
    .classList.add("hidden");

document.getElementById("usersView")
    .classList.add("hidden");

document.getElementById("chatView")
    .classList.add("hidden");


if (tab === "feed") {

    document.getElementById("feedView")
        .classList.remove("hidden");

    renderPosts();

}

if (tab === "users") {

    document.getElementById("usersView")
        .classList.remove("hidden");

    renderUsers();

}

if (tab === "chat") {

    document.getElementById("chatView")
        .classList.remove("hidden");

    closeChat();
    renderFriends();

}

}

/* ================= FOLLOW ================= */

function toggleFollow(user) {

let follows =
    JSON.parse(
        localStorage.getItem(DB_FOLLOWS)
    ) || {};

if (!follows[currentUser]) {
    follows[currentUser] = [];
}

const list = follows[currentUser];

const index = list.indexOf(user);

if (index === -1) {
    list.push(user);
} else {
    list.splice(index, 1);
}

localStorage.setItem(
    DB_FOLLOWS,
    JSON.stringify(follows)
);

renderUsers();

}

/* ================= USERS ================= */

function renderUsers() {

const users =
    JSON.parse(
        localStorage.getItem(DB_USERS)
    ) || {};

const follows =
    JSON.parse(
        localStorage.getItem(DB_FOLLOWS)
    ) || {};

const following =
    follows[currentUser] || [];

const container =
    document.getElementById(
        "allUsersContainer"
    );

container.innerHTML = "";

const others =
    Object.keys(users)
    .filter(user => user !== currentUser);


if (others.length === 0) {

    container.innerHTML =
        "<p>अभी कोई दूसरा user नहीं है।</p>";

    return;
}


others.forEach(user => {

    const row =
        document.createElement("div");

    row.className = "user-row";


    const name =
        document.createElement("b");

    name.textContent = "👤 @" + user;


    const button =
        document.createElement("button");

    const followingNow =
        following.includes(user);

    button.className =
        "follow-btn" +
        (followingNow ? " liked" : "");

    button.textContent =
        followingNow
            ? "✔ Following"
            : "+ Follow";


    button.addEventListener(
        "click",
        () => toggleFollow(user)
    );


    row.appendChild(name);
    row.appendChild(button);

    container.appendChild(row);

});

}

/* ================= POSTS ================= */

function createPost() {

const text =
    document.getElementById("postInput")
    .value.trim();

const fileInput =
    document.getElementById("mediaInput");

const file = fileInput.files[0];


if (!text && !file) {

    alert(
        "कुछ Text या Photo/Video डालें!"
    );

    return;
}


if (file) {

    const reader =
        new FileReader();

    reader.onload = function (event) {

        const mediaType =
            file.type.startsWith("video")
                ? "video"
                : "image";

        savePost(
            text,
            event.target.result,
            mediaType
        );

    };

    reader.readAsDataURL(file);

} else {

    savePost(text, null, null);

}

}

function savePost(
text,
mediaData,
mediaType
) {

const posts =
    JSON.parse(
        localStorage.getItem(DB_POSTS)
    ) || [];


posts.unshift({

    id: Date.now(),

    author: currentUser,

    content: text,

    mediaData: mediaData,

    mediaType: mediaType,

    time: new Date()
        .toLocaleTimeString(),

    likes: [],

    comments: []

});


localStorage.setItem(
    DB_POSTS,
    JSON.stringify(posts)
);


document.getElementById("postInput")
    .value = "";

document.getElementById("mediaInput")
    .value = "";

document.getElementById("fileNameDisplay")
    .textContent = "";


renderPosts();

}

/* ================= LIKE ================= */

function toggleLike(postId) {

const posts =
    JSON.parse(
        localStorage.getItem(DB_POSTS)
    ) || [];


const post =
    posts.find(p => p.id === postId);

if (!post) return;


const index =
    post.likes.indexOf(currentUser);


if (index === -1) {

    post.likes.push(currentUser);

} else {

    post.likes.splice(index, 1);

}


localStorage.setItem(
    DB_POSTS,
    JSON.stringify(posts)
);

renderPosts();

}

/* ================= COMMENT ================= */

function addComment(postId) {

const input =
    document.getElementById(
        "comment-" + postId
    );

const text =
    input.value.trim();

if (!text) return;


const posts =
    JSON.parse(
        localStorage.getItem(DB_POSTS)
    ) || [];


const post =
    posts.find(p => p.id === postId);

if (!post) return;


post.comments.push({

    author: currentUser,

    text: text

});


localStorage.setItem(
    DB_POSTS,
    JSON.stringify(posts)
);


renderPosts();

}

/* ================= RENDER POSTS ================= */

function renderPosts() {

const posts =
    JSON.parse(
        localStorage.getItem(DB_POSTS)
    ) || [];


const container =
    document.getElementById(
        "postsContainer"
    );

container.innerHTML = "";


if (posts.length === 0) {

    container.innerHTML =
        `<div class="card"
         style="text-align:center;color:#65676b">
         अभी कोई post नहीं है 🚀
         </div>`;

    return;
}


posts.forEach(post => {

    const card =
        document.createElement("div");

    card.className = "card";


    const author =
        document.createElement("div");

    author.className =
        "post-author";

    author.textContent =
        "@" + post.author;


    const time =
        document.createElement("div");

    time.className =
        "post-time";

    time.textContent =
        post.time;


    card.appendChild(author);
    card.appendChild(time);


    if (post.content) {

        const content =
            document.createElement("div");

        content.className =
            "post-content";

        content.textContent =
            post.content;

        card.appendChild(content);
    }


    if (post.mediaData) {

        let media;

        if (post.mediaType === "video") {

            media =
                document.createElement("video");

            media.controls = true;

        } else {

            media =
                document.createElement("img");
        }


        media.src = post.mediaData;

        media.className =
            "post-media";

        card.appendChild(media);
    }


    const actions =
        document.createElement("div");

    actions.className =
        "post-actions";


    const like =
        document.createElement("button");

    like.className = "like-btn";


    if (
        post.likes.includes(currentUser)
    ) {

        like.classList.add("liked");

    }


    like.textContent =
        "👍 Like (" +
        post.likes.length +
        ")";


    like.addEventListener(
        "click",
        () => toggleLike(post.id)
    );


    actions.appendChild(like);

    card.appendChild(actions);


    /* COMMENTS */

    const commentsBox =
        document.createElement("div");


    post.comments.forEach(comment => {

        const item =
            document.createElement("p");

        item.innerHTML =
            "<b>@" +
            escapeHTML(comment.author) +
            ":</b> " +
            escapeHTML(comment.text);

        commentsBox.appendChild(item);

    });


    const commentInput =
        document.createElement("input");

    commentInput.id =
        "comment-" + post.id;

    commentInput.placeholder =
        "Write a comment...";


    const replyButton =
        document.createElement("button");

    replyButton.className =
        "reply-btn";

    replyButton.textContent =
        "Reply";


    replyButton.addEventListener(
        "click",
        () => addComment(post.id)
    );


    commentsBox.appendChild(commentInput);

    commentsBox.appendChild(replyButton);

    card.appendChild(commentsBox);

    container.appendChild(card);

});

}

/* ================= CHAT ================= */

function renderFriends() {

const follows =
    JSON.parse(
        localStorage.getItem(DB_FOLLOWS)
    ) || {};


const following =
    follows[currentUser] || [];


const followers = [];


Object.keys(follows).forEach(user => {

    if (
        follows[user]
        .includes(currentUser)
    ) {

        followers.push(user);

    }

});


const friends =
    [...new Set([
        ...following,
        ...followers
    ])];


const container =
    document.getElementById(
        "friendsContainer"
    );

container.innerHTML = "";


if (friends.length === 0) {

    container.innerHTML =
        "<p>पहले किसी user को Follow करें।</p>";

    return;
}


friends.forEach(user => {

    const row =
        document.createElement("div");

    row.className =
        "user-row";


    const name =
        document.createElement("b");

    name.textContent =
        "👤 @" + user;


    const button =
        document.createElement("button");

    button.className =
        "chat-btn";

    button.textContent =
        "Chat";


    button.addEventListener(
        "click",
        () => openChat(user)
    );


    row.appendChild(name);
    row.appendChild(button);

    container.appendChild(row);

});

}

function openChat(user) {

activeChatReceiver = user;


document.getElementById(
    "userListCard"
).classList.add("hidden");


document.getElementById(
    "activeChatCard"
).classList.remove("hidden");


document.getElementById(
    "chatWithTitle"
).textContent =
    "Chat with @" + user;


renderMessages();

}

function closeChat() {

activeChatReceiver = "";


document.getElementById(
    "activeChatCard"
).classList.add("hidden");


document.getElementById(
    "userListCard"
).classList.remove("hidden");

}

function sendMessage() {

const input =
    document.getElementById("chatInput");

const text =
    input.value.trim();


if (!text || !activeChatReceiver)
    return;


const messages =
    JSON.parse(
        localStorage.getItem(DB_MESSAGES)
    ) || [];


messages.push({

    sender: currentUser,

    receiver: activeChatReceiver,

    text: text,

    time: Date.now()

});


localStorage.setItem(
    DB_MESSAGES,
    JSON.stringify(messages)
);


input.value = "";

renderMessages();

}

function renderMessages() {

const messages =
    JSON.parse(
        localStorage.getItem(DB_MESSAGES)
    ) || [];


const box =
    document.getElementById("chatBox");

box.innerHTML = "";


const relevant =
    messages.filter(message =>

        (
            message.sender === currentUser &&
            message.receiver === activeChatReceiver
        )

        ||

        (
            message.sender === activeChatReceiver &&
            message.receiver === currentUser
        )

    );


if (relevant.length === 0) {

    box.innerHTML =
        `<div style="text-align:center;color:#65676b">
         No messages yet 👋
         </div>`;

    return;
}


relevant.forEach(message => {

    const div =
        document.createElement("div");


    div.className =
        "msg " +
        (
            message.sender === currentUser
                ? "sent"
                : "received"
        );


    div.textContent =
        message.text;


    box.appendChild(div);

});


box.scrollTop =
    box.scrollHeight;

}

/* ================= HTML SECURITY ================= */

function escapeHTML(text) {

const div =
    document.createElement("div");

div.textContent = text;

return div.innerHTML;

}