import {
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
ref,
set,
push,
get,
onValue,
update,
remove
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

/* ================= VARIABLES ================= */

const auth = window.firebaseAuth;
const db = window.firebaseDB;

let currentUser = null;
let currentUsername = "";
let activeChatReceiver = "";
let activeChatUsername = "";

let unsubscribePosts = null;
let unsubscribeUsers = null;
let unsubscribeMessages = null;

/* ================= ELEMENTS ================= */

const authSection =
document.getElementById("authSection");

const appSection =
document.getElementById("appSection");

const authEmail =
document.getElementById("authEmail");

const authPassword =
document.getElementById("authPassword");

const authError =
document.getElementById("authError");

/* ================= AUTH STATE ================= */

onAuthStateChanged(auth, async (user) => {

if (user) {

    currentUser = user;

    const usernameSnap =
        await get(
            ref(
                db,
                "users/" + user.uid + "/username"
            )
        );

    if (usernameSnap.exists()) {

        currentUsername =
            usernameSnap.val();

    } else {

        currentUsername =
            user.email.split("@")[0];

    }

    showApp();

} else {

    currentUser = null;
    currentUsername = "";

    showLogin();

}

});

/* ================= LOGIN ================= */

async function loginUser() {

const email =
    authEmail.value.trim();

const password =
    authPassword.value.trim();


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

} catch (error) {

    showError(
        firebaseError(error.code)
    );

}

}

/* ================= REGISTER ================= */

async function registerUser() {

const email =
    authEmail.value.trim();

const password =
    authPassword.value.trim();


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
        email.split("@")[0];


    await set(
        ref(
            db,
            "users/" + result.user.uid
        ),
        {

            uid: result.user.uid,

            username: username,

            email: email,

            createdAt: Date.now()

        }
    );


    hideError();

} catch (error) {

    showError(
        firebaseError(error.code)
    );

}

}

/* ================= LOGOUT ================= */

async function logout() {

if (unsubscribePosts)
    unsubscribePosts();

if (unsubscribeUsers)
    unsubscribeUsers();

if (unsubscribeMessages)
    unsubscribeMessages();


await signOut(auth);

activeChatReceiver = "";

}

/* ================= AUTH UI ================= */

function showLogin() {

authSection.classList.remove("hidden");

appSection.classList.add("hidden");

}

function showApp() {

authSection.classList.add("hidden");

appSection.classList.remove("hidden");

switchTab("feed");

}

function showError(message) {

authError.textContent = message;

authError.classList.remove("hidden");

}

function hideError() {

authError.classList.add("hidden");

}

/* ================= ERROR MESSAGES ================= */

function firebaseError(code) {

switch (code) {

    case "auth/invalid-email":
        return "Email सही नहीं है!";

    case "auth/user-not-found":
        return "यह account मौजूद नहीं है!";

    case "auth/wrong-password":
        return "Password गलत है!";

    case "auth/invalid-credential":
        return "Email या Password गलत है!";

    case "auth/email-already-in-use":
        return "यह Email पहले से registered है!";

    case "auth/weak-password":
        return "Password बहुत कमजोर है!";

    default:
        return "Error: " + code;
}

}

/* ================= TABS ================= */

function switchTab(tab) {

document
    .getElementById("feedView")
    .classList.add("hidden");

document
    .getElementById("usersView")
    .classList.add("hidden");

document
    .getElementById("chatView")
    .classList.add("hidden");


if (tab === "feed") {

    document
        .getElementById("feedView")
        .classList.remove("hidden");

    listenPosts();

}


if (tab === "users") {

    document
        .getElementById("usersView")
        .classList.remove("hidden");

    listenUsers();

}


if (tab === "chat") {

    document
        .getElementById("chatView")
        .classList.remove("hidden");

    closeChat();

    listenFriends();

}

}

/* ================= USERS ================= */

function listenUsers() {

const usersRef =
    ref(db, "users");


if (unsubscribeUsers)
    unsubscribeUsers();


unsubscribeUsers =
    onValue(
        usersRef,
        (snapshot) => {

            renderUsers(
                snapshot.val() || {}
            );

        }
    );

}

function renderUsers(users) {

const container =
    document.getElementById(
        "allUsersContainer"
    );

container.innerHTML = "";


Object.entries(users).forEach(
    ([uid, user]) => {

        if (uid === currentUser.uid)
            return;


        const row =
            document.createElement("div");

        row.className =
            "user-row";


        const name =
            document.createElement("span");

        name.className =
            "user-name";

        name.textContent =
            "👤 @" + user.username;


        const button =
            document.createElement("button");

        button.className =
            "follow-btn";

        button.textContent =
            "Loading...";


        row.appendChild(name);

        row.appendChild(button);

        container.appendChild(row);


        checkFollowing(
            uid,
            button
        );

    }
);


if (
    container.children.length === 0
) {

    container.innerHTML =
        "<p>अभी कोई दूसरा user नहीं है।</p>";

}

}

/* ================= FOLLOW ================= */

async function checkFollowing(
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


updateFollowButton(
    button,
    snapshot.exists()
);


button.onclick =
    () => toggleFollow(
        targetUid,
        button
    );

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

/* ================= POSTS ================= */

function listenPosts() {

const postsRef =
    ref(db, "posts");


if (unsubscribePosts)
    unsubscribePosts();


unsubscribePosts =
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

async function createPost() {

const text =
    document
        .getElementById("postInput")
        .value
        .trim();


const fileInput =
    document.getElementById(
        "mediaInput"
    );

const file =
    fileInput.files[0];


if (!text && !file) {

    alert(
        "कुछ Text या Photo/Video डालें!"
    );

    return;
}


/*
 * इस basic Firebase version में
 * text posts सीधे database में जाते हैं।
 */

if (file) {

    alert(
        "Photo/Video upload के लिए Firebase Storage भी enable करना होगा। अभी Text Post इस्तेमाल करें।"
    );

    return;
}


const postRef =
    push(ref(db, "posts"));


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

        likes: {},

        comments: {}

    }
);


document
    .getElementById("postInput")
    .value = "";

}

