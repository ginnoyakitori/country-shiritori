/* =========================
   定数
========================= */

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


/* =========================
   グローバル変数
========================= */

let dictionary = [];

let deck = [];
let leftPile = [];
let rightPile = [];

let currentStart = "";
let goalChar = "";

let solved = false;

let inputMethod = "flick";


/* =========================
   DOM
========================= */

const answerEl =
    document.getElementById(
        "answer"
    );

const resultEl =
    document.getElementById(
        "result"
    );

const conditionEl =
    document.getElementById(
        "condition"
    );

const leftCardEl =
    document.getElementById(
        "leftCard"
    );

const rightCardEl =
    document.getElementById(
        "rightCard"
    );


/* =========================
   CSV読込
========================= */

async function loadDictionary(){

    const response =
        await fetch(
            "/api/dictionary"
        );

    dictionary =
        await response.json();

    console.log(
        "dictionary loaded:",
        dictionary.length
    );
}


/* =========================
   シャッフル
========================= */

function shuffle(array){

    for(
        let i=array.length-1;
        i>0;
        i--
    ){

        const j=
        Math.floor(
            Math.random()*(i+1)
        );

        [
            array[i],
            array[j]
        ]
        =
        [
            array[j],
            array[i]
        ];
    }
}


/* =========================
   正規化
========================= */

function normalize(text){

    return text

    .trim()

    .replace(
        /[ァ-ヶ]/g,

        c=>
        String.fromCharCode(
            c.charCodeAt(0)-0x60
        )
    );
}


/* =========================
   濁点・半濁点・小文字
========================= */

function normalizeShiritoriChar(ch){

    const map={

        "ぁ":"あ",
        "ぃ":"い",
        "ぅ":"う",
        "ぇ":"え",
        "ぉ":"お",

        "ゃ":"や",
        "ゅ":"ゆ",
        "ょ":"よ",

        "っ":"つ",
        "ゎ":"わ",

        "が":"か",
        "ぎ":"き",
        "ぐ":"く",
        "げ":"け",
        "ご":"こ",

        "ざ":"さ",
        "じ":"し",
        "ず":"す",
        "ぜ":"せ",
        "ぞ":"そ",

        "だ":"た",
        "ぢ":"ち",
        "づ":"つ",
        "で":"て",
        "ど":"と",

        "ば":"は",
        "び":"ひ",
        "ぶ":"ふ",
        "べ":"へ",
        "ぼ":"ほ",

        "ぱ":"は",
        "ぴ":"ひ",
        "ぷ":"ふ",
        "ぺ":"へ",
        "ぽ":"ほ"
    };

    return map[ch] || ch;
}


/* =========================
   先頭文字
========================= */

function firstChar(word){

    const chars =
        [...normalize(word)];

    return normalizeShiritoriChar(
        chars[0]
    );
}


/* =========================
   末尾文字
========================= */

function lastChar(word){

    let chars =
        [...normalize(word)];

    while(

        chars.length>1 &&

        chars[
            chars.length-1
        ]==="ー"

    ){
        chars.pop();
    }

    let ch =
        chars[
            chars.length-1
        ];

    return normalizeShiritoriChar(
        ch
    );
}


/* =========================
   辞書存在判定
========================= */

function wordExists(word){

    const target =
        normalize(word);

    return dictionary.some(

        w=>

        normalize(w)
        ===
        target
    );
}


/* =========================
   解答可能か探索
   「ない」判定用
========================= */

function hasSolution(
    start,
    goal
){

    start =
        normalizeShiritoriChar(
            start
        );

    goal =
        normalizeShiritoriChar(
            goal
        );

    const visited =
        new Set();

    const queue =
        [start];

    while(
        queue.length > 0
    ){

        const current =
            queue.shift();

        if(
            current===goal
        ){
            return true;
        }

        if(
            visited.has(
                current
            )
        ){
            continue;
        }

        visited.add(
            current
        );

        for(
            const word of
            dictionary
        ){

            if(
                firstChar(word)
                ===
                current
            ){

                const next =
                    lastChar(
                        word
                    );

                if(
                    !visited.has(
                        next
                    )
                ){

                    queue.push(
                        next
                    );
                }
            }
        }
    }

    return false;
}


