const cards = [
    "あ","い","う","え","お",
    "か","き","く","け","こ",
    "さ","し","す","せ","そ",
    "た","ち","つ","て","と",
    "な","に","ぬ","ね","の",
    "は","ひ","ふ","へ","ほ",
    "ま","み","む","め","も",
    "や","ゆ","よ",
    "ら","り","る","れ","ろ",
    "わ","ん",
    "同"
];

let dictionary = [];

let deck = [];
let leftPile = [];
let rightPile = [];

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

function normalize(text) {

    return text
        .replace(/[ァ-ヶ]/g, c =>
            String.fromCharCode(c.charCodeAt(0) - 0x60)
        )
        .replace(/ー/g, "");
}

function firstChar(word) {
    return [...normalize(word)][0];
}

function lastChar(word) {
    const chars = [...normalize(word)];
    return chars[chars.length - 1];
}

function findCandidates(start, end) {

    return dictionary.filter(word =>
        firstChar(word) === start &&
        lastChar(word) === end
    );
}

async function loadDictionary() {

    const response =
        await fetch("/api/dictionary");

    dictionary =
        await response.json();
}

function startGame() {

    deck = [...cards];

    shuffle(deck);

    const mid =
        Math.ceil(deck.length / 2);

    leftPile =
        deck.slice(0, mid);

    rightPile =
        deck.slice(mid);

    nextTurn();
}

function nextTurn() {

    document.getElementById("answer").value = "";
    document.getElementById("result").textContent = "";

    if (
        leftPile.length === 0 ||
        rightPile.length === 0
    ) {

        document.getElementById("leftCard").textContent = "終";
        document.getElementById("rightCard").textContent = "了";

        document.getElementById("condition").textContent =
            "ゲーム終了";

        return;
    }

    let left = leftPile.pop();
    let right = rightPile.pop();

    if (left === "同") left = right;
    if (right === "同") right = left;

    document.getElementById("leftCard").textContent =
        left;

    document.getElementById("rightCard").textContent =
        right;

    const candidates =
        findCandidates(left, right);

    document.getElementById("condition").textContent =
        `「${left}」で始まり「${right}」で終わる国名または首都名（候補 ${candidates.length} 件）`;
}

function judge() {

    const answer =
        document.getElementById("answer")
            .value
            .trim();

    if (!answer) return;

    const left =
        normalize(
            document.getElementById("leftCard")
                .textContent
        );

    const right =
        normalize(
            document.getElementById("rightCard")
                .textContent
        );

    const exists =
        dictionary.some(
            w => normalize(w) === normalize(answer)
        );

    if (!exists) {

        document.getElementById("result").textContent =
            "× 登録されていない国名・首都名";

        document.getElementById("result").style.color =
            "red";

        return;
    }

    if (
        firstChar(answer) === left &&
        lastChar(answer) === right
    ) {

        document.getElementById("result").textContent =
            "○ 正解";

        document.getElementById("result").style.color =
            "green";

    } else {

        document.getElementById("result").textContent =
            "× 条件不一致";

        document.getElementById("result").style.color =
            "red";
    }
}

document
    .getElementById("checkBtn")
    .addEventListener("click", judge);

document
    .getElementById("nextBtn")
    .addEventListener("click", nextTurn);

(async () => {

    await loadDictionary();

    startGame();

})();