"use strict";

/* ==================================================
   カード構成

   「ヲ」以外の文字を1枚ずつ使用し、
   「同」カードを1枚追加する
================================================== */

const cards = [
    "あ", "い", "う", "え", "お",
    "か", "き", "く", "け", "こ",
    "さ", "し", "す", "せ", "そ",
    "た", "ち", "つ", "て", "と",
    "な", "に", "ぬ", "ね", "の",
    "は", "ひ", "ふ", "へ", "ほ",
    "ま", "み", "む", "め", "も",
    "や", "ゆ", "よ",
    "ら", "り", "る", "れ", "ろ",
    "わ", "ん",
    "同"
];


/* ==================================================
   ゲーム状態
================================================== */

let dictionary = [];
let dictionarySet = new Set();

let deck = [];
let leftPile = [];
let rightPile = [];

let currentStart = "";
let goalChar = "";

let solved = false;
let gameFinished = false;

let transitionTimer = null;

let inputMethod = "flick";

let flickInputEnabled = false;
let physicalInputEnabled = false;

let romajiBuffer = "";


/* ==================================================
   ストップウォッチ状態
================================================== */

let stopwatchStartTime = 0;
let stopwatchElapsedTime = 0;
let stopwatchAnimationId = null;
let stopwatchRunning = false;


/* ==================================================
   DOM要素
================================================== */

const startScreenEl =
    document.getElementById("startScreen");

const gameScreenEl =
    document.getElementById("gameScreen");

const startBtnEl =
    document.getElementById("startBtn");

const loadErrorEl =
    document.getElementById("loadError");

const answerEl =
    document.getElementById("answer");

const resultEl =
    document.getElementById("result");

const conditionEl =
    document.getElementById("condition");

const leftCardEl =
    document.getElementById("leftCard");

const rightCardEl =
    document.getElementById("rightCard");

const remainingCountEl =
    document.getElementById("remainingCount");

const stopwatchEl =
    document.getElementById("stopwatch");

const flickGridEl =
    document.getElementById("flick-grid");

const keyboardHelpEl =
    document.getElementById("keyboardHelp");

const controlButtonsEl =
    document.getElementById("controlButtons");

const checkBtnEl =
    document.getElementById("checkBtn");

const noneBtnEl =
    document.getElementById("noneBtn");

const modifyBtnEl =
    document.getElementById("modifyBtn");

const deleteBtnEl =
    document.getElementById("deleteBtn");


/* ==================================================
   CSV辞書の読み込み
================================================== */

async function loadDictionary() {
    const response =
        await fetch("/api/dictionary");

    if (!response.ok) {
        throw new Error(
            `辞書の取得に失敗しました: ${response.status}`
        );
    }

    const data =
        await response.json();

    if (!Array.isArray(data)) {
        throw new Error(
            "辞書データが配列ではありません"
        );
    }

    dictionary = data
        .map(word => String(word).trim())
        .filter(Boolean);

    dictionary = [
        ...new Set(dictionary)
    ];

    dictionarySet = new Set(
        dictionary.map(word =>
            normalizeWord(word)
        )
    );

    if (dictionary.length === 0) {
        throw new Error(
            "辞書が空です"
        );
    }

    console.log(
        `辞書を読み込みました: ${dictionary.length}語`
    );
}


/* ==================================================
   シャッフル
================================================== */

function shuffle(array) {
    for (
        let i = array.length - 1;
        i > 0;
        i--
    ) {
        const randomIndex =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            array[i],
            array[randomIndex]
        ] = [
            array[randomIndex],
            array[i]
        ];
    }

    return array;
}


/* ==================================================
   ひらがな・カタカナの正規化
================================================== */

function katakanaToHiragana(text) {
    return String(text).replace(
        /[ァ-ヶ]/g,
        character =>
            String.fromCharCode(
                character.charCodeAt(0) - 0x60
            )
    );
}


function normalizeWord(text) {
    return katakanaToHiragana(
        String(text)
            .trim()
            .normalize("NFC")
    );
}


/* ==================================================
   しりとり用の文字正規化

   濁点・半濁点の付け外しを許可する
   小文字は大文字として扱う
================================================== */