/* =========================
   ゲーム開始
========================= */

function startGame(){

    deck = [...cards];

    shuffle(deck);

    const mid =
        Math.ceil(
            deck.length/2
        );

    leftPile =
        deck.slice(
            0,
            mid
        );

    rightPile =
        deck.slice(
            mid
        );

    nextTurn();
}


/* =========================
   次の問題
========================= */

function nextTurn(){

    answerEl.value="";

    resultEl.textContent="";

    if(
        leftPile.length===0
        ||
        rightPile.length===0
    ){

        leftCardEl.textContent="終";

        rightCardEl.textContent="了";

        conditionEl.textContent=
            "ゲーム終了";

        return;
    }

    let left =
        leftPile.pop();

    let right =
        rightPile.pop();

    if(
        left==="同"
    ){
        left=right;
    }

    if(
        right==="同"
    ){
        right=left;
    }

    leftCardEl.textContent=
        left;

    rightCardEl.textContent=
        right;

    currentStart =
        normalizeShiritoriChar(
            left
        );

    goalChar =
        normalizeShiritoriChar(
            right
        );

    solved=false;

    conditionEl.textContent=
        `「${left}」から始めて「${right}」で終わるしりとり`;
}


/* =========================
   判定
========================= */

function judge(){

    if(
        solved
    ){
        return;
    }

    const answer =
        answerEl.value.trim();

    if(
        !answer
    ){
        return;
    }

    if(
    normalize(answer) === normalize("ナイ")
    ||
    answer === "無し"
){

        const solvable =

            hasSolution(
                currentStart,
                goalChar
            );

        if(
            solvable
        ){

            resultEl.textContent=
                "× 『ない』ではありません";

            resultEl.style.color=
                "red";
        }
        else{

            resultEl.textContent=
                "○ 正解（ない）";

            resultEl.style.color=
                "green";

            solved=true;
        }

        return;
    }

    if(
        !wordExists(answer)
    ){

        resultEl.textContent=
            "× 登録されていない国名・首都名";

        resultEl.style.color=
            "red";

        return;
    }

    const first =
        firstChar(
            answer
        );

    if(
        first !== currentStart
    ){

        resultEl.textContent=
            `× 「${currentStart}」で始めてください`;

        resultEl.style.color=
            "red";

        return;
    }

    const last =
        lastChar(
            answer
        );

    if(
        last===goalChar
    ){

        resultEl.textContent=
            `○ 正解！「${goalChar}」に到達`;

        resultEl.style.color=
            "green";

        solved=true;

        return;
    }

    currentStart =
        last;

    conditionEl.textContent=
        `次は「${currentStart}」から始める（目標:${goalChar}）`;

    resultEl.textContent=
        `○ 続行（次は ${currentStart}）`;

    resultEl.style.color=
        "blue";

    answerEl.value="";
}

/* =========================
   フリック入力データ

   配列の順番:
   0 = 上
   1 = 右
   2 = 下
   3 = 左
   4 = 中央
========================= */

const flickData = {

    "ア":[
        "ウ",
        "エ",
        "オ",
        "イ",
        "ア"
    ],

    "カ":[
        "ク",
        "ケ",
        "コ",
        "キ",
        "カ"
    ],

    "サ":[
        "ス",
        "セ",
        "ソ",
        "シ",
        "サ"
    ],

    "タ":[
        "ツ",
        "テ",
        "ト",
        "チ",
        "タ"
    ],

    "ナ":[
        "ヌ",
        "ネ",
        "ノ",
        "ニ",
        "ナ"
    ],

    "ハ":[
        "フ",
        "ヘ",
        "ホ",
        "ヒ",
        "ハ"
    ],

    "マ":[
        "ム",
        "メ",
        "モ",
        "ミ",
        "マ"
    ],

    "ヤ":[
        "ユ",
        "",
        "ヨ",
        "",
        "ヤ"
    ],

    "ラ":[
        "ル",
        "レ",
        "ロ",
        "リ",
        "ラ"
    ],

    "ワ":[
        "ン",
        "ー",
        "",
        "ヲ",
        "ワ"
    ]
};


