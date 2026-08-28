alert("JavaScript चालू है!");
import {
initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
getAuth,
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
getDatabase,
ref,
set,
push,
get,
onValue,
remove
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

/* =====================================================
FIREBASE CONFIG
===================================================== */

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

/* =====================================================
INITIALIZE FIREBASE
===================================================== */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);

/* =====================================================
GLOBAL VARIABLES
===================================================== */

let currentUser = null;

let currentUsername = "";

let activeChatReceiver = "";

let postsListener = null;

let usersListener = null;

let messagesListener = null;

/* =====================================================
PAGE LOAD
===================================================== */

document.addEventListener(
"DOMContentLoaded",
() => {

    setupButtons();

}

);

/* =====================================================
BUTTON SETUP
===================================================== */

function setupButtons() {

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
    .getElementById("chatInput")
    .addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                sendMessage();

            }

        }
    );


document
    .getElementById("mediaInput")
    .addEventListener(
        "change",
        showFileName
    );

}

/* =====================================================
LOGIN
===================================================== */

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
        "Email और Password दोनों भरें!"
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

} catch (error) {

    showError(
        getErrorMessage(error.code)
    );

}

}

/* =====================================================
REGISTER
===================================================== */

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
        "Email और Password दोनों भरें!"
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
            .replace(/[^a-zA-Z0-9_]/g, "");


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

} catch (error) {

    showError(
        getErrorMessage(error.code)
    );

}

}

/* =====================================================
AUTH STATE
===================================================== */

onAuthStateChanged(
auth,
async user => {

    if (user) {

        currentUser = user;


        const usernameSnapshot =
            await get(
                ref(
                    db,
                    "users/" +
                    user.uid +
                    "/username"
                )
            );


        if (
            usernameSnapshot.exists()
        ) {

            currentUsername =
                usernameSnapshot.val();

        } else {

            currentUsername =
                user.email
                    .split("@")[0];

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

    } else {

        currentUser = null;

        currentUsername = "";

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

    }

}

);

/* =====================================================
LOGOUT
===================================================== */

async function logout() {

if (postsListener)
    postsListener();

if (usersListener)
    usersListener();

if (messagesListener)
    messagesListener();


postsListener = null;

usersListener = null;

messagesListener = null;

activeChatReceiver = "";

await signOut(auth);

}

/* =====================================================
ERROR
===================================================== */

function showError(message) {

const error =
    document.getElementById(
        "authError"
    );

error.textContent =
    message;

error.classList.remove(
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

function getErrorMessage(code) {

switch (code) {

    case "auth/invalid-email":
        return "Email गलत है!";

    case "auth/user-not-found":
        return "यह account नहीं मिला!";

    case "auth/wrong-password":
        return "Password गलत है!";

    case "auth/invalid-credential":
        return "Email या Password गलत है!";

    case "auth/email-already-in-use":
        return "यह Email पहले से registered है!";

    case "auth/weak-password":
        return "Password कम से कम 6 characters का रखें!";

    case "auth/network-request-failed":
        return "Internet connection check करें!";

    default:
        return "Error: " + code;
}

}

/* =====================================================
TABS
===================================================== */

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

    closeChat();

    listenFriends();

}

}

/* =====================================================
USERS
===================================================== */

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


const userEntries =
    Object.entries(users);


for (
    const [uid, user]
    of userEntries
) {

    if (
        !currentUser ||
        uid === currentUser.uid
    ) {
        continue;
    }


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

    name.className =
        "user-name";

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
        "Loading...";


    row.appendChild(name);

    row.appendChild(button);

    container.appendChild(row);


    const followRef =
        ref(
            db,
            "follows/" +
            currentUser.uid +
            "/" +
            uid
        );


    const followSnapshot =
        await get(followRef);


    const following =
        followSnapshot.exists();


    updateFollowButton(
        button,
        following
    );


    button.addEventListener(
        "click",
        () =>
            toggleFollow(
                uid,
                button
            )
    );

}


if (
    container.children.length === 0
) {

    container.innerHTML =
        "<p>अभी कोई दूसरा user नहीं है।</p>";

}

}

/* =====================================================
FOLLOW
===================================================== */

async function toggleFollow(
targetUid,
button
) {

const followRef =
    ref(
        db,
        "follows/" +
        currentUser.uid +
        "/" +
        targetUid
    );


const snapshot =
    await get(followRef);


if (snapshot.exists()) {

    await remove(followRef);

    updateFollowButton(
        button,
        false
    );

} else {

    await set(
        followRef,
        true
    );

    updateFollowButton(
        button,
        true
    );

}

}

function updateFollowButton(
button,
following
) {

button.textContent =
    following
        ? "✔ Following"
        : "+ Follow";


button.classList.toggle(
    "following",
    following
);

}

/* =====================================================
POSTS - REALTIME
===================================================== */

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

/* =====================================================
CREATE POST
===================================================== */