const shiritoriCharacterMap = {
    "ぁ": "あ",
    "ぃ": "い",
    "ぅ": "う",
    "ぇ": "え",
    "ぉ": "お",

    "ゃ": "や",
    "ゅ": "ゆ",
    "ょ": "よ",

    "っ": "つ",
    "ゎ": "わ",

    "が": "か",
    "ぎ": "き",
    "ぐ": "く",
    "げ": "け",
    "ご": "こ",

    "ざ": "さ",
    "じ": "し",
    "ず": "す",
    "ぜ": "せ",
    "ぞ": "そ",

    "だ": "た",
    "ぢ": "ち",
    "づ": "つ",
    "で": "て",
    "ど": "と",

    "ば": "は",
    "び": "ひ",
    "ぶ": "ふ",
    "べ": "へ",
    "ぼ": "ほ",

    "ぱ": "は",
    "ぴ": "ひ",
    "ぷ": "ふ",
    "ぺ": "へ",
    "ぽ": "ほ",

    "ゔ": "う"
};


function normalizeShiritoriChar(character) {
    const hiragana =
        katakanaToHiragana(
            String(character || "")
                .normalize("NFC")
        );

    return (
        shiritoriCharacterMap[hiragana]
        || hiragana
    );
}


/* ==================================================
   単語の先頭文字
================================================== */

function firstChar(word) {
    const characters = [
        ...normalizeWord(word)
    ];

    if (characters.length === 0) {
        return "";
    }

    return normalizeShiritoriChar(
        characters[0]
    );
}


/* ==================================================
   単語の最後の文字

   最後が小文字の場合は大文字にする
   最後が「ー」「－」の場合は直前の文字を使う

   例:
   ノルウェー → エ
================================================== */

function lastChar(word) {
    const characters = [
        ...normalizeWord(word)
    ];

    while (
        characters.length > 1
        &&
        (
            characters[
                characters.length - 1
            ] === "ー"
            ||
            characters[
                characters.length - 1
            ] === "－"
        )
    ) {
        characters.pop();
    }

    if (characters.length === 0) {
        return "";
    }

    return normalizeShiritoriChar(
        characters[
            characters.length - 1
        ]
    );
}


/* ==================================================
   辞書登録確認
================================================== */

function wordExists(word) {
    return dictionarySet.has(
        normalizeWord(word)
    );
}


/* ==================================================
   「ない」の判定

   現在の開始文字から辞書内の単語を使って、
   最終的に目標文字で終われるかを探索する。

   文字を頂点とした幅優先探索。
================================================== */

function hasSolution(start, goal) {
    const normalizedStart =
        normalizeShiritoriChar(start);

    const normalizedGoal =
        normalizeShiritoriChar(goal);

    const queue = [];
    const visited = new Set();

    /*
     最初の文字から始まる単語を調べる
    */

    for (const word of dictionary) {
        if (
            firstChar(word)
            !== normalizedStart
        ) {
            continue;
        }

        const ending =
            lastChar(word);

        if (
            ending === normalizedGoal
        ) {
            return true;
        }

        if (!visited.has(ending)) {
            visited.add(ending);
            queue.push(ending);
        }
    }

    /*
     到達した末尾文字から、
     さらにしりとりを続ける
    */

    let queueIndex = 0;

    while (queueIndex < queue.length) {
        const current =
            queue[queueIndex];

        queueIndex++;

        for (const word of dictionary) {
            if (
                firstChar(word)
                !== current
            ) {
                continue;
            }

            const ending =
                lastChar(word);

            if (
                ending === normalizedGoal
            ) {
                return true;
            }

            if (!visited.has(ending)) {
                visited.add(ending);
                queue.push(ending);
            }
        }
    }

    return false;
}


/* ==================================================
   ストップウォッチ
================================================== */

function formatStopwatchTime(milliseconds) {
    const totalCentiseconds =
        Math.floor(milliseconds / 10);

    const centiseconds =
        totalCentiseconds % 100;

    const totalSeconds =
        Math.floor(
            totalCentiseconds / 100
        );

    const seconds =
        totalSeconds % 60;

    const minutes =
        Math.floor(
            totalSeconds / 60
        );

    return (
        String(minutes).padStart(2, "0")
        + ":"
        + String(seconds).padStart(2, "0")
        + "."
        + String(centiseconds).padStart(2, "0")
    );
}


function updateStopwatch() {
    if (!stopwatchRunning) {
        return;
    }

    stopwatchElapsedTime =
        performance.now()
        - stopwatchStartTime;

    stopwatchEl.textContent =
        formatStopwatchTime(
            stopwatchElapsedTime
        );

    stopwatchAnimationId =
        requestAnimationFrame(
            updateStopwatch
        );
}


