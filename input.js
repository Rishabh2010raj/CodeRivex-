import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
getAuth,
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
onAuthStateChanged,
signOut
}
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
getDatabase,
ref,
set,
push,
get,
onValue,
remove
}
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

/* ================= FIREBASE ================= */

const firebaseConfig = {

apiKey:
    "AIzaSyBoU-pijNz9S-9v2OyLxArGYkZVtuc95fA",

authDomain:
    "hacker-book.firebaseapp.com",

databaseURL:
    "https://hacker-book-default-rtdb.firebaseio.com",

projectId:
    "hacker-book",

storageBucket:
    "hacker-book.firebasestorage.app",

messagingSenderId:
    "341319299799",

appId:
    "1:341319299799:web:77e386f68b153cc4e3f692",

measurementId:
    "G-BL9YZRFJEM"

};

const app =
initializeApp(firebaseConfig);

const auth =
getAuth(app);

const db =
getDatabase(app);

/* ================= VARIABLES ================= */

let currentUser = null;
let currentUsername = "";
let activeChatReceiver = "";

let postsListener = null;
let usersListener = null;
let messagesListener = null;

/* ================= PAGE READY ================= */

document.addEventListener(
"DOMContentLoaded",
() => {

    document
        .getElementById("loginBtn")
        .addEventListener(
            "click",
            loginUser
        );


    document
        .getElementById("registerBtn")
        .addEventListener(
            "click",
            registerUser
        );


    document
        .getElementById("logoutBtn")
        .addEventListener(
            "click",
            logout
        );


    document
        .getElementById("navFeed")
        .addEventListener(
            "click",
            () => switchTab("feed")
        );


    document
        .getElementById("navUsers")
        .addEventListener(
            "click",
            () => switchTab("users")
        );


    document
        .getElementById("navChat")
        .addEventListener(
            "click",
            () => switchTab("chat")
        );


    document
        .getElementById("postBtn")
        .addEventListener(
            "click",
            createPost
        );


    document
        .getElementById("sendBtn")
        .addEventListener(
            "click",
            sendMessage
        );


    document
        .getElementById("backChatBtn")
        .addEventListener(
            "click",
            closeChat
        );


    document
        .getElementById("mediaInput")
        .addEventListener(
            "change",
            showFileName
        );

}

);

/* ================= LOGIN ================= */

async function loginUser() {

const email =
    document
        .getElementById("authEmail")
        .value
        .trim();

const password =
    document
        .getElementById("authPassword")
        .value;


if (!email || !password) {

    showError(
        "Email और Password भरें!"
    );

    return;
}


try {

    await signInWithEmailAndPassword(
        auth,
        email,
        password
    );

    hideError();

}
catch (error) {

    showError(
        firebaseError(error.code)
    );

}

}

/* ================= CREATE ACCOUNT ================= */

async function registerUser() {

const email =
    document
        .getElementById("authEmail")
        .value
        .trim();

const password =
    document
        .getElementById("authPassword")
        .value;


if (!email || !password) {

    showError(
        "Email और Password भरें!"
    );

    return;
}


if (password.length < 6) {

    showError(
        "Password कम से कम 6 characters का होना चाहिए!"
    );

    return;
}


try {

    const result =
        await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );


    const username =
        email
            .split("@")[0]
            .replace(
                /[^a-zA-Z0-9_]/g,
                ""
            );


    await set(
        ref(
            db,
            "users/" +
            result.user.uid
        ),
        {

            uid:
                result.user.uid,

            username:
                username,

            email:
                email,

            createdAt:
                Date.now()

        }
    );


    hideError();

}
catch (error) {

    showError(
        firebaseError(error.code)
    );

}

}

/* ================= AUTH STATE ================= */

onAuthStateChanged(
auth,
async user => {

    if (!user) {

        document
            .getElementById(
                "authSection"
            )
            .classList
            .remove("hidden");


        document
            .getElementById(
                "appSection"
            )
            .classList
            .add("hidden");

        return;
    }


    currentUser = user;


    const snap =
        await get(
            ref(
                db,
                "users/" +
                user.uid +
                "/username"
            )
        );


    if (snap.exists()) {

        currentUsername =
            snap.val();

    }
    else {

        currentUsername =
            user.email.split("@")[0];

    }


    document
        .getElementById(
            "authSection"
        )
        .classList
        .add("hidden");


    document
        .getElementById(
            "appSection"
        )
        .classList
        .remove("hidden");


    switchTab("feed");

}

);

/* ================= LOGOUT ================= */

async function logout() {

await signOut(auth);

}

/* ================= ERROR ================= */

function showError(text) {

const box =
    document.getElementById(
        "authError"
    );

box.textContent =
    text;

box.classList.remove(
    "hidden"
);

}

function hideError() {

document
    .getElementById(
        "authError"
    )
    .classList
    .add("hidden");

}