/* =========================
   濁点・半濁点・小文字変換
========================= */

const transformChainMap = {

    "ア":["ア","ァ"],
    "イ":["イ","ィ"],
    "ウ":["ウ","ゥ","ヴ"],
    "エ":["エ","ェ"],
    "オ":["オ","ォ"],

    "カ":["カ","ガ"],
    "キ":["キ","ギ"],
    "ク":["ク","グ"],
    "ケ":["ケ","ゲ"],
    "コ":["コ","ゴ"],

    "サ":["サ","ザ"],
    "シ":["シ","ジ"],
    "ス":["ス","ズ"],
    "セ":["セ","ゼ"],
    "ソ":["ソ","ゾ"],

    "タ":["タ","ダ"],
    "チ":["チ","ヂ"],
    "ツ":["ツ","ッ","ヅ"],
    "テ":["テ","デ"],
    "ト":["ト","ド"],

    "ハ":["ハ","バ","パ"],
    "ヒ":["ヒ","ビ","ピ"],
    "フ":["フ","ブ","プ"],
    "ヘ":["ヘ","ベ","ペ"],
    "ホ":["ホ","ボ","ポ"],

    "ヤ":["ヤ","ャ"],
    "ユ":["ユ","ュ"],
    "ヨ":["ヨ","ョ"],

    "ワ":["ワ","ヮ"]
};


/* =========================
   フリック入力用変数
========================= */

let flickStartX = 0;
let flickStartY = 0;

let flickInputEnabled = false;


/* =========================
   回答欄に文字を追加
========================= */

function appendAnswerCharacter(character){

    if(
        !character
    ){
        return;
    }

    answerEl.value += character;

    answerEl.scrollLeft =
        answerEl.scrollWidth;
}


/* =========================
   マウス・タッチ移動量から
   フリック方向を判定
========================= */

function getFlickDirection(
    differenceX,
    differenceY
){

    const threshold = 25;

    if(
        Math.abs(differenceX) < threshold
        &&
        Math.abs(differenceY) < threshold
    ){

        return 4;
    }

    if(
        Math.abs(differenceX)
        >
        Math.abs(differenceY)
    ){

        if(
            differenceX > 0
        ){

            return 1;
        }

        return 3;
    }

    if(
        differenceY > 0
    ){

        return 2;
    }

    return 0;
}


/* =========================
   フリック開始
========================= */

function flickPointerDownHandler(event){

    if(
        !flickInputEnabled
    ){
        return;
    }

    event.preventDefault();

    flickStartX =
        event.clientX;

    flickStartY =
        event.clientY;

    if(
        event.currentTarget.setPointerCapture
    ){

        try{

            event.currentTarget.setPointerCapture(
                event.pointerId
            );

        }catch(error){

            console.log(
                "Pointer capture skipped"
            );
        }
    }
}


/* =========================
   フリック終了
========================= */

function flickPointerUpHandler(event){

    if(
        !flickInputEnabled
    ){
        return;
    }

    event.preventDefault();

    const differenceX =
        event.clientX - flickStartX;

    const differenceY =
        event.clientY - flickStartY;

    const direction =
        getFlickDirection(
            differenceX,
            differenceY
        );

    const base =
        event.currentTarget.dataset.char;

    const kanaList =
        flickData[base];

    if(
        !kanaList
    ){
        return;
    }

    const kana =
        kanaList[direction];

    appendAnswerCharacter(
        kana
    );
}


/* =========================
   フリック中のスクロール防止
========================= */

function flickPointerMoveHandler(event){

    if(
        flickInputEnabled
    ){

        event.preventDefault();
    }
}


/* =========================
   フリックボタン初期化
========================= */