function startStopwatch() {
    if (
        stopwatchAnimationId !== null
    ) {
        cancelAnimationFrame(
            stopwatchAnimationId
        );
    }

    stopwatchElapsedTime = 0;

    stopwatchStartTime =
        performance.now();

    stopwatchRunning = true;

    stopwatchEl.textContent =
        "00:00.00";

    stopwatchEl.classList.remove(
        "finished"
    );

    stopwatchAnimationId =
        requestAnimationFrame(
            updateStopwatch
        );
}


function stopStopwatch() {
    if (!stopwatchRunning) {
        return;
    }

    stopwatchElapsedTime =
        performance.now()
        - stopwatchStartTime;

    stopwatchRunning = false;

    if (
        stopwatchAnimationId !== null
    ) {
        cancelAnimationFrame(
            stopwatchAnimationId
        );

        stopwatchAnimationId = null;
    }

    stopwatchEl.textContent =
        formatStopwatchTime(
            stopwatchElapsedTime
        );

    stopwatchEl.classList.add(
        "finished"
    );
}


function resetStopwatch() {
    stopwatchRunning = false;
    stopwatchElapsedTime = 0;

    if (
        stopwatchAnimationId !== null
    ) {
        cancelAnimationFrame(
            stopwatchAnimationId
        );

        stopwatchAnimationId = null;
    }

    stopwatchEl.textContent =
        "00:00.00";

    stopwatchEl.classList.remove(
        "finished"
    );
}


/* ==================================================
   ゲーム開始
================================================== */

function startGame() {
    deck = shuffle([
        ...cards
    ]);

    const middle =
        Math.ceil(
            deck.length / 2
        );

    leftPile =
        deck.slice(0, middle);

    rightPile =
        deck.slice(middle);

    solved = false;
    gameFinished = false;

    resetStopwatch();

    nextTurn();

    startStopwatch();
}


/* ==================================================
   次の問題
================================================== */

function nextTurn() {
    clearTimeout(
        transitionTimer
    );

    answerEl.value = "";
    romajiBuffer = "";

    resultEl.textContent = "";
    resultEl.style.color = "";

    checkBtnEl.disabled = false;
    noneBtnEl.disabled = false;

    if (
        leftPile.length === 0
        ||
        rightPile.length === 0
    ) {
        finishGame();
        return;
    }

    let left =
        leftPile.pop();

    let right =
        rightPile.pop();

    /*
     「同」は反対側の文字と同じ文字にする
    */

    if (left === "同") {
        left = right;
    }

    if (right === "同") {
        right = left;
    }

    leftCardEl.textContent =
        left;

    rightCardEl.textContent =
        right;

    currentStart =
        normalizeShiritoriChar(left);

    goalChar =
        normalizeShiritoriChar(right);

    solved = false;

    conditionEl.textContent =
        `「${left}」から始めて「${right}」で終わるしりとり`;

    updateRemainingCount();

    if (inputMethod === "romaji") {
        answerEl.focus();
    }
}


/* ==================================================
   残り問題数
================================================== */

function updateRemainingCount() {
    const remaining =
        Math.min(
            leftPile.length,
            rightPile.length
        );

    if (gameFinished) {
        remainingCountEl.textContent = "";
        return;
    }

    remainingCountEl.textContent =
        `残り ${remaining} 組`;
}


/* ==================================================
   ゲーム終了
================================================== */

function finishGame() {
    gameFinished = true;
    solved = true;

    stopStopwatch();

    leftCardEl.textContent = "終";
    rightCardEl.textContent = "了";

    conditionEl.textContent =
        "すべてのカードが終了しました";

    resultEl.textContent =
        `クリア！ 記録 ${formatStopwatchTime(
            stopwatchElapsedTime
        )}`;

    resultEl.style.color =
        "green";

    answerEl.value = "";
    romajiBuffer = "";

    checkBtnEl.disabled = true;
    noneBtnEl.disabled = true;

    remainingCountEl.textContent = "";
}


/* ==================================================
   正解後の自動進行
================================================== */

function moveToNextTurnAfterSuccess(message) {
    solved = true;

    resultEl.textContent =
        message;

    resultEl.style.color =
        "green";

    checkBtnEl.disabled = true;
    noneBtnEl.disabled = true;

    transitionTimer = setTimeout(
        () => {
            nextTurn();
        },
        700
    );
}


/* ==================================================
   入力された単語の判定
================================================== */