function firebaseError(code) {

if (
    code ===
    "auth/invalid-email"
)
    return "Email गलत है!";

if (
    code ===
    "auth/invalid-credential"
)
    return "Email या Password गलत है!";

if (
    code ===
    "auth/email-already-in-use"
)
    return "यह Email पहले से registered है!";

if (
    code ===
    "auth/weak-password"
)
    return "Password कम से कम 6 characters का रखें!";

if (
    code ===
    "auth/network-request-failed"
)
    return "Internet connection check करें!";

return "Error: " + code;

}

/* ================= TABS ================= */

function switchTab(tab) {

document
    .getElementById("feedView")
    .classList
    .add("hidden");

document
    .getElementById("usersView")
    .classList
    .add("hidden");

document
    .getElementById("chatView")
    .classList
    .add("hidden");


if (tab === "feed") {

    document
        .getElementById("feedView")
        .classList
        .remove("hidden");

    listenPosts();

}


if (tab === "users") {

    document
        .getElementById("usersView")
        .classList
        .remove("hidden");

    listenUsers();

}


if (tab === "chat") {

    document
        .getElementById("chatView")
        .classList
        .remove("hidden");

    listenFriends();

}

}

/* ================= POSTS ================= */

function listenPosts() {

const postsRef =
    ref(db, "posts");


if (postsListener)
    postsListener();


postsListener =
    onValue(
        postsRef,
        snapshot => {

            const data =
                snapshot.val() || {};


            const posts =
                Object.entries(data)
                    .map(
                        ([id, post]) => ({
                            id,
                            ...post
                        })
                    )
                    .sort(
                        (a, b) =>
                            (b.createdAt || 0) -
                            (a.createdAt || 0)
                    );


            renderPosts(posts);

        }
    );

}

/* ================= CREATE POST ================= */

async function createPost() {

const input =
    document.getElementById(
        "postInput"
    );


const text =
    input.value.trim();


if (!text) {

    alert(
        "पहले कुछ लिखें!"
    );

    return;
}


try {

    const postRef =
        push(
            ref(db, "posts")
        );


    await set(
        postRef,
        {

            author:
                currentUsername,

            authorUid:
                currentUser.uid,

            content:
                text,

            createdAt:
                Date.now(),

            likes: {},

            comments: {}

        }
    );


    input.value = "";

}
catch (error) {

    alert(
        error.message
    );

}

}

/* ================= RENDER POSTS ================= */

function renderPosts(posts) {

const container =
    document.getElementById(
        "postsContainer"
    );


container.innerHTML = "";


if (posts.length === 0) {

    container.innerHTML =
        `
        <div class="card">
            अभी कोई post नहीं है 🚀
        </div>
        `;

    return;
}


posts.forEach(post => {

    const card =
        document.createElement(
            "div"
        );

    card.className =
        "card";


    const author =
        document.createElement(
            "div"
        );

    author.className =
        "post-author";

    author.textContent =
        "@" + post.author;


    const time =
        document.createElement(
            "div"
        );

    time.className =
        "post-time";

    time.textContent =
        new Date(
            post.createdAt
        ).toLocaleString();


    const content =
        document.createElement(
            "div"
        );

    content.className =
        "post-content";

    content.textContent =
        post.content;


    card.appendChild(author);
    card.appendChild(time);
    card.appendChild(content);


    const likes =
        post.likes || {};


    const likeBtn =
        document.createElement(
            "button"
        );

    likeBtn.className =
        "like-btn";

    likeBtn.textContent =
        "👍 Like (" +
        Object.keys(likes).length +
        ")";


    if (
        likes[currentUser.uid]
    ) {

        likeBtn.classList.add(
            "liked"
        );

    }


    likeBtn.onclick =
        async () => {

            const likeRef =
                ref(
                    db,
                    "posts/" +
                    post.id +
                    "/likes/" +
                    currentUser.uid
                );


            if (
                likes[currentUser.uid]
            ) {

                await remove(
                    likeRef
                );

            }
            else {

                await set(
                    likeRef,
                    true
                );

            }

        };


    const actions =
        document.createElement(
            "div"
        );

    actions.className =
        "post-actions";

    actions.appendChild(
        likeBtn
    );

    card.appendChild(
        actions
    );


    container.appendChild(
        card
    );

});

}

/* ================= USERS ================= */

function listenUsers() {

const usersRef =
    ref(db, "users");


if (usersListener)
    usersListener();


usersListener =
    onValue(
        usersRef,
        snapshot => {

            renderUsers(
                snapshot.val() || {}
            );

        }
    );

}