async function createPost() {

const input =
    document.getElementById(
        "postInput"
    );


const text =
    input.value.trim();


const fileInput =
    document.getElementById(
        "mediaInput"
    );


const file =
    fileInput.files[0];


if (!text && !file) {

    alert(
        "कुछ लिखें या Photo/Video select करें!"
    );

    return;
}


if (file) {

    alert(
        "अभी Text Post इस्तेमाल करें। Photo/Video के लिए Firebase Storage जोड़ना होगा।"
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

            authorUid:
                currentUser.uid,

            author:
                currentUsername,

            content:
                text,

            createdAt:
                Date.now(),

            likes:
                {},

            comments:
                {}

        }
    );


    input.value = "";

} catch (error) {

    alert(
        "Post बनाने में problem: " +
        error.message
    );

}

}

/* =====================================================
RENDER POSTS
===================================================== */

function renderPosts(posts) {

const container =
    document.getElementById(
        "postsContainer"
    );


container.innerHTML = "";


if (posts.length === 0) {

    container.innerHTML =
        `
        <div class="card"
             style="text-align:center;color:#65676b">
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


    /* AUTHOR */

    const author =
        document.createElement(
            "div"
        );

    author.className =
        "post-author";

    author.textContent =
        "@" +
        post.author;


    /* TIME */

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


    /* CONTENT */

    const content =
        document.createElement(
            "div"
        );

    content.className =
        "post-content";

    content.textContent =
        post.content || "";


    card.appendChild(author);

    card.appendChild(time);

    card.appendChild(content);


    /* ACTIONS */

    const actions =
        document.createElement(
            "div"
        );

    actions.className =
        "post-actions";


    const likeButton =
        document.createElement(
            "button"
        );

    likeButton.className =
        "like-btn";


    const likes =
        post.likes || {};


    const isLiked =
        !!likes[currentUser.uid];


    if (isLiked) {

        likeButton.classList.add(
            "liked"
        );

    }


    likeButton.textContent =
        "👍 Like (" +
        Object.keys(likes).length +
        ")";


    likeButton.addEventListener(
        "click",
        () =>
            toggleLike(
                post.id,
                isLiked
            )
    );


    actions.appendChild(
        likeButton
    );

    card.appendChild(actions);


    /* COMMENTS */

    const commentBox =
        document.createElement(
            "div"
        );

    commentBox.className =
        "comment-box";


    const comments =
        post.comments || {};


    Object.values(comments)
        .sort(
            (a, b) =>
                (a.createdAt || 0) -
                (b.createdAt || 0)
        )
        .forEach(
            comment => {

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "comment-item";

                item.textContent =
                    "@" +
                    comment.author +
                    ": " +
                    comment.text;

                commentBox.appendChild(
                    item
                );

            }
        );


    const commentArea =
        document.createElement(
            "div"
        );

    commentArea.className =
        "comment-input-area";


    const commentInput =
        document.createElement(
            "input"
        );

    commentInput.placeholder =
        "Write a comment...";


    const replyButton =
        document.createElement(
            "button"
        );

    replyButton.className =
        "reply-btn";

    replyButton.textContent =
        "Reply";


    replyButton.addEventListener(
        "click",
        () =>
            addComment(
                post.id,
                commentInput
            )
    );


    commentArea.appendChild(
        commentInput
    );

    commentArea.appendChild(
        replyButton
    );


    commentBox.appendChild(
        commentArea
    );


    card.appendChild(
        commentBox
    );


    container.appendChild(
        card
    );

});

}

/* =====================================================
LIKE
===================================================== */

async function toggleLike(
postId,
isLiked
) {

const likeRef =
    ref(
        db,
        "posts/" +
        postId +
        "/likes/" +
        currentUser.uid
    );


if (isLiked) {

    await remove(likeRef);

} else {

    await set(
        likeRef,
        true
    );

}

}

/* =====================================================
COMMENT
===================================================== */

async function addComment(
postId,
input
) {

const text =
    input.value.trim();


if (!text)
    return;


const commentRef =
    push(
        ref(
            db,
            "posts/" +
            postId +
            "/comments"
        )
    );


await set(
    commentRef,
    {

        author:
            currentUsername,

        authorUid:
            currentUser.uid,

        text:
            text,

        createdAt:
            Date.now()

    }
);


input.value = "";

}

/* =====================================================
FRIENDS / CHAT USERS
===================================================== */

function listenFriends() {

const followsRef =
    ref(
        db,
        "follows/" +
        currentUser.uid
    );


onValue(
    followsRef,
    async snapshot => {

        const following =
            snapshot.val() || {};


        const usersSnapshot =
            await get(
                ref(
                    db,
                    "users"
                )
            );


        const users =
            usersSnapshot.val() || {};


        renderFriends(
            following,
            users
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
    .forEach(
        uid => {

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

            name.className =
                "user-name";

            name.textContent =
                "👤 @" +
                users[uid].u