function judge() {
    if (
        solved
        ||
        gameFinished
    ) {
        return;
    }

    const answer =
        answerEl.value.trim();

    if (!answer) {
        resultEl.textContent =
            "国名または首都名を入力してください";

        resultEl.style.color =
            "red";

        return;
    }

    if (!wordExists(answer)) {
        resultEl.textContent =
            "× 登録されていない国名・首都名";

        resultEl.style.color =
            "red";

        return;
    }

    const beginning =
        firstChar(answer);

    if (
        beginning !== currentStart
    ) {
        resultEl.textContent =
            `× 「${currentStart}」で始めてください`;

        resultEl.style.color =
            "red";

        return;
    }

    const ending =
        lastChar(answer);

    /*
     右カードの文字で終わった場合は正解
    */

    if (ending === goalChar) {
        moveToNextTurnAfterSuccess(
            `○ 正解！「${goalChar}」に到達`
        );

        return;
    }

    /*
     右カードに到達していなければ
     しりとりを継続する
    */

    currentStart = ending;

    conditionEl.textContent =
        `次は「${currentStart}」から始める（目標：「${goalChar}」）`;

    resultEl.textContent =
        `○ 続行。次は「${currentStart}」`;

    resultEl.style.color =
        "#2563eb";

    answerEl.value = "";
    romajiBuffer = "";

    if (inputMethod === "romaji") {
        answerEl.focus();
    }
}


/* ==================================================
   「ない」の正誤判定
================================================== */

function judgeNone() {
    if (
        solved
        ||
        gameFinished
    ) {
        return;
    }

    const solvable =
        hasSolution(
            currentStart,
            goalChar
        );

    if (solvable) {
        resultEl.textContent =
            "× 「ない」ではありません";

        resultEl.style.color =
            "red";

        return;
    }

    moveToNextTurnAfterSuccess(
        "○ 正解（ない）"
    );
}


/* ==================================================
   回答欄の操作
================================================== */

function appendAnswerCharacter(character) {
    if (!character) {
        return;
    }

    answerEl.value +=
        character;

    answerEl.scrollLeft =
        answerEl.scrollWidth;
}


function deleteLastCharacter() {
    const characters = [
        ...answerEl.value
    ];

    characters.pop();

    answerEl.value =
        characters.join("");

    answerEl.scrollLeft =
        answerEl.scrollWidth;
}


/* ==================================================
   フリック入力データ

   配列の順番:
   0 = 上
   1 = 右
   2 = 下
   3 = 左
   4 = 中央
================================================== */

const flickData = {
    "ア": ["ウ", "エ", "オ", "イ", "ア"],
    "カ": ["ク", "ケ", "コ", "キ", "カ"],
    "サ": ["ス", "セ", "ソ", "シ", "サ"],
    "タ": ["ツ", "テ", "ト", "チ", "タ"],
    "ナ": ["ヌ", "ネ", "ノ", "ニ", "ナ"],
    "ハ": ["フ", "ヘ", "ホ", "ヒ", "ハ"],
    "マ": ["ム", "メ", "モ", "ミ", "マ"],
    "ヤ": ["ユ", "", "ヨ", "", "ヤ"],
    "ラ": ["ル", "レ", "ロ", "リ", "ラ"],
    "ワ": ["ン", "ー", "", "ヲ", "ワ"]
};


/* ==================================================
   濁点・半濁点・小文字変換
================================================== */

const transformChainMap = {
    "ア": ["ア", "ァ"],
    "イ": ["イ", "ィ"],
    "ウ": ["ウ", "ゥ", "ヴ"],
    "エ": ["エ", "ェ"],
    "オ": ["オ", "ォ"],

    "カ": ["カ", "ガ"],
    "キ": ["キ", "ギ"],
    "ク": ["ク", "グ"],
    "ケ": ["ケ", "ゲ"],
    "コ": ["コ", "ゴ"],

    "サ": ["サ", "ザ"],
    "シ": ["シ", "ジ"],
    "ス": ["ス", "ズ"],
    "セ": ["セ", "ゼ"],
    "ソ": ["ソ", "ゾ"],

    "タ": ["タ", "ダ"],
    "チ": ["チ", "ヂ"],
    "ツ": ["ツ", "ッ", "ヅ"],
    "テ": ["テ", "デ"],
    "ト": ["ト", "ド"],

    "ハ": ["ハ", "バ", "パ"],
    "ヒ": ["ヒ", "ビ", "ピ"],
    "フ": ["フ", "ブ", "プ"],
    "ヘ": ["ヘ", "ベ", "ペ"],
    "ホ": ["ホ", "ボ", "ポ"],

    "ヤ": ["ヤ", "ャ"],
    "ユ": ["ユ", "ュ"],
    "ヨ": ["ヨ", "ョ"],

    "ワ": ["ワ", "ヮ"]
};