function initializeFlickKeyboard(){

    const flickButtons =
        document.querySelectorAll(
            ".flick-btn"
        );

    flickButtons.forEach(
        button => {

            button.style.touchAction =
                "none";

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
                flickPointerMoveHandler
            );

            button.addEventListener(
                "contextmenu",
                event => {

                    event.preventDefault();
                }
            );
        }
    );
}


/* =========================
   フリック入力有効化
========================= */

function enableFlickInput(){

    flickInputEnabled = true;

    document
        .getElementById(
            "flick-grid"
        )
        .style.display =
            "grid";
}


/* =========================
   フリック入力無効化
========================= */

function disableFlickInput(){

    flickInputEnabled = false;

    document
        .getElementById(
            "flick-grid"
        )
        .style.display =
            "none";
}


/* =========================
   濁点・半濁点・小文字ボタン
========================= */

function modifyLastCharacter(){

    const value =
        answerEl.value;

    if(
        !value
    ){
        return;
    }

    const characters =
        [...value];

    const last =
        characters.pop();

    let targetChain = null;

    for(
        const chain of
        Object.values(
            transformChainMap
        )
    ){

        if(
            chain.includes(
                last
            )
        ){

            targetChain =
                chain;

            break;
        }
    }

    if(
        !targetChain
    ){
        return;
    }

    const currentIndex =
        targetChain.indexOf(
            last
        );

    const nextIndex =
        (
            currentIndex + 1
        )
        %
        targetChain.length;

    characters.push(
        targetChain[nextIndex]
    );

    answerEl.value =
        characters.join("");

    answerEl.scrollLeft =
        answerEl.scrollWidth;
}


/* =========================
   1文字削除
========================= */

function deleteLastCharacter(){

    const characters =
        [...answerEl.value];

    characters.pop();

    answerEl.value =
        characters.join("");

    answerEl.scrollLeft =
        answerEl.scrollWidth;
}


/* =========================
   ローマ字変換表
========================= */