function renderPosts(posts) {

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

    card.className =
        "card";


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
        new Date(
            post.createdAt
        ).toLocaleString();


    const content =
        document.createElement("div");

    content.className =
        "post-content";

    content.textContent =
        post.content || "";


    card.appendChild(author);

    card.appendChild(time);

    card.appendChild(content);


    /* LIKE */

    const actions =
        document.createElement("div");

    actions.className =
        "post-actions";


    const likeButton =
        document.createElement("button");

    likeButton.className =
        "like-btn";


    const likes =
        post.likes || {};


    const liked =
        likes[currentUser.uid];


    if (liked)
        likeButton.classList.add("liked");


    likeButton.textContent =
        "👍 Like (" +
        Object.keys(likes).length +
        ")";


    likeButton.onclick =
        () =>
            toggleLike(
                post.id,
                liked
            );


    actions.appendChild(
        likeButton
    );

    card.appendChild(actions);


    /* COMMENTS */

    const commentBox =
        document.createElement("div");

    commentBox.className =
        "comment-box";


    const comments =
        post.comments || {};


    Object.values(comments)
        .forEach(comment => {

            const item =
                document.createElement("div");

            item.className =
                "comment-item";

            item.textContent =
                "@" +
                comment.author +
                ": " +
                comment.text;

            commentBox.appendChild(item);

        });


    const inputArea =
        document.createElement("div");

    inputArea.className =
        "comment-input-area";


    const input =
        document.createElement("input");

    input.placeholder =
        "Write a comment...";


    const reply =
        document.createElement("button");

    reply.className =
        "reply-btn";

    reply.textContent =
        "Reply";


    reply.onclick =
        () =>
            addComment(
                post.id,
                input
            );


    inputArea.appendChild(input);

    inputArea.appendChild(reply);

    commentBox.appendChild(inputArea);

    card.appendChild(commentBox);


    container.appendChild(card);

});

}

/* ================= LIKE ================= */

async function toggleLike(
postId,
liked
) {

const likeRef =
    ref(
        db,
        "posts/" +
        postId +
        "/likes/" +
        currentUser.uid
    );


if (liked) {

    await remove(likeRef);

} else {

    await set(
        likeRef,
        true
    );

}

}

/* ================= COMMENT ================= */

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

/* ================= FRIENDS ================= */

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


        const usersSnap =
            await get(
                ref(db, "users")
            );


        const users =
            usersSnap.val() || {};


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
    .forEach(uid => {

        if (!users[uid])
            return;


        const row =
            document.createElement("div");

        row.className =
            "user-row";


        const name =
            document.createElement("b");

        name.textContent =
            "👤 @" +
            users[uid].username;


        const button =
            document.createElement("button");

        button.className =
            "chat-btn";

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


if (!container.children.length) {

    container.innerHTML =
        "<p>किसी user को Follow करें, फिर Chat कर सकते हैं।</p>";

}

}

/* ================= CHAT ================= */

function openChat(
uid,
username
) {

activeChatReceiver =
    uid;

activeChatUsername =
    username;


document
    .getElementById(
        "userListCard"
    )
    .classList.add("hidden");


document
    .getElementById(
        "activeChatCard"
    )
    .classList.remove("hidden");


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
    .classList.add("hidden");


document
    .getElementById(
        "userListCard"
    )
    .classList.remove("hidden");


if (unsubscribeMessages) {

    unsubscribeMessages();

    unsubscribeMessages = null;

}

}

/* ================= MESSAGES ================= */

function getChatId(
uid1,
uid2
) {

return [uid1, uid2]
    .sort()
    .join("_");

}

function listenMessages() {

if (!activeChatReceiver)
    return;


const chatId =
    getChatId(
        currentUser.uid,
        activeChatReceiver
    );


const messagesRef =
    ref(
        db,
        "messages/" +
        chatId
    );


if (unsubscribeMessages)
    unsubscribeMessages();


unsubscribeMessages =
    onValue(
        messagesRef,
        snapshot => {

            const data =
                snapshot.val() || {};


            const messages =
                Object.values(data)
                .sort(
                    (a, b) =>
                        (a.createdAt || 0) -
                        (b.createdAt || 0)
                );


            renderMessages(
                messages
            );

        }
    );

}

function renderMessages(messages) {

const box =
    document.getElementById(
        "chatBox"
    );

box.innerHTML = "";


if (!messages.length) {

    box.innerHTML =
        `<div style="text-align:center;color:#65676b">
         No messages yet 👋
         </div>`;

    return;
}


messages.forEach(message => {

    const div =
        document.createElement("div");


    div.className =
        "msg " +
        (
            message.senderUid ===
            currentUser.uid
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


const chatId =
    getChatId(
        currentUser.uid,
        activeChatReceiver
    );


const messageRef =
    push(
        ref(
            db,
            "messages/" +
            chatId
        )
    );


await set(
    messageRef,
    {

        senderUid:
            currentUser.uid,

        sender:
            currentUsername,

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

/* ================= FILE NAME ================= */

document
.getElementById("mediaInput")
.addEventListener(
"change",
function () {

        const file =
            this.files[0];

        document
            .getElementById(
                "fileNameDisplay"
            )
            .textContent =
            file
                ? file.name
                : "";

    }
);