/* ==================================================
   フリック入力用変数
================================================== */

let flickStartX = 0;
let flickStartY = 0;


/* ==================================================
   フリック方向判定
================================================== */

function getFlickDirection(
    differenceX,
    differenceY
) {
    const threshold = 25;

    /*
     動きが小さければ中央タップ
    */

    if (
        Math.abs(differenceX) < threshold
        &&
        Math.abs(differenceY) < threshold
    ) {
        return 4;
    }

    /*
     横方向
    */

    if (
        Math.abs(differenceX)
        >
        Math.abs(differenceY)
    ) {
        return (
            differenceX > 0
                ? 1
                : 3
        );
    }

    /*
     縦方向
    */

    return (
        differenceY > 0
            ? 2
            : 0
    );
}


/* ==================================================
   フリック開始
================================================== */

function flickPointerDownHandler(event) {
    if (!flickInputEnabled) {
        return;
    }

    event.preventDefault();

    flickStartX =
        event.clientX;

    flickStartY =
        event.clientY;

    try {
        event.currentTarget
            .setPointerCapture(
                event.pointerId
            );
    } catch (error) {
        /*
         Pointer Capture非対応の場合は
         何もしない
        */
    }
}


/* ==================================================
   フリック終了
================================================== */

function flickPointerUpHandler(event) {
    if (!flickInputEnabled) {
        return;
    }

    event.preventDefault();

    const differenceX =
        event.clientX
        - flickStartX;

    const differenceY =
        event.clientY
        - flickStartY;

    const direction =
        getFlickDirection(
            differenceX,
            differenceY
        );

    const base =
        event.currentTarget.dataset.char;

    const character =
        flickData[base]?.[direction];

    appendAnswerCharacter(
        character
    );
}


/* ==================================================
   フリックキーボード初期化
================================================== */

function initializeFlickKeyboard() {
    const buttons =
        document.querySelectorAll(
            ".flick-btn"
        );

    buttons.forEach(button => {
        button.addEventListener(
            "pointerdown",
            flickPointerDownHandler
        );

        button.addEventListener(
            "pointerup",
            flickPointerUpHandler
        );

        button.addEventListener(
            "pointermove",
            event => {
                if (flickInputEnabled) {
                    event.preventDefault();
                }
            }
        );

        button.addEventListener(
            "contextmenu",
            event => {
                event.preventDefault();
            }
        );
    });
}


function enableFlickInput() {
    flickInputEnabled = true;

    flickGridEl.style.display =
        "grid";
}


function disableFlickInput() {
    flickInputEnabled = false;

    flickGridEl.style.display =
        "none";
}


/* ==================================================
   濁点・半濁点・小文字切替
================================================== */

function modifyLastCharacter() {
    const characters = [
        ...answerEl.value
    ];

    if (characters.length === 0) {
        return;
    }

    const last =
        characters.pop();

    let selectedChain = null;

    for (
        const chain of
        Object.values(
            transformChainMap
        )
    ) {
        if (chain.includes(last)) {
            selectedChain = chain;
            break;
        }
    }

    if (!selectedChain) {
        return;
    }

    const currentIndex =
        selectedChain.indexOf(last);

    const nextIndex =
        (
            currentIndex + 1
        ) % selectedChain.length;

    characters.push(
        selectedChain[nextIndex]
    );

    answerEl.value =
        characters.join("");

    answerEl.scrollLeft =
        answerEl.scrollWidth;
}


/* ==================================================
   ローマ字変換表
================================================== */

