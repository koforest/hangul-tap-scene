"use strict";

const EMOJI_DIR = "emoji/";

const state = {
  scenes: [],
  sceneIndex: 0,
  rate: 1.0,
};

// --- 音声再生 ---
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ko-KR";
  utter.rate = state.rate;
  speechSynthesis.speak(utter);
}

// --- 速度トグル ---
function setupRateToggle() {
  const btn = document.getElementById("rate-toggle");
  const label = document.getElementById("rate-label");
  btn.addEventListener("click", () => {
    state.rate = state.rate === 1.0 ? 0.75 : 1.0;
    const slow = state.rate !== 1.0;
    btn.classList.toggle("slow", slow);
    label.textContent = slow ? "ゆっくり" : "ふつう";
  });
}

// --- シーン選択（プルダウン＋ランダム） ---
function setupNav() {
  const select = document.getElementById("scene-select");
  state.scenes.forEach((scene, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `${i + 1}. ${scene.title}`;
    select.appendChild(opt);
  });
  select.addEventListener("change", () => showScene(Number(select.value)));

  document.getElementById("random-scene").addEventListener("click", () => {
    let i;
    do {
      i = Math.floor(Math.random() * state.scenes.length);
    } while (i === state.sceneIndex && state.scenes.length > 1);
    showScene(i);
  });
}

// --- シーン描画 ---
function showScene(index) {
  state.sceneIndex = index;
  const scene = state.scenes[index];

  document.getElementById("scene-select").value = index;
  document.getElementById("scene-title").textContent = scene.title;
  document.getElementById("result").hidden = true;

  const chunksEl = document.getElementById("chunks");
  chunksEl.innerHTML = "";
  let doneCount = 0;

  scene.chunks.forEach((chunk) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chunk";
    btn.innerHTML = `<span class="ko">${chunk.korean}</span><span class="ja"></span>`;
    btn.addEventListener("click", () => {
      speak(chunk.korean);
      if (!btn.classList.contains("done")) {
        btn.classList.add("done");
        btn.querySelector(".ja").textContent = chunk.japanese;
        doneCount++;
        if (doneCount === scene.chunks.length) showResult(scene);
      }
    });
    chunksEl.appendChild(btn);
  });
}

// --- リザルト展開 ---
function showResult(scene) {
  const { full_korean, full_japanese, visuals } = scene.result;

  const stage = document.getElementById("stage");
  stage.className = `stage layout-${visuals.layout} anim-${visuals.animation}`;
  stage.innerHTML = "";
  visuals.icons.forEach((file) => {
    const img = document.createElement("img");
    img.src = EMOJI_DIR + file;
    img.alt = "";
    stage.appendChild(img);
  });

  document.getElementById("full-korean").textContent = full_korean;
  document.getElementById("full-japanese").textContent = full_japanese;
  document.getElementById("result").hidden = false;
  document.getElementById("result").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// --- イベント設定と初期化 ---
function init() {
  setupRateToggle();
  // データは data.js（<script> で先に読み込み済み）から取得する。
  // fetch を使うと file:// で開いたときに失敗するため使わない。
  state.scenes = window.SCENES_DATA.scenes;
  setupNav();

  document.getElementById("replay").addEventListener("click", () => {
    speak(state.scenes[state.sceneIndex].result.full_korean);
  });

  document.getElementById("next-scene").addEventListener("click", () => {
    showScene((state.sceneIndex + 1) % state.scenes.length);
  });

  showScene(0);
}

try {
  init();
} catch (err) {
  document.getElementById("app").insertAdjacentHTML(
    "afterbegin",
    `<p style="color:#c00;text-align:center;">読み込みに失敗しました: ${err.message}</p>`
  );
  throw err;
}