async function renderUsers(users) {

const container =
    document.getElementById(
        "allUsersContainer"
    );


container.innerHTML = "";


for (
    const [uid, user]
    of Object.entries(users)
) {

    if (
        uid === currentUser.uid
    )
        continue;


    const row =
        document.createElement(
            "div"
        );

    row.className =
        "user-row";


    const name =
        document.createElement(
            "span"
        );

    name.textContent =
        "👤 @" +
        user.username;


    const button =
        document.createElement(
            "button"
        );

    button.className =
        "follow-btn";

    button.textContent =
        "Follow";


    const followRef =
        ref(
            db,
            "follows/" +
            currentUser.uid +
            "/" +
            uid
        );


    const followSnap =
        await get(followRef);


    if (
        followSnap.exists()
    ) {

        button.textContent =
            "✔ Following";

        button.classList.add(
            "following"
        );

    }


    button.onclick =
        async () => {

            const snap =
                await get(
                    followRef
                );


            if (
                snap.exists()
            ) {

                await remove(
                    followRef
                );

                button.textContent =
                    "Follow";

                button.classList.remove(
                    "following"
                );

            }
            else {

                await set(
                    followRef,
                    true
                );

                button.textContent =
                    "✔ Following";

                button.classList.add(
                    "following"
                );

            }

        };


    row.appendChild(name);

    row.appendChild(button);

    container.appendChild(row);

}


if (
    container.children.length === 0
) {

    container.innerHTML =
        "<p>अभी कोई दूसरा user नहीं है।</p>";

}

}

/* ================= FRIENDS ================= */

function listenFriends() {

const followRef =
    ref(
        db,
        "follows/" +
        currentUser.uid
    );


onValue(
    followRef,
    async snapshot => {

        const following =
            snapshot.val() || {};


        const usersSnap =
            await get(
                ref(db, "users")
            );


        renderFriends(
            following,
            usersSnap.val() || {}
        );

    }
);

}

function renderFriends(
following,
users
) {

const container =
    document.getElementById(
        "friendsContainer"
    );


container.innerHTML = "";


Object.keys(following)
    .forEach(uid => {

        if (!users[uid])
            return;


        const row =
            document.createElement(
                "div"
            );

        row.className =
            "user-row";


        const name =
            document.createElement(
                "span"
            );

        name.textContent =
            "👤 @" +
            users[uid].username;


        const button =
            document.createElement(
                "button"
            );

        button.className =
            "follow-btn";

        button.textContent =
            "Chat";


        button.onclick =
            () =>
                openChat(
                    uid,
                    users[uid].username
                );


        row.appendChild(name);

        row.appendChild(button);

        container.appendChild(row);

    });


if (
    container.children.length === 0
) {

    container.innerHTML =
        "<p>पहले किसी user को Follow करें।</p>";

}

}

/* ================= CHAT ================= */

function openChat(
uid,
username
) {

activeChatReceiver =
    uid;


document
    .getElementById(
        "userListCard"
    )
    .classList
    .add("hidden");


document
    .getElementById(
        "activeChatCard"
    )
    .classList
    .remove("hidden");


document
    .getElementById(
        "chatWithTitle"
    )
    .textContent =
    "Chat with @" +
    username;


listenMessages();

}

function closeChat() {

activeChatReceiver = "";


document
    .getElementById(
        "activeChatCard"
    )
    .classList
    .add("hidden");


document
    .getElementById(
        "userListCard"
    )
    .classList
    .remove("hidden");


if (messagesListener) {

    messagesListener();

    messagesListener = null;

}

}

function chatId(a, b) {

return [a, b]
    .sort()
    .join("_");

}

function listenMessages() {

const id =
    chatId(
        currentUser.uid,
        activeChatReceiver
    );


const messagesRef =
    ref(
        db,
        "messages/" + id
    );


if (messagesListener)
    messagesListener();


messagesListener =
    onValue(
        messagesRef,
        snapshot => {

            const data =
                snapshot.val() || {};


            renderMessages(
                Object.values(data)
            );

        }
    );

}

function renderMessages(
messages
) {

const box =
    document.getElementById(
        "chatBox"
    );


box.innerHTML = "";


messages
    .sort(
        (a, b) =>
            (a.createdAt || 0) -
            (b.createdAt || 0)
    )
    .forEach(message => {

        const div =
            document.createElement(
                "div"
            );


        div.className =
            message.senderUid ===
            currentUser.uid
                ? "msg sent"
                : "msg received";


        div.textContent =
            message.text;


        box.appendChild(div);

    });


box.scrollTop =
    box.scrollHeight;

}

async function sendMessage() {

const input =
    document.getElementById(
        "chatInput"
    );


const text =
    input.value.trim();


if (
    !text ||
    !activeChatReceiver
)
    return;


const id =
    chatId(
        currentUser.uid,
        activeChatReceiver
    );


const messageRef =
    push(
        ref(
            db,
            "messages/" + id
        )
    );


await set(
    messageRef,
    {

        senderUid:
            currentUser.uid,

        receiverUid:
            activeChatReceiver,

        text:
            text,

        createdAt:
            Date.now()

    }
);


input.value = "";

}

/* ================= FILE ================= */

function showFileName() {

const file =
    document
        .getElementById(
            "mediaInput"
        )
        .files[0];


document
    .getElementById(
        "fileNameDisplay"
    )
    .textContent =
    file
        ? file.name
        : "";

            }