const romajiToKanaMap = {
    "kya": "キャ",
    "kyu": "キュ",
    "kyo": "キョ",

    "sha": "シャ",
    "shu": "シュ",
    "she": "シェ",
    "sho": "ショ",

    "sya": "シャ",
    "syu": "シュ",
    "sye": "シェ",
    "syo": "ショ",

    "cha": "チャ",
    "chu": "チュ",
    "che": "チェ",
    "cho": "チョ",

    "tya": "チャ",
    "tyu": "チュ",
    "tye": "チェ",
    "tyo": "チョ",

    "nya": "ニャ",
    "nyu": "ニュ",
    "nyo": "ニョ",

    "hya": "ヒャ",
    "hyu": "ヒュ",
    "hyo": "ヒョ",

    "mya": "ミャ",
    "myu": "ミュ",
    "myo": "ミョ",

    "rya": "リャ",
    "ryu": "リュ",
    "ryo": "リョ",

    "gya": "ギャ",
    "gyu": "ギュ",
    "gyo": "ギョ",

    "ja": "ジャ",
    "ju": "ジュ",
    "je": "ジェ",
    "jo": "ジョ",

    "jya": "ジャ",
    "jyu": "ジュ",
    "jye": "ジェ",
    "jyo": "ジョ",

    "zya": "ジャ",
    "zyu": "ジュ",
    "zye": "ジェ",
    "zyo": "ジョ",

    "bya": "ビャ",
    "byu": "ビュ",
    "byo": "ビョ",

    "pya": "ピャ",
    "pyu": "ピュ",
    "pyo": "ピョ",

    "dya": "ヂャ",
    "dyu": "ヂュ",
    "dyo": "ヂョ",

    "fa": "ファ",
    "fi": "フィ",
    "fe": "フェ",
    "fo": "フォ",

    "fya": "ファ",
    "fyu": "フュ",
    "fyo": "フォ",

    "va": "ヴァ",
    "vi": "ヴィ",
    "vu": "ヴ",
    "ve": "ヴェ",
    "vo": "ヴォ",

    "tsa": "ツァ",
    "tsi": "ツィ",
    "tse": "ツェ",
    "tso": "ツォ",

    "thi": "ティ",
    "thu": "テュ",

    "dhi": "ディ",
    "dhu": "デュ",

    "twu": "トゥ",
    "dwu": "ドゥ",

    "kwa": "クァ",
    "kwi": "クィ",
    "kwe": "クェ",
    "kwo": "クォ",

    "gwa": "グァ",
    "gwi": "グィ",
    "gwe": "グェ",
    "gwo": "グォ",

    "shi": "シ",
    "chi": "チ",
    "tsu": "ツ",

    "si": "シ",
    "ti": "チ",
    "tu": "ツ",

    "fu": "フ",
    "hu": "フ",

    "wi": "ウィ",
    "we": "ウェ",
    "wo": "ヲ",

    "la": "ァ",
    "li": "ィ",
    "lu": "ゥ",
    "le": "ェ",
    "lo": "ォ",

    "xa": "ァ",
    "xi": "ィ",
    "xu": "ゥ",
    "xe": "ェ",
    "xo": "ォ",

    "lya": "ャ",
    "lyu": "ュ",
    "lyo": "ョ",

    "xya": "ャ",
    "xyu": "ュ",
    "xyo": "ョ",

    "ltu": "ッ",
    "xtu": "ッ",
    "ltsu": "ッ",
    "xtsu": "ッ",

    "a": "ア",
    "i": "イ",
    "u": "ウ",
    "e": "エ",
    "o": "オ",

    "ka": "カ",
    "ki": "キ",
    "ku": "ク",
    "ke": "ケ",
    "ko": "コ",

    "ca": "カ",
    "cu": "ク",
    "co": "コ",

    "sa": "サ",
    "su": "ス",
    "se": "セ",
    "so": "ソ",

    "ta": "タ",
    "te": "テ",
    "to": "ト",

    "na": "ナ",
    "ni": "ニ",
    "nu": "ヌ",
    "ne": "ネ",
    "no": "ノ",

    "ha": "ハ",
    "hi": "ヒ",
    "he": "ヘ",
    "ho": "ホ",

    "ma": "マ",
    "mi": "ミ",
    "mu": "ム",
    "me": "メ",
    "mo": "モ",

    "ya": "ヤ",
    "yu": "ユ",
    "yo": "ヨ",

    "ra": "ラ",
    "ri": "リ",
    "ru": "ル",
    "re": "レ",
    "ro": "ロ",

    "wa": "ワ",

    "ga": "ガ",
    "gi": "ギ",
    "gu": "グ",
    "ge": "ゲ",
    "go": "ゴ",

    "za": "ザ",
    "zi": "ジ",
    "ji": "ジ",
    "zu": "ズ",
    "ze": "ゼ",
    "zo": "ゾ",

    "da": "ダ",
    "di": "ヂ",
    "du": "ヅ",
    "de": "デ",
    "do": "ド",

    "ba": "バ",
    "bi": "ビ",
    "bu": "ブ",
    "be": "ベ",
    "bo": "ボ",

    "pa": "パ",
    "pi": "ピ",
    "pu": "プ",
    "pe": "ペ",
    "po": "ポ",

    "-": "ー"
};


const romajiKeys =
    Object.keys(
        romajiToKanaMap
    )
    .sort(
        (first, second) =>
            second.length
            - first.length
    );