const romajiToKanaMap = {

    "kya":"キャ",
    "kyu":"キュ",
    "kyo":"キョ",

    "sha":"シャ",
    "shu":"シュ",
    "she":"シェ",
    "sho":"ショ",

    "sya":"シャ",
    "syu":"シュ",
    "sye":"シェ",
    "syo":"ショ",

    "cha":"チャ",
    "chu":"チュ",
    "che":"チェ",
    "cho":"チョ",

    "tya":"チャ",
    "tyu":"チュ",
    "tye":"チェ",
    "tyo":"チョ",

    "nya":"ニャ",
    "nyu":"ニュ",
    "nyo":"ニョ",

    "hya":"ヒャ",
    "hyu":"ヒュ",
    "hyo":"ヒョ",

    "mya":"ミャ",
    "myu":"ミュ",
    "myo":"ミョ",

    "rya":"リャ",
    "ryu":"リュ",
    "ryo":"リョ",

    "gya":"ギャ",
    "gyu":"ギュ",
    "gyo":"ギョ",

    "ja":"ジャ",
    "ju":"ジュ",
    "je":"ジェ",
    "jo":"ジョ",

    "jya":"ジャ",
    "jyu":"ジュ",
    "jye":"ジェ",
    "jyo":"ジョ",

    "zya":"ジャ",
    "zyu":"ジュ",
    "zye":"ジェ",
    "zyo":"ジョ",

    "bya":"ビャ",
    "byu":"ビュ",
    "byo":"ビョ",

    "pya":"ピャ",
    "pyu":"ピュ",
    "pyo":"ピョ",

    "dya":"ヂャ",
    "dyu":"ヂュ",
    "dyo":"ヂョ",

    "fa":"ファ",
    "fi":"フィ",
    "fe":"フェ",
    "fo":"フォ",

    "fya":"ファ",
    "fyu":"フュ",
    "fyo":"フォ",

    "va":"ヴァ",
    "vi":"ヴィ",
    "vu":"ヴ",
    "ve":"ヴェ",
    "vo":"ヴォ",

    "tsa":"ツァ",
    "tsi":"ツィ",
    "tse":"ツェ",
    "tso":"ツォ",

    "thi":"ティ",
    "thu":"テュ",

    "dhi":"ディ",
    "dhu":"デュ",

    "twu":"トゥ",
    "dwu":"ドゥ",

    "kwa":"クァ",
    "kwi":"クィ",
    "kwe":"クェ",
    "kwo":"クォ",

    "gwa":"グァ",
    "gwi":"グィ",
    "gwe":"グェ",
    "gwo":"グォ",

    "shi":"シ",
    "chi":"チ",
    "tsu":"ツ",

    "si":"シ",
    "ti":"チ",
    "tu":"ツ",

    "fu":"フ",
    "hu":"フ",

    "wi":"ウィ",
    "we":"ウェ",
    "wo":"ヲ",

    "la":"ァ",
    "li":"ィ",
    "lu":"ゥ",
    "le":"ェ",
    "lo":"ォ",

    "xa":"ァ",
    "xi":"ィ",
    "xu":"ゥ",
    "xe":"ェ",
    "xo":"ォ",

    "lya":"ャ",
    "lyu":"ュ",
    "lyo":"ョ",

    "xya":"ャ",
    "xyu":"ュ",
    "xyo":"ョ",

    "ltu":"ッ",
    "xtu":"ッ",
    "ltsu":"ッ",
    "xtsu":"ッ",

    "a":"ア",
    "i":"イ",
    "u":"ウ",
    "e":"エ",
    "o":"オ",

    "ka":"カ",
    "ki":"キ",
    "ku":"ク",
    "ke":"ケ",
    "ko":"コ",

    "ca":"カ",
    "cu":"ク",
    "co":"コ",

    "sa":"サ",
    "su":"ス",
    "se":"セ",
    "so":"ソ",

    "ta":"タ",
    "te":"テ",
    "to":"ト",

    "na":"ナ",
    "ni":"ニ",
    "nu":"ヌ",
    "ne":"ネ",
    "no":"ノ",

    "ha":"ハ",
    "hi":"ヒ",
    "he":"ヘ",
    "ho":"ホ",

    "ma":"マ",
    "mi":"ミ",
    "mu":"ム",
    "me":"メ",
    "mo":"モ",

    "ya":"ヤ",
    "yu":"ユ",
    "yo":"ヨ",

    "ra":"ラ",
    "ri":"リ",
    "ru":"ル",
    "re":"レ",
    "ro":"ロ",

    "wa":"ワ",

    "ga":"ガ",
    "gi":"ギ",
    "gu":"グ",
    "ge":"ゲ",
    "go":"ゴ",

    "za":"ザ",
    "zi":"ジ",
    "ji":"ジ",
    "zu":"ズ",
    "ze":"ゼ",
    "zo":"ゾ",

    "da":"ダ",
    "di":"ヂ",
    "du":"ヅ",
    "de":"デ",
    "do":"ド",

    "ba":"バ",
    "bi":"ビ",
    "bu":"ブ",
    "be":"ベ",
    "bo":"ボ",

    "pa":"パ",
    "pi":"ピ",
    "pu":"プ",
    "pe":"ペ",
    "po":"ポ",

    "-":"ー"
};


/* =========================
   ローマ字入力用変数
========================= */

let romajiBuffer = "";

let physicalInputEnabled =
    false;

const vowels =
    new Set([
        "a",
        "i",
        "u",
        "e",
        "o"
    ]);

const sortedRomajiKeys =
    Object.keys(
        romajiToKanaMap
    )
    .sort(
        (a,b) =>
            b.length - a.length
    );


/* =========================
   指定文字列から始まる
   ローマ字パターンがあるか
========================= */

function hasRomajiPrefix(text){

    return sortedRomajiKeys.some(
        key =>
            key.startsWith(text)
    );
}


/* =========================
   ローマ字バッファ変換
========================= */