const vowels =
    new Set([
        "a",
        "i",
        "u",
        "e",
        "o"
    ]);


/* ==================================================
   ローマ字の接頭辞確認
================================================== */

function hasRomajiPrefix(text) {
    return romajiKeys.some(
        key =>
            key.startsWith(text)
    );
}


/* ==================================================
   ローマ字バッファをカタカナへ変換
================================================== */

function processRomajiBuffer(
    forceComplete = false
) {
    while (romajiBuffer.length > 0) {
        /*
         n単独は通常は次の入力待ち。
         Enter時はンとして確定。
        */

        if (romajiBuffer === "n") {
            if (forceComplete) {
                appendAnswerCharacter(
                    "ン"
                );

                romajiBuffer = "";
            }

            break;
        }

        /*
         n' → ン
        */

        if (
            romajiBuffer.startsWith(
                "n'"
            )
        ) {
            appendAnswerCharacter(
                "ン"
            );

            romajiBuffer =
                romajiBuffer.slice(2);

            continue;
        }

        /*
         nnの場合は最初のnをンに確定。
         2文字目のnはナ行入力に利用できる。
        */

        if (
            romajiBuffer.startsWith(
                "nn"
            )
        ) {
            appendAnswerCharacter(
                "ン"
            );

            romajiBuffer =
                romajiBuffer.slice(1);

            continue;
        }

        /*
         nの次が母音、y、n以外ならン
        */

        if (
            romajiBuffer[0] === "n"
            &&
            romajiBuffer.length >= 2
        ) {
            const next =
                romajiBuffer[1];

            if (
                !vowels.has(next)
                &&
                next !== "y"
                &&
                next !== "n"
            ) {
                appendAnswerCharacter(
                    "ン"
                );

                romajiBuffer =
                    romajiBuffer.slice(1);

                continue;
            }
        }

        /*
         同じ子音が2つ続いたら促音
         例: kka → ッカ
        */

        if (
            romajiBuffer.length >= 2
            &&
            romajiBuffer[0]
                === romajiBuffer[1]
            &&
            !vowels.has(
                romajiBuffer[0]
            )
            &&
            romajiBuffer[0] !== "n"
        ) {
            appendAnswerCharacter(
                "ッ"
            );

            romajiBuffer =
                romajiBuffer.slice(1);

            continue;
        }

        /*
         最長一致
        */

        let matchedKey = null;

        for (const key of romajiKeys) {
            if (
                romajiBuffer.startsWith(
                    key
                )
            ) {
                matchedKey = key;
                break;
            }
        }

        if (matchedKey) {
            const longerCandidateExists =
                romajiKeys.some(
                    key =>
                        key.length
                            > matchedKey.length
                        &&
                        key.startsWith(
                            romajiBuffer
                        )
                );

            /*
             より長い候補がある場合は
             次の入力を待つ
            */

            if (
                !forceComplete
                &&
                romajiBuffer.length
                    === matchedKey.length
                &&
                longerCandidateExists
            ) {
                break;
            }

            appendAnswerCharacter(
                romajiToKanaMap[
                    matchedKey
                ]
            );

            romajiBuffer =
                romajiBuffer.slice(
                    matchedKey.length
                );

            continue;
        }

        /*
         まだ変換候補の途中なら待つ
        */

        if (
            !forceComplete
            &&
            hasRomajiPrefix(
                romajiBuffer
            )
        ) {
            break;
        }

        /*
         Enter時に残ったnをンにする
        */

        if (
            forceComplete
            &&
            romajiBuffer[0] === "n"
        ) {
            appendAnswerCharacter(
                "ン"
            );

            romajiBuffer =
                romajiBuffer.slice(1);

            continue;
        }

        /*
         変換できない文字は破棄
        */

        romajiBuffer =
            romajiBuffer.slice(1);
    }
}


/* ==================================================
   ローマ字キーボード入力

   Enter       決定
   Space       ない
   Backspace   削除
   Escape      全消去
================================================== */

function physicalInputKeydownHandler(event) {
    if (
        !physicalInputEnabled
        ||
        gameFinished
        ||
        solved
    ) {
        return;
    }

    /*
     Enterキーで決定
    */

    if (event.key === "Enter") {
        event.preventDefault();

        processRomajiBuffer(
            true
        );

        judge();

        return;
    }

    /*
     スペースキーで「ない」
    */

    if (
        event.key === " "
        ||
        event.code === "Space"
    ) {
        event.preventDefault();

        romajiBuffer = "";
        answerEl.value = "";

        judgeNone();

        return;
    }

    /*
     Backspaceキーで削除
    */

    if (
        event.key === "Backspace"
    ) {
        event.preventDefault();

        if (romajiBuffer.length > 0) {
            romajiBuffer =
                romajiBuffer.slice(
                    0,
                    -1
                );
        } else {
            deleteLastCharacter();
        }

        return;
    }

    /*
     Escapeキーで全消去
    */

    if (
        event.key === "Escape"
    ) {
        event.preventDefault();

        romajiBuffer = "";
        answerEl.value = "";

        return;
    }

    /*
     ショートカットキーは無視
    */

    if (
        event.ctrlKey
        ||
        event.altKey
        ||
        event.metaKey
    ) {
        return;
    }

    /*
     英字・ハイフン・アポストロフィを
     ローマ字入力として受け付ける
    */

    if (
        /^[a-zA-Z]$/.test(
            event.key
        )
        ||
        event.key === "-"
        ||
        event.key === "'"
    ) {
        event.preventDefault();

        romajiBuffer +=
            event.key.toLowerCase();

        processRomajiBuffer(
            false
        );
    }
}


function enablePhysicalInput() {
    physicalInputEnabled = true;
    romajiBuffer = "";

    /*
     重複登録を防止
    */

    document.removeEventListener(
        "keydown",
        physicalInputKeydownHandler
    );

    document.addEventListener(
        "keydown",
        physicalInputKeydownHandler
    );

    answerEl.focus();
}


function disablePhysicalInput() {
    physicalInputEnabled = false;
    romajiBuffer = "";

    document.removeEventListener(
        "keydown",
        physicalInputKeydownHandler
    );
}


/* ==================================================
   入力方法の選択
================================================== */

document
    .querySelectorAll(
        'input[name="inputMethod"]'
    )
    .forEach(radio => {
        radio.addEventListener(
            "change",
            event => {
                inputMethod =
                    event.target.value;
            }
        );
    });


/* ==================================================
   ゲーム開始ボタン
================================================== */

startBtnEl.addEventListener(
    "click",
    async () => {
        startBtnEl.disabled = true;

        startBtnEl.textContent =
            "読み込み中…";

        loadErrorEl.textContent = "";

        try {
            await loadDictionary();

            startScreenEl.style.display =
                "none";

            gameScreenEl.hidden =
                false;

            /*
             ブラウザ標準キーボードを表示しない
            */

            answerEl.readOnly = true;

            answerEl.setAttribute(
                "inputmode",
                "none"
            );

            if (
                inputMethod === "flick"
            ) {
                /*
                 フリック入力を有効化
                */

                disablePhysicalInput();
                enableFlickInput();

                controlButtonsEl.style.display =
                    "flex";

                keyboardHelpEl.style.display =
                    "none";

            } else {
                /*
                 ローマ字入力を有効化
                */

                disableFlickInput();
                enablePhysicalInput();

                controlButtonsEl.style.display =
                    "none";

                keyboardHelpEl.style.display =
                    "block";
            }

            startGame();

        } catch (error) {
            console.error(error);

            loadErrorEl.textContent =
                "辞書を読み込めませんでした。countries.csv と server.js を確認してください。";

            startBtnEl.disabled =
                false;

            startBtnEl.textContent =
                "ゲーム開始";
        }
    }
);


/* ==================================================
   フリック入力の決定ボタン
================================================== */

checkBtnEl.addEventListener(
    "click",
    () => {
        if (
            inputMethod !== "flick"
        ) {
            return;
        }

        judge();
    }
);


/* ==================================================
   フリック入力の「ない」ボタン
================================================== */

noneBtnEl.addEventListener(
    "click",
    () => {
        if (
            inputMethod !== "flick"
        ) {
            return;
        }

        answerEl.value = "";

        judgeNone();
    }
);


/* ==================================================
   濁点・小文字ボタン
================================================== */

modifyBtnEl.addEventListener(
    "click",
    () => {
        if (
            inputMethod !== "flick"
        ) {
            return;
        }

        modifyLastCharacter();
    }
);


/* ==================================================
   削除ボタン
================================================== */

deleteBtnEl.addEventListener(
    "click",
    () => {
        if (
            inputMethod !== "flick"
        ) {
            return;
        }

        deleteLastCharacter();
    }
);


/* ==================================================
   初期化
================================================== */

initializeFlickKeyboard();

/*
 ゲーム開始前は両方の入力を無効にする
*/

disableFlickInput();
disablePhysicalInput();

resetStopwatch();