function processRomajiBuffer(
    forceComplete = false
){

    while(
        romajiBuffer.length > 0
    ){

        /*
         n単独は通常は次の文字待ち。
         Enter時はンとして確定する。
        */

        if(
            romajiBuffer === "n"
        ){

            if(
                forceComplete
            ){

                appendAnswerCharacter(
                    "ン"
                );

                romajiBuffer = "";
            }

            break;
        }


        /*
         n' はンとして確定
        */

        if(
            romajiBuffer.startsWith(
                "n'"
            )
        ){

            appendAnswerCharacter(
                "ン"
            );

            romajiBuffer =
                romajiBuffer.slice(2);

            continue;
        }


        /*
         nnの場合、最初のnをンとして確定。
         2文字目のnは次の「ナ行」に利用できる。
         例: konnichiha
        */

        if(
            romajiBuffer.startsWith(
                "nn"
            )
        ){

            appendAnswerCharacter(
                "ン"
            );

            romajiBuffer =
                romajiBuffer.slice(1);

            continue;
        }


        /*
         nの次が母音・y・n以外ならンとして確定
        */

        if(
            romajiBuffer[0] === "n"
            &&
            romajiBuffer.length >= 2
        ){

            const nextCharacter =
                romajiBuffer[1];

            if(
                !vowels.has(
                    nextCharacter
                )
                &&
                nextCharacter !== "y"
                &&
                nextCharacter !== "n"
            ){

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

        if(
            romajiBuffer.length >= 2
            &&
            romajiBuffer[0]
                ===
            romajiBuffer[1]
            &&
            !vowels.has(
                romajiBuffer[0]
            )
            &&
            romajiBuffer[0] !== "n"
        ){

            appendAnswerCharacter(
                "ッ"
            );

            romajiBuffer =
                romajiBuffer.slice(1);

            continue;
        }


        /*
         最長一致で変換
        */

        let matchedKey =
            null;

        for(
            const key of
            sortedRomajiKeys
        ){

            if(
                romajiBuffer.startsWith(
                    key
                )
            ){

                matchedKey =
                    key;

                break;
            }
        }

        if(
            matchedKey
        ){

            /*
             より長い候補の可能性がある場合は待つ。
             例: sを入力した直後
            */

            const exactIsAlsoPrefix =
                sortedRomajiKeys.some(
                    key =>
                        key.length
                            >
                        matchedKey.length
                        &&
                        key.startsWith(
                            romajiBuffer
                        )
                );

            if(
                !forceComplete
                &&
                romajiBuffer.length
                    ===
                matchedKey.length
                &&
                exactIsAlsoPrefix
            ){

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
         変換候補の接頭辞なら次のキーを待つ
        */

        if(
            !forceComplete
            &&
            hasRomajiPrefix(
                romajiBuffer
            )
        ){

            break;
        }


        /*
         Enter時、残ったnはンにする
        */

        if(
            forceComplete
            &&
            romajiBuffer[0] === "n"
        ){

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


/* =========================
   物理キーボード入力
========================= */

function physicalInputKeydownHandler(
    event
){

    if(
        !physicalInputEnabled
    ){
        return;
    }

    /*
     Enterで判定
    */

    if(
        event.key === "Enter"
    ){

        event.preventDefault();

        processRomajiBuffer(
            true
        );

        judge();

        return;
    }


    /*
     Backspaceで削除
    */

    if(
        event.key === "Backspace"
    ){

        event.preventDefault();

        if(
            romajiBuffer.length > 0
        ){

            romajiBuffer =
                romajiBuffer.slice(
                    0,
                    -1
                );

        }else{

            deleteLastCharacter();
        }

        return;
    }


    /*
     Escapeで入力欄を空にする
    */

    if(
        event.key === "Escape"
    ){

        event.preventDefault();

        romajiBuffer = "";

        answerEl.value = "";

        return;
    }


    /*
     Ctrlなどのショートカットは無視
    */

    if(
        event.ctrlKey
        ||
        event.altKey
        ||
        event.metaKey
    ){

        return;
    }


    /*
     アルファベット、ハイフン、
     アポストロフィだけ受け付ける
    */

    if(
        /^[a-zA-Z]$/.test(
            event.key
        )
        ||
        event.key === "-"
        ||
        event.key === "'"
    ){

        event.preventDefault();

        romajiBuffer +=
            event.key.toLowerCase();

        processRomajiBuffer(
            false
        );
    }
}


/* =========================
   ローマ字入力有効化
========================= */

function enablePhysicalInput(){

    physicalInputEnabled =
        true;

    romajiBuffer = "";

    document.addEventListener(
        "keydown",
        physicalInputKeydownHandler
    );

    answerEl.focus();
}


/* =========================
   ローマ字入力無効化
========================= */

function disablePhysicalInput(){

    physicalInputEnabled =
        false;

    romajiBuffer = "";

    document.removeEventListener(
        "keydown",
        physicalInputKeydownHandler
    );
}


/* =========================
   入力方法選択
========================= */

document
    .querySelectorAll(
        'input[name="inputMethod"]'
    )
    .forEach(
        radio => {

            radio.addEventListener(
                "change",
                event => {

                    inputMethod =
                        event.target.value;
                }
            );
        }
    );


/* =========================
   ゲーム開始ボタン
========================= */

document
    .getElementById(
        "startBtn"
    )
    .addEventListener(
        "click",
        async () => {

            const startButton =
                document.getElementById(
                    "startBtn"
                );

            startButton.disabled =
                true;

            startButton.textContent =
                "読み込み中…";

            try{

                await loadDictionary();

                if(
                    !Array.isArray(
                        dictionary
                    )
                    ||
                    dictionary.length === 0
                ){

                    throw new Error(
                        "辞書が空です"
                    );
                }

                document
                    .getElementById(
                        "startScreen"
                    )
                    .style.display =
                        "none";

                document
                    .getElementById(
                        "gameScreen"
                    )
                    .style.display =
                        "block";

                if(
                    inputMethod ===
                    "flick"
                ){

                    disablePhysicalInput();

                    enableFlickInput();

                    answerEl.readOnly =
                        true;

                    answerEl.setAttribute(
                        "inputmode",
                        "none"
                    );

                }else{

                    disableFlickInput();

                    enablePhysicalInput();

                    answerEl.readOnly =
                        true;

                    answerEl.setAttribute(
                        "inputmode",
                        "none"
                    );
                }

                startGame();

            }catch(error){

                console.error(
                    error
                );

                alert(
                    "辞書の読み込みに失敗しました。server.js と countries.csv を確認してください。"
                );

                startButton.disabled =
                    false;

                startButton.textContent =
                    "ゲーム開始";
            }
        }
    );


/* =========================
   判定ボタン
========================= */

document
    .getElementById(
        "checkBtn"
    )
    .addEventListener(
        "click",
        () => {

            if(
                inputMethod ===
                "romaji"
            ){

                processRomajiBuffer(
                    true
                );
            }

            judge();
        }
    );


/* =========================
   次の問題ボタン
========================= */

document
    .getElementById(
        "nextBtn"
    )
    .addEventListener(
        "click",
        () => {

            romajiBuffer = "";

            nextTurn();

            if(
                inputMethod ===
                "romaji"
            ){

                answerEl.focus();
            }
        }
    );


/* =========================
   濁点・小文字ボタン
========================= */

document
    .getElementById(
        "modifyBtn"
    )
    .addEventListener(
        "click",
        () => {

            if(
                inputMethod !==
                "flick"
            ){
                return;
            }

            modifyLastCharacter();
        }
    );


/* =========================
   削除ボタン
========================= */

document
    .getElementById(
        "deleteBtn"
    )
    .addEventListener(
        "click",
        () => {

            if(
                inputMethod !==
                "flick"
            ){
                return;
            }

            deleteLastCharacter();
        }
    );


/* =========================
   初期化
========================= */

initializeFlickKeyboard();

/*
 ゲーム開始前は、
 フリック入力もローマ字入力も無効。
*/

disableFlickInput();

disablePhysicalInput